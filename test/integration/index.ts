import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import * as vscode from "vscode";

import { runBehavior } from "../host-behavior";

interface ExtensionState {
    readonly color: string | undefined;
    readonly historySize: number;
    readonly recoveryBlocked: boolean;
}

interface ExtensionApi {
    setColor(input: string): Promise<void>;
    previewColor(input: string): Promise<void>;
    cancelPreview(): Promise<void>;
    reset(): Promise<void>;
    undo(): Promise<void>;
    retryRecovery(): Promise<void>;
    getState(): ExtensionState;
}

function environment(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === "") {
        throw new Error(`Missing integration environment value ${name}.`);
    }
    return value;
}

export async function run(): Promise<void> {
    const scenario = environment("IROIRO_INTEGRATION_SCENARIO");
    const resultPath = environment("IROIRO_INTEGRATION_RESULT");
    const expectedFolders = scenario === "multi-folder" ? 2 : 1;
    assert.equal(vscode.workspace.workspaceFolders?.length, expectedFolders);

    const extension = vscode.extensions.getExtension<ExtensionApi>("russellsch.iroiro-iro");
    assert.ok(extension, "The selected extension is discoverable.");
    const packageJson: unknown = extension.packageJSON;
    if (typeof packageJson !== "object" || packageJson === null || !("version" in packageJson)) {
        throw new Error("The extension manifest has no version.");
    }
    const extensionVersion = packageJson.version;
    if (typeof extensionVersion !== "string") {
        throw new Error("The extension manifest version is not a string.");
    }
    const originalGlobalColors = vscode.workspace
        .getConfiguration("workbench")
        .inspect<unknown>("colorCustomizations")?.globalValue;
    const api = await extension.activate();
    assert.equal(api.getState().color, undefined, "Automatic assignment is off in a fresh profile.");
    assert.equal(vscode.workspace.getConfiguration("iroiroIro").inspect<unknown>("color")?.workspaceValue, undefined);
    const registeredCommands = new Set(await vscode.commands.getCommands(true));
    const requiredCommands = [
        "chooseColor",
        "enterHexColor",
        "randomColor",
        "randomPreset",
        "lighten",
        "darken",
        "savePreset",
        "renamePreset",
        "editPreset",
        "deletePreset",
        "chooseParts",
        "undo",
        "reset",
        "enableAutoColor",
        "disableAutoColor",
        "openSettings",
        "retryRecovery",
    ];
    for (const suffix of requiredCommands) {
        assert.ok(registeredCommands.has(`iroiroIro.${suffix}`), `The installed command ${suffix} is discoverable.`);
    }
    await runBehavior(api);
    await api.setColor("#abc");
    assert.equal(api.getState().color, "#aabbcc");
    assert.equal(vscode.workspace.getConfiguration("iroiroIro").inspect<string>("color")?.workspaceValue, "#aabbcc");

    await api.previewColor("#123456");
    assert.equal(api.getState().color, "#aabbcc", "A preview does not replace the committed primary color.");
    await api.cancelPreview();
    assert.equal(api.getState().color, "#aabbcc");

    await api.setColor("#654321");
    assert.equal(api.getState().color, "#654321");
    await api.undo();
    assert.equal(api.getState().color, "#aabbcc");
    await api.retryRecovery();
    assert.equal(api.getState().recoveryBlocked, false);
    await api.reset();
    assert.equal(api.getState().color, undefined);
    assert.deepEqual(
        vscode.workspace.getConfiguration("workbench").inspect<unknown>("colorCustomizations")?.globalValue,
        originalGlobalColors,
        "Workspace appearance operations preserve global workbench colors.",
    );

    await writeFile(
        resultPath,
        `${JSON.stringify({ scenario, vscodeVersion: vscode.version, extensionVersion, commandCount: requiredCommands.length, passed: true })}\n`,
        "utf8",
    );
}
