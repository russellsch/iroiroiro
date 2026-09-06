import { adjustLightness, foregroundFor, parseHex } from "./colors";
import type { PartId, Preferences, ShadeMode } from "./settings";

const KEYS_BY_PART: Readonly<Record<PartId, readonly string[]>> = {
    activityBar: [
        "activityBar.background",
        "activityBar.activeBackground",
        "activityBar.foreground",
        "activityBar.inactiveForeground",
        "activityBar.activeBorder",
        "activityBar.activeFocusBorder",
        "activityBarBadge.background",
        "activityBarBadge.foreground",
        "activityBarTop.background",
        "activityBarTop.activeBackground",
        "activityBarTop.foreground",
        "activityBarTop.inactiveForeground",
        "activityBarTop.activeBorder",
    ],
    titleBar: [
        "titleBar.activeBackground",
        "titleBar.inactiveBackground",
        "titleBar.activeForeground",
        "titleBar.inactiveForeground",
        "commandCenter.background",
        "commandCenter.activeBackground",
        "commandCenter.foreground",
        "commandCenter.activeForeground",
        "commandCenter.inactiveForeground",
        "commandCenter.border",
        "commandCenter.activeBorder",
        "commandCenter.inactiveBorder",
    ],
    statusBar: [
        "statusBar.background",
        "statusBar.foreground",
        "statusBarItem.hoverBackground",
        "statusBarItem.hoverForeground",
        "statusBarItem.activeBackground",
    ],
    sashHover: ["sash.hoverBorder"],
    editorGroupBorder: ["editorGroup.border"],
    panelBorder: ["panel.border"],
    sideBarBorder: ["sideBar.border"],
    statusBarBorder: ["statusBar.border"],
    titleBarBorder: ["titleBar.border"],
    tabActiveBorder: [
        "tab.activeBorder",
        "tab.unfocusedActiveBorder",
        "tab.activeBorderTop",
        "tab.unfocusedActiveBorderTop",
    ],
    windowBorder: ["window.activeBorder", "window.inactiveBorder"],
};

export const KNOWN_COLOR_KEYS: readonly string[] = Object.values(KEYS_BY_PART).flat();

function shade(primary: string, mode: ShadeMode, step: number): string {
    if (mode === "lighten") {
        return adjustLightness(primary, step);
    }
    if (mode === "darken") {
        return adjustLightness(primary, -step);
    }
    return primary;
}

function addBar(
    output: Record<string, string>,
    part: "activityBar" | "titleBar" | "statusBar",
    background: string,
): void {
    const foreground = foregroundFor(background);
    for (const key of KEYS_BY_PART[part]) {
        output[key] =
            key.includes("Foreground") ||
            key.endsWith(".foreground") ||
            key.endsWith("Border") ||
            key.endsWith(".border")
                ? foreground
                : background;
    }
    if (part === "activityBar") {
        output["activityBarBadge.background"] = foreground;
        output["activityBarBadge.foreground"] = background;
    }
}

export function renderColors(color: string, prefs: Preferences): Readonly<Record<string, string>> {
    const primary = parseHex(color);
    if (primary === undefined) {
        return {};
    }
    const output: Record<string, string> = {};
    if (prefs.coloredParts.activityBar) {
        addBar(output, "activityBar", shade(primary, prefs.adjustments.activityBar, prefs.adjustmentStep));
    }
    if (prefs.coloredParts.titleBar) {
        addBar(output, "titleBar", shade(primary, prefs.adjustments.titleBar, prefs.adjustmentStep));
    }
    if (prefs.coloredParts.statusBar) {
        addBar(output, "statusBar", shade(primary, prefs.adjustments.statusBar, prefs.adjustmentStep));
    }
    const borderParts: readonly PartId[] = [
        "sashHover",
        "editorGroupBorder",
        "panelBorder",
        "sideBarBorder",
        "statusBarBorder",
        "titleBarBorder",
        "tabActiveBorder",
        "windowBorder",
    ];
    for (const part of borderParts) {
        if (prefs.coloredParts[part]) {
            for (const key of KEYS_BY_PART[part]) {
                output[key] = primary;
            }
        }
    }
    return output;
}

export function partForKey(key: string): PartId | undefined {
    for (const part of Object.keys(KEYS_BY_PART)) {
        if (
            part === "activityBar" ||
            part === "statusBar" ||
            part === "titleBar" ||
            part === "sashHover" ||
            part === "editorGroupBorder" ||
            part === "panelBorder" ||
            part === "sideBarBorder" ||
            part === "statusBarBorder" ||
            part === "titleBarBorder" ||
            part === "tabActiveBorder" ||
            part === "windowBorder"
        ) {
            if (KEYS_BY_PART[part].includes(key)) {
                return part;
            }
        }
    }
    return undefined;
}
