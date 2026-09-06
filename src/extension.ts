import * as vscode from "vscode";
import { randomInt } from "node:crypto";
import { adjustLightness, generatedCandidates, parseHex } from "./domain/colors";
import { allPresets, normalizeName, validatePresetName } from "./domain/presets";
import type { Preset } from "./domain/presets";
import { PARTS } from "./domain/settings";
import type { PartId, Preferences } from "./domain/settings";
import { partForKey, renderColors } from "./domain/surfaces";
import { SettingsWriter } from "./storage/writer";
import { PeerCoordinator } from "./peers";
import { PreviewScheduler } from "./preview";
import { choosePreset, enterHex } from "./controls";
import type { ColorControl } from "./controls";
import { VscodeConfiguration, VscodeState, workspaceIdentity } from "./vscode-adapter";
import type { ConfigurationSnapshot } from "./vscode-adapter";

export interface ExtensionState {
    readonly color: string | undefined;
    readonly historySize: number;
    readonly recoveryBlocked: boolean;
}

/** Programmatic operations use the same validation and recovery path as native controls. */
export interface ExtensionApi {
    readonly setColor: (input: string) => Promise<void>;
    readonly previewColor: (input: string) => Promise<void>;
    readonly cancelPreview: () => Promise<void>;
    readonly reset: () => Promise<void>;
    readonly undo: () => Promise<void>;
    readonly retryRecovery: () => Promise<void>;
    readonly getState: () => ExtensionState;
}

class Controller {
    private readonly configuration = new VscodeConfiguration();
    private readonly log = vscode.window.createOutputChannel("iroiro iro", { log: true });
    private readonly status = vscode.window.createStatusBarItem("iroiroIro.color", vscode.StatusBarAlignment.Left, 10);
    private readonly writer: SettingsWriter;
    private settings: ConfigurationSnapshot;
    private peers: PeerCoordinator | undefined;
    private identity: string | undefined;
    private queue: Promise<void> = Promise.resolve();
    private cancelControl: (() => void) | undefined;
    private activePreview: PreviewScheduler | undefined;
    private readonly suspendedParts = new Set<PartId>();
    private readonly notices = new Set<string>();
    private readonly subscriptions: vscode.Disposable[] = [];
    private ready = false;
    private disposed = false;

    public constructor(private readonly context: vscode.ExtensionContext) {
        this.settings = this.configuration.readPreferences();
        if (this.settings.issues.length > 0) {
            this.log.warn("invalid_configuration_entries");
        }
        const allParts = { ...this.settings.preferences.coloredParts };
        for (const part of PARTS) {
            allParts[part.id] = true;
        }
        const keys = Object.keys(renderColors("#008000", { ...this.settings.preferences, coloredParts: allParts }));
        this.writer = new SettingsWriter(
            this.configuration,
            new VscodeState(context.workspaceState),
            keys,
            (message) => {
                // Component diagnostics contain fixed event codes, never settings data.
                this.log.warn(message);
            },
        );
        this.status.name = "iroiro iro workspace color";
        this.status.command = "iroiroIro.chooseColor";
        this.status.accessibilityInformation = { label: "iroiro iro workspace color", role: "button" };
    }

    public async start(): Promise<void> {
        const handlers: Readonly<Record<string, () => Promise<void>>> = {
            chooseColor: () => this.choose("preset"),
            enterHexColor: () => this.choose("hex"),
            randomColor: () => this.random("generated"),
            randomPreset: () => this.random("presets"),
            lighten: () => this.adjust(1),
            darken: () => this.adjust(-1),
            savePreset: () => this.savePreset(),
            renamePreset: () => this.modifyPreset("rename"),
            editPreset: () => this.modifyPreset("edit"),
            deletePreset: () => this.modifyPreset("delete"),
            chooseParts: () => this.chooseParts(),
            undo: () => this.undo(),
            reset: () => this.reset(),
            enableAutoColor: () => this.changeAutomatic(true),
            disableAutoColor: () => this.changeAutomatic(false),
            openSettings: () => this.openSettings(),
            retryRecovery: () => this.retryRecovery(),
        };
        for (const [name, handler] of Object.entries(handlers)) {
            this.subscriptions.push(vscode.commands.registerCommand(`iroiroIro.${name}`, () => this.perform(handler)));
        }
        this.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((event) => this.configurationChanged(event)),
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                this.cancelControl?.();
                this.perform(() => this.refreshWorkspace()).catch(() => this.log.error("workspace_refresh_failed"));
            }),
        );
        await this.refreshWorkspace();
        this.ready = true;
    }

    public api(): ExtensionApi {
        return {
            setColor: (input) => this.perform(() => this.setColor(this.validatedColor(input))),
            previewColor: (input) =>
                this.perform(async () => {
                    this.requireWorkspace();
                    const color = this.validatedColor(input);
                    await this.writer.begin();
                    await this.writer.applyPreview(this.colors(color, true));
                }),
            cancelPreview: () =>
                this.perform(async () => {
                    await this.writer.cancel();
                    this.updateStatus();
                }),
            reset: () => this.perform(() => this.reset()),
            undo: () => this.perform(() => this.undo()),
            retryRecovery: () => this.perform(() => this.retryRecovery()),
            getState: () => ({
                color: this.current(),
                historySize: this.writer.historySize,
                recoveryBlocked: this.writer.isBlocked,
            }),
        };
    }

    public async dispose(): Promise<void> {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.cancelControl?.();
        await this.activePreview?.close();
        await this.queue;
        try {
            await this.writer.cancel();
        } catch {
            this.log.error("deactivation_recovery_pending");
        }
        await this.peers?.dispose();
        for (const subscription of this.subscriptions) {
            subscription.dispose();
        }
        this.status.dispose();
        this.log.dispose();
    }

    private perform(action: () => Promise<void>, cancelActive = true): Promise<void> {
        if (cancelActive) {
            this.cancelControl?.();
        }
        const operation = this.queue.then(async () => {
            if (this.disposed) {
                return;
            }
            try {
                await action();
            } catch (error: unknown) {
                this.failure(error);
                throw error;
            }
        });
        // Preserve rejection for API callers without poisoning the operation queue.
        this.queue = operation.catch(() => {});
        return operation;
    }

    private current(): string | undefined {
        return parseHex(this.configuration.readSetting("iroiroIro.color"));
    }

    private validatedColor(input: unknown): string {
        const color = parseHex(input);
        if (color === undefined) {
            throw new Error("invalid_color");
        }
        return color;
    }

    private requireWorkspace(): void {
        if (workspaceIdentity() === undefined) {
            this.notice("no_workspace", "Open a folder or a workspace before you change its color.");
            throw new Error("no_workspace");
        }
    }

    private refreshSettings(): void {
        const next = this.configuration.readPreferences();
        if (next.issues.length > 0 && next.revision !== this.settings.revision) {
            this.log.warn("invalid_configuration_entries");
        }
        this.settings = next;
    }

    private async refreshWorkspace(): Promise<void> {
        const identity = workspaceIdentity();
        if (identity !== this.identity) {
            await this.peers?.dispose();
            this.peers = undefined;
            this.identity = identity;
            this.suspendedParts.clear();
            if (identity !== undefined && this.context.globalStorageUri.scheme === "file") {
                this.peers = new PeerCoordinator(this.context.globalStorageUri.fsPath, identity, (message) =>
                    this.log.warn(message),
                );
            }
        }
        this.refreshSettings();
        if (identity !== undefined) {
            try {
                await this.writer.initialize();
                if (this.writer.isBlocked) {
                    this.failure(new Error("recovery_blocked"));
                } else {
                    await this.restoreOrAssign();
                }
            } catch (error: unknown) {
                this.failure(error);
            }
        }
        this.updateStatus();
    }

    private async restoreOrAssign(): Promise<void> {
        if (workspaceIdentity() === undefined || this.writer.isBlocked) {
            return;
        }
        const value = this.configuration.readSetting("iroiroIro.color");
        const color = parseHex(value);
        if (color !== undefined) {
            await this.writer.reapply(this.colors(color, false), color);
            await this.peers?.publish(color);
        } else if (value !== undefined && value !== "") {
            this.notice(
                "invalid_saved_color",
                "The saved workspace color is invalid. Enter a hex color or use Reset Workspace Colors.",
            );
        } else if (this.settings.preferences.autoColorEnabled) {
            await this.random(this.settings.preferences.autoColorSource);
        }
        this.updateStatus();
    }

    private colors(
        color: string,
        manual: boolean,
        preferences = this.settings.preferences,
    ): Readonly<Record<string, string>> {
        const parts = { ...preferences.coloredParts };
        if (!manual) {
            for (const part of this.suspendedParts) {
                parts[part] = false;
            }
        }
        const rendered = { ...renderColors(color, { ...preferences, coloredParts: parts }) };
        const window = vscode.workspace.getConfiguration("window");
        const native = window.get<unknown>("titleBarStyle") === "native";
        for (const key of Object.keys(rendered)) {
            if (
                (native && key.startsWith("titleBar.")) ||
                (key.startsWith("window.") &&
                    (process.platform === "win32" ? window.get<unknown>("border") !== "default" : native))
            ) {
                delete rendered[key];
            }
        }
        return rendered;
    }

    private async setColor(color: string): Promise<void> {
        this.requireWorkspace();
        this.refreshSettings();
        await this.writer.commit(this.colors(color, true), color);
        this.suspendedParts.clear();
        await this.peers?.publish(color);
        this.updateStatus();
    }

    private async choose(kind: "preset" | "hex"): Promise<void> {
        this.requireWorkspace();
        this.refreshSettings();
        if (this.writer.isBlocked) {
            throw new Error("recovery_blocked");
        }
        const enabled = this.settings.preferences.previewEnabled;
        if (enabled) {
            await this.writer.begin();
        }
        const scheduler = new PreviewScheduler(
            async (color) => {
                await this.writer.begin();
                await this.writer.applyPreview(this.colors(color, true));
            },
            (error) => {
                this.failure(error);
                this.cancelControl?.();
            },
        );
        this.activePreview = scheduler;
        const control: ColorControl = {
            change: (color) => {
                if (enabled && color !== undefined) {
                    scheduler.schedule(color);
                } else {
                    scheduler.discardPending();
                }
            },
            registerCancellation: (cancel) => {
                this.cancelControl = cancel;
            },
        };
        try {
            const color =
                kind === "preset"
                    ? await choosePreset(allPresets(this.settings.presets), this.current(), control)
                    : await enterHex(this.current(), control);
            this.cancelControl = undefined;
            await scheduler.close();
            if (color === undefined || workspaceIdentity() === undefined) {
                await this.writer.cancel();
            } else {
                await this.setColor(color);
            }
        } finally {
            this.cancelControl = undefined;
            await scheduler.close();
            this.activePreview = undefined;
            if (this.writer.isPreviewing) {
                await this.writer.cancel();
            }
            this.updateStatus();
        }
    }

    private async random(source: "presets" | "generated"): Promise<void> {
        this.requireWorkspace();
        this.refreshSettings();
        const candidates =
            source === "presets"
                ? [...new Set(allPresets(this.settings.presets).map((preset) => preset.value))]
                : generatedCandidates(randomInt);
        const peers = this.peers;
        let color: string | undefined;
        if (peers !== undefined) {
            color = await peers.choose(candidates, this.current(), this.settings.preferences.preferDistinctColors);
        } else {
            const alternatives = candidates.filter((value) => value !== this.current());
            const available = alternatives.length > 0 ? alternatives : candidates;
            color = available[randomInt(0, available.length)];
        }
        if (color === undefined) {
            throw new Error("empty_color_pool");
        }
        try {
            await this.setColor(color);
        } catch (error: unknown) {
            await peers?.publish(this.current());
            throw error;
        }
    }

    private async requireColor(): Promise<string | undefined> {
        this.requireWorkspace();
        const color = this.current();
        if (color === undefined) {
            const choice = await vscode.window.showInformationMessage(
                "Select a workspace color first.",
                "Choose Color",
            );
            if (choice === "Choose Color") {
                await this.choose("preset");
            }
        }
        return color;
    }

    private async adjust(direction: 1 | -1): Promise<void> {
        const color = await this.requireColor();
        if (color === undefined) {
            return;
        }
        this.refreshSettings();
        const next = adjustLightness(color, direction * this.settings.preferences.adjustmentStep);
        if (next === color) {
            await vscode.window.showInformationMessage("The color is at the adjustment limit.");
            return;
        }
        await this.setColor(next);
    }

    private async savePreset(): Promise<void> {
        const color = await this.requireColor();
        if (color === undefined) {
            return;
        }
        this.refreshSettings();
        if (this.settings.presets.length >= 1000) {
            await vscode.window.showInformationMessage(
                "The custom preset list is full. Delete a preset before you add another.",
            );
            return;
        }
        const name = await this.presetName();
        if (name === undefined) {
            return;
        }
        this.refreshSettings();
        const error = validatePresetName(name, allPresets(this.settings.presets));
        if (error !== undefined || this.settings.presets.length >= 1000) {
            throw new Error("preset_list_changed");
        }
        await this.writePresets([...this.settings.presets, { name: name.trim().normalize("NFC"), value: color }]);
    }

    private async presetName(existing?: Preset): Promise<string | undefined> {
        return await vscode.window.showInputBox({
            title: existing === undefined ? "iroiro iro: Save Current Color" : "iroiro iro: Rename Preset",
            prompt: "Enter a unique name with 1 to 64 characters.",
            value: existing?.name ?? "",
            ignoreFocusOut: false,
            validateInput: (value) => validatePresetName(value, allPresets(this.settings.presets), existing?.name),
        });
    }

    private async modifyPreset(mode: "rename" | "edit" | "delete"): Promise<void> {
        this.refreshSettings();
        const selected = await vscode.window.showQuickPick(
            this.settings.presets.map((preset) => ({
                label: preset.name,
                description: preset.value,
                preset,
            })),
            {
                title: `iroiro iro: ${mode === "rename" ? "Rename Preset" : mode === "edit" ? "Edit Preset Color" : "Delete Preset"}`,
                placeHolder: "Select a custom preset",
                ignoreFocusOut: false,
            },
        );
        if (selected === undefined) {
            return;
        }
        const original = selected.preset;
        let replacement: Preset | undefined;
        switch (mode) {
            case "rename": {
                const name = await this.presetName(original);
                if (name === undefined) {
                    return;
                }
                replacement = { name: name.trim().normalize("NFC"), value: original.value };
                break;
            }
            case "edit": {
                const value = await enterHex(original.value, undefined, "iroiro iro: Edit Preset Color");
                if (value === undefined) {
                    return;
                }
                replacement = { name: original.name, value };
                break;
            }
            case "delete":
                replacement = undefined;
                break;
        }
        this.refreshSettings();
        const index = this.settings.presets.findIndex(
            (preset) => normalizeName(preset.name) === normalizeName(original.name),
        );
        if (index < 0 || this.settings.presets[index]?.value !== original.value) {
            throw new Error("preset_list_changed");
        }
        if (
            replacement !== undefined &&
            validatePresetName(replacement.name, allPresets(this.settings.presets), original.name) !== undefined
        ) {
            throw new Error("preset_list_changed");
        }
        const next = [...this.settings.presets];
        next.splice(index, 1, ...(replacement === undefined ? [] : [replacement]));
        await this.writePresets(next);
    }

    private async writePresets(presets: readonly Preset[]): Promise<void> {
        await vscode.workspace
            .getConfiguration("iroiroIro")
            .update("presets", presets, vscode.ConfigurationTarget.Global);
        this.refreshSettings();
        this.updateStatus();
    }

    private async chooseParts(): Promise<void> {
        this.requireWorkspace();
        this.refreshSettings();
        const selection = await vscode.window.showQuickPick(
            PARTS.map((part) => ({
                label: part.label,
                id: part.id,
                picked: this.settings.preferences.coloredParts[part.id],
                description: this.partDescription(part.id),
            })),
            {
                title: "iroiro iro: Choose Colored Parts",
                placeHolder: "Select the parts to color. Clear all selections to color no parts.",
                canPickMany: true,
                ignoreFocusOut: false,
            },
        );
        if (selection === undefined) {
            return;
        }
        const selected = new Set(selection.map((item) => item.id));
        const coloredParts = { ...this.settings.preferences.coloredParts };
        for (const part of PARTS) {
            coloredParts[part.id] = selected.has(part.id);
        }
        const preferences: Preferences = { ...this.settings.preferences, coloredParts };
        const color = this.current();
        if (
            color === undefined &&
            this.configuration.readSetting("iroiroIro.color") !== undefined &&
            this.configuration.readSetting("iroiroIro.color") !== ""
        ) {
            throw new Error("invalid_color");
        }
        await this.writer.commit(color === undefined ? {} : this.colors(color, true, preferences), color, {
            "iroiroIro.coloredParts": coloredParts,
        });
        this.refreshSettings();
        this.updateStatus();
    }

    private partDescription(part: PartId): string {
        if (part === "titleBar" || part === "titleBarBorder") {
            return "Native title bars keep operating system colors. Command Center colors can still apply.";
        }
        if (part === "windowBorder") {
            return "Windows needs window.border: default. macOS and Linux need a custom title bar.";
        }
        if (part === "sashHover") {
            return "Visible while the pointer is over a divider.";
        }
        return "Hidden parts stay hidden. Experimental Modern UI color support is not verified.";
    }

    private async reset(): Promise<void> {
        this.requireWorkspace();
        await this.writer.reset();
        this.suspendedParts.clear();
        await this.peers?.publish(undefined);
        this.refreshSettings();
        this.updateStatus();
    }

    private async undo(): Promise<void> {
        this.requireWorkspace();
        if (!(await this.writer.undo())) {
            await vscode.window.showInformationMessage("No earlier color change is available in this window session.");
        }
        this.refreshSettings();
        await this.peers?.publish(this.current());
        this.updateStatus();
    }

    private async retryRecovery(): Promise<void> {
        this.requireWorkspace();
        await this.writer.retryRecovery();
        this.refreshSettings();
        await this.restoreOrAssign();
        this.updateStatus();
    }

    private async changeAutomatic(enabled: boolean): Promise<void> {
        const scope = await vscode.window.showQuickPick(
            [
                { label: "This workspace", target: vscode.ConfigurationTarget.Workspace },
                { label: "User default", target: vscode.ConfigurationTarget.Global },
            ],
            {
                title: `iroiro iro: ${enabled ? "Enable" : "Disable"} Automatic Color`,
                placeHolder: "Select the setting scope. A workspace value has priority.",
                ignoreFocusOut: false,
            },
        );
        if (scope === undefined) {
            return;
        }
        if (scope.target === vscode.ConfigurationTarget.Workspace) {
            this.requireWorkspace();
            await this.writer.updatePreferences({ "iroiroIro.autoColor.enabled": enabled });
        } else {
            await vscode.workspace
                .getConfiguration("iroiroIro")
                .update("autoColor.enabled", enabled, vscode.ConfigurationTarget.Global);
        }
        this.refreshSettings();
        await this.restoreOrAssign();
    }

    private async openSettings(): Promise<void> {
        await vscode.commands.executeCommand<unknown>("workbench.action.openSettings", "@ext:russellsch.iroiro-iro");
    }

    private configurationChanged(event: vscode.ConfigurationChangeEvent): void {
        const layoutChanged =
            event.affectsConfiguration("window.titleBarStyle") || event.affectsConfiguration("window.border");
        if (
            !this.ready ||
            this.disposed ||
            this.writer.isWriting ||
            !(
                event.affectsConfiguration("iroiroIro") ||
                event.affectsConfiguration("workbench.colorCustomizations") ||
                layoutChanged
            )
        ) {
            return;
        }
        const changed = this.writer.externalChange();
        const next = this.configuration.readPreferences();
        if (changed.length === 0 && next.revision === this.settings.revision && !layoutChanged) {
            return;
        }
        const primaryChanged = event.affectsConfiguration("iroiroIro.color");
        for (const key of changed) {
            const part = partForKey(key);
            if (part !== undefined && !primaryChanged) {
                this.suspendedParts.add(part);
                this.notice(
                    `conflict_${part}`,
                    `Another settings change controls ${PARTS.find((entry) => entry.id === part)?.label ?? part}. Select a color to control this part again.`,
                );
            }
        }
        const invalidatesPreview =
            layoutChanged ||
            changed.some((key) => partForKey(key) !== undefined || key === "iroiroIro.color") ||
            event.affectsConfiguration("iroiroIro.coloredParts") ||
            event.affectsConfiguration("iroiroIro.adjustments") ||
            event.affectsConfiguration("iroiroIro.adjustmentStep") ||
            event.affectsConfiguration("iroiroIro.preview.enabled");
        this.perform(async () => {
            if (invalidatesPreview) {
                await this.writer.cancel();
            }
            this.refreshSettings();
            await this.restoreOrAssign();
        }, invalidatesPreview).catch(() => this.log.error("configuration_refresh_failed"));
    }

    private updateStatus(): void {
        if (!this.settings.preferences.statusBarItemEnabled || workspaceIdentity() === undefined) {
            this.status.hide();
            return;
        }
        if (this.writer.isBlocked) {
            this.status.text = "$(warning) iroiro iro: Recovery needed";
            this.status.tooltip = "Restore access to workspace settings, then select Retry Recovery.";
            this.status.command = "iroiroIro.retryRecovery";
            this.status.show();
            return;
        }
        this.status.command = "iroiroIro.chooseColor";
        const color = this.current();
        const name = allPresets(this.settings.presets).find((preset) => preset.value === color)?.name;
        this.status.text =
            color === undefined
                ? "$(symbol-color) Choose color"
                : `$(symbol-color) ${name === undefined ? "" : `${name} `}${color}`;
        this.status.tooltip = "iroiro iro: Choose Color";
        this.status.show();
    }

    private notice(code: string, message: string): void {
        if (this.notices.has(code)) {
            return;
        }
        this.notices.add(code);
        vscode.window
            .showInformationMessage(message)
            .then(undefined, (_error: unknown) => this.log.error("notification_failed"));
    }

    private failure(error: unknown): void {
        const code =
            error instanceof Error && ["no_workspace", "invalid_color", "preset_list_changed"].includes(error.message)
                ? error.message
                : "settings_operation_failed";
        this.log.error(code);
        this.updateStatus();
        if (code === "no_workspace" || this.notices.has(code)) {
            return;
        }
        this.notices.add(code);
        const message =
            code === "preset_list_changed"
                ? "The preset list changed. Open the preset command again."
                : code === "invalid_color"
                  ? "Enter a valid three-digit or six-digit hex color."
                  : "The color change failed. Check workspace settings and file access, then retry recovery.";
        vscode.window.showErrorMessage(message, "Retry Recovery", "Open Workspace Settings").then(
            (choice) => {
                if (choice === "Retry Recovery") {
                    this.perform(() => this.retryRecovery()).catch(() => this.log.error("recovery_retry_failed"));
                } else if (choice === "Open Workspace Settings") {
                    vscode.commands
                        .executeCommand<unknown>("workbench.action.openWorkspaceSettingsFile")
                        .then(undefined, (_error: unknown) => this.log.error("open_settings_failed"));
                }
            },
            (_error: unknown) => this.log.error("notification_failed"),
        );
    }
}

let controller: Controller | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<ExtensionApi> {
    const instance = new Controller(context);
    controller = instance;
    await instance.start();
    return instance.api();
}

export async function deactivate(): Promise<void> {
    const instance = controller;
    controller = undefined;
    await instance?.dispose();
}
