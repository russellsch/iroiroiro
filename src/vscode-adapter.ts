import * as vscode from "vscode";
import type { ConfigurationPort, StatePort } from "./storage/writer";
import { parsePreferences } from "./domain/settings";
import type { Preferences } from "./domain/settings";
import { readCustomPresets } from "./domain/presets";
import type { Preset } from "./domain/presets";

const preferenceKeys = [
    "autoColor.enabled",
    "autoColor.source",
    "preferDistinctColors",
    "adjustmentStep",
    "coloredParts",
    "adjustments",
    "preview.enabled",
    "statusBarItem.enabled",
] as const;

export interface ConfigurationSnapshot {
    readonly preferences: Preferences;
    readonly presets: readonly Preset[];
    readonly issues: readonly string[];
    readonly revision: string;
}

/** Use the window scope; never use a remote URI as a local filesystem path. */
export class VscodeConfiguration implements ConfigurationPort {
    public readColors(): unknown {
        return vscode.workspace.getConfiguration("workbench").inspect<unknown>("colorCustomizations")?.workspaceValue;
    }

    public readEffectiveColors(): unknown {
        return vscode.workspace.getConfiguration("workbench").get<unknown>("colorCustomizations");
    }

    public readSetting(key: string): unknown {
        return vscode.workspace.getConfiguration().inspect<unknown>(key)?.workspaceValue;
    }

    public async writeColors(value: Readonly<Record<string, unknown>> | undefined): Promise<void> {
        await vscode.workspace
            .getConfiguration("workbench")
            .update("colorCustomizations", value, vscode.ConfigurationTarget.Workspace);
    }

    public async writeSetting(key: string, value: unknown): Promise<void> {
        await vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Workspace);
    }

    public readPreferences(): ConfigurationSnapshot {
        const configuration = vscode.workspace.getConfiguration("iroiroIro");
        const raw: Record<string, unknown> = {};
        for (const key of preferenceKeys) {
            raw[key] = configuration.get<unknown>(key);
        }
        const custom = configuration.inspect<unknown>("presets")?.globalValue;
        const parsed = parsePreferences(raw);
        const presets = readCustomPresets(custom);
        return {
            preferences: parsed.preferences,
            presets: presets.presets,
            issues: [...parsed.issues, ...presets.issues],
            revision: JSON.stringify([raw, custom]),
        };
    }
}

export class VscodeState implements StatePort {
    public constructor(private readonly state: vscode.Memento) {}

    public read(): unknown {
        return this.state.get<unknown>("appearance.v1");
    }

    public async write(value: unknown): Promise<void> {
        await this.state.update("appearance.v1", value);
    }
}

export function workspaceIdentity(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (folders === undefined || folders.length === 0) {
        return undefined;
    }
    return (vscode.workspace.workspaceFile ?? folders[0]?.uri)?.toString();
}
