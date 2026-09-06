import * as vscode from "vscode";
import { parseHex } from "./domain/colors";
import type { Preset } from "./domain/presets";

export const HEX_MESSAGE = "Enter three or six hex digits, with an optional # (for example, #aaa or #aabbcc).";

export interface ColorControl {
    readonly change: (value: string | undefined) => void;
    readonly registerCancellation: (cancel: () => void) => void;
}

interface PresetItem extends vscode.QuickPickItem {
    readonly color: string;
}

export async function choosePreset(
    presets: readonly Preset[],
    current: string | undefined,
    control: ColorControl,
): Promise<string | undefined> {
    const picker = vscode.window.createQuickPick<PresetItem>();
    const subscriptions: vscode.Disposable[] = [];
    try {
        picker.title = "iroiro iro: Choose Color";
        picker.placeholder = "Search preset names or hex codes";
        picker.matchOnDescription = true;
        picker.ignoreFocusOut = false;
        picker.items = presets.map((preset) => ({
            label: preset.name,
            description: preset.value,
            color: preset.value,
        }));
        const active = picker.items.find((item) => item.color === current) ?? picker.items[0];
        if (active !== undefined) {
            picker.activeItems = [active];
        }
        control.registerCancellation(() => picker.hide());
        const result = new Promise<string | undefined>((resolve) => {
            subscriptions.push(
                picker.onDidChangeActive((items) => control.change(items[0]?.color)),
                picker.onDidAccept(() => {
                    const selected = picker.selectedItems[0] ?? picker.activeItems[0];
                    if (selected !== undefined) {
                        resolve(selected.color);
                    }
                }),
                picker.onDidHide(() => resolve(undefined)),
            );
        });
        picker.show();
        control.change(active?.color);
        return await result;
    } finally {
        for (const subscription of subscriptions) {
            subscription.dispose();
        }
        picker.dispose();
    }
}

export async function enterHex(
    current: string | undefined,
    control?: ColorControl,
    title = "iroiro iro: Enter Hex Color",
): Promise<string | undefined> {
    const input = vscode.window.createInputBox();
    const subscriptions: vscode.Disposable[] = [];
    try {
        input.title = title;
        input.prompt = HEX_MESSAGE;
        input.placeholder = "#aabbcc";
        input.value = current ?? "";
        input.ignoreFocusOut = false;
        control?.registerCancellation(() => input.hide());
        const result = new Promise<string | undefined>((resolve) => {
            subscriptions.push(
                input.onDidChangeValue((value) => {
                    const parsed = parseHex(value);
                    input.validationMessage = parsed === undefined ? HEX_MESSAGE : undefined;
                    control?.change(parsed);
                }),
                input.onDidAccept(() => {
                    const parsed = parseHex(input.value);
                    if (parsed === undefined) {
                        input.validationMessage = HEX_MESSAGE;
                    } else {
                        resolve(parsed);
                    }
                }),
                input.onDidHide(() => resolve(undefined)),
            );
        });
        input.show();
        return await result;
    } finally {
        for (const subscription of subscriptions) {
            subscription.dispose();
        }
        input.dispose();
    }
}
