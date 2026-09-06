import assert from "node:assert/strict";
import * as vscode from "vscode";

import { BUILTIN_PRESETS } from "../src/domain/presets";
import type { ExtensionApi } from "../src/extension";
import { VscodeConfiguration } from "../src/vscode-adapter";

const CONFIGURATION_TIMEOUT_MS = 5_000;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function workspaceColors(): Readonly<Record<string, unknown>> {
    const value = vscode.workspace
        .getConfiguration("workbench")
        .inspect<unknown>("colorCustomizations")?.workspaceValue;
    return isRecord(value) ? value : {};
}

function colorValue(key: string): unknown {
    const colors = workspaceColors();
    return Object.hasOwn(colors, key) ? colors[key] : undefined;
}

function waitFor(predicate: () => boolean, description: string): Promise<void> {
    if (predicate()) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error?: Error): void => {
            if (settled) {
                return;
            }
            settled = true;
            clearInterval(poll);
            clearTimeout(timeout);
            subscription.dispose();
            if (error === undefined) {
                resolve();
            } else {
                reject(error);
            }
        };
        const check = (): void => {
            if (predicate()) {
                finish();
            }
        };
        const subscription = vscode.workspace.onDidChangeConfiguration(check);
        const poll = setInterval(check, 10);
        const timeout = setTimeout(
            () => finish(new Error(`Timed out while waiting for ${description}.`)),
            CONFIGURATION_TIMEOUT_MS,
        );
    });
}

async function update(section: string, key: string, value: unknown, target: vscode.ConfigurationTarget): Promise<void> {
    await vscode.workspace.getConfiguration(section).update(key, value, target);
}

async function command(id: string): Promise<void> {
    await vscode.commands.executeCommand<unknown>(id);
}

/** Runs observable host checks without opening Quick Picks, Input Boxes, or settings editors. */
export async function runBehavior(api: ExtensionApi): Promise<void> {
    const extension = vscode.workspace.getConfiguration("iroiroIro");

    await api.setColor("#224466");
    await api.previewColor("#abcdef");
    assert.equal(api.getState().color, "#224466");
    const previewColors = workspaceColors();
    await update(
        "workbench",
        "colorCustomizations",
        { ...previewColors, "activityBar.background": "#010203" },
        vscode.ConfigurationTarget.Workspace,
    );
    await waitFor(
        () => colorValue("activityBar.background") === "#010203" && colorValue("activityBar.foreground") === undefined,
        "external activity bar ownership to suspend the complete part",
    );
    assert.equal(api.getState().color, "#224466", "An external appearance edit does not replace the saved color.");

    await update("workbench", "colorCustomizations", undefined, vscode.ConfigurationTarget.Workspace);
    await waitFor(() => Object.keys(workspaceColors()).length === 0, "external appearance values to clear");
    await api.setColor("#345678");
    assert.equal(colorValue("statusBar.background"), "#345678");

    let idleConfigurationEvents = 0;
    const idleListener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("iroiroIro") || event.affectsConfiguration("workbench.colorCustomizations")) {
            idleConfigurationEvents += 1;
        }
    });
    try {
        api.getState();
        api.getState();
        await vscode.commands.executeCommand<unknown>("setContext", "iroiroIro.integrationIdleBarrier", true);
        assert.equal(idleConfigurationEvents, 0, "Idle state reads must not write workspace configuration.");
    } finally {
        idleListener.dispose();
    }

    await update(
        "iroiroIro",
        "presets",
        [{ name: "Global integration preset", value: "#13579b" }],
        vscode.ConfigurationTarget.Global,
    );
    await update(
        "iroiroIro",
        "presets",
        [{ name: "Workspace integration preset", value: "#2468ac" }],
        vscode.ConfigurationTarget.Workspace,
    );
    const adapterPresets = new VscodeConfiguration().readPreferences().presets;
    assert.deepEqual(adapterPresets, [{ name: "Global integration preset", value: "#13579b" }]);
    await update("iroiroIro", "presets", undefined, vscode.ConfigurationTarget.Workspace);
    await update("iroiroIro", "presets", [], vscode.ConfigurationTarget.Global);

    await update("iroiroIro", "autoColor.enabled", false, vscode.ConfigurationTarget.Global);
    await update("iroiroIro", "autoColor.enabled", undefined, vscode.ConfigurationTarget.Workspace);
    await api.reset();
    assert.equal(api.getState().color, undefined);
    await update("iroiroIro", "autoColor.enabled", undefined, vscode.ConfigurationTarget.Workspace);
    await update("iroiroIro", "autoColor.source", "presets", vscode.ConfigurationTarget.Global);
    await update("iroiroIro", "autoColor.enabled", true, vscode.ConfigurationTarget.Global);
    await waitFor(() => api.getState().color !== undefined, "automatic color opt-in to assign a preset");
    const automaticColor = api.getState().color;
    assert.ok(BUILTIN_PRESETS.some((preset) => preset.value === automaticColor));
    await update("iroiroIro", "autoColor.source", "generated", vscode.ConfigurationTarget.Global);
    await waitFor(
        () => api.getState().color === automaticColor,
        "the saved color to survive an automatic-source change",
    );
    assert.equal(api.getState().color, automaticColor, "Automatic preferences must not replace a saved color.");

    const beforeRandom = api.getState().color;
    await command("iroiroIro.randomColor");
    const generated = api.getState().color;
    assert.match(generated ?? "", /^#[0-9a-f]{6}$/);
    assert.notEqual(generated, beforeRandom);
    await command("iroiroIro.randomPreset");
    const randomPreset = api.getState().color;
    assert.ok(BUILTIN_PRESETS.some((preset) => preset.value === randomPreset));

    await api.setColor("#000000");
    await command("iroiroIro.lighten");
    assert.equal(api.getState().color, "#0d0d0d");
    await command("iroiroIro.darken");
    assert.equal(api.getState().color, "#000000");

    const onlyPanel = {
        activityBar: false,
        statusBar: false,
        titleBar: false,
        sashHover: false,
        editorGroupBorder: false,
        panelBorder: true,
        sideBarBorder: false,
        statusBarBorder: false,
        titleBarBorder: false,
        tabActiveBorder: false,
        windowBorder: false,
    };
    await update("iroiroIro", "coloredParts", onlyPanel, vscode.ConfigurationTarget.Workspace);
    await waitFor(
        () => colorValue("panel.border") === "#000000" && colorValue("activityBar.background") === undefined,
        "colored part preferences to re-render the saved color",
    );

    const colorBeforeTheme = api.getState().color;
    const themeInspection = vscode.workspace.getConfiguration("workbench").inspect<unknown>("colorTheme");
    const priorTheme = themeInspection?.globalValue;
    await update("workbench", "colorTheme", "Default Light Modern", vscode.ConfigurationTarget.Global);
    assert.equal(api.getState().color, colorBeforeTheme, "A theme switch must preserve the saved primary color.");
    await update("workbench", "colorTheme", priorTheme, vscode.ConfigurationTarget.Global);

    await update("iroiroIro", "color", "#765432", vscode.ConfigurationTarget.Workspace);
    await waitFor(() => api.getState().color === "#765432", "an external saved-color update in the same window");
    await waitFor(() => colorValue("panel.border") === "#765432", "the externally saved color to render");

    await update("iroiroIro", "autoColor.enabled", undefined, vscode.ConfigurationTarget.Workspace);
    await api.setColor("#112233");
    await api.reset();
    assert.equal(api.getState().color, undefined);
    assert.equal(extension.inspect<boolean>("autoColor.enabled")?.workspaceValue, false);
    await api.undo();
    assert.equal(api.getState().color, "#112233");
    assert.equal(extension.inspect<boolean>("autoColor.enabled")?.workspaceValue, undefined);
}
