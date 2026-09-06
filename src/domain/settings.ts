export type PartId =
    | "activityBar"
    | "statusBar"
    | "titleBar"
    | "sashHover"
    | "editorGroupBorder"
    | "panelBorder"
    | "sideBarBorder"
    | "statusBarBorder"
    | "titleBarBorder"
    | "tabActiveBorder"
    | "windowBorder";

export type ShadeMode = "none" | "lighten" | "darken";
export type AutoColorSource = "presets" | "generated";

export interface PartMetadata {
    readonly id: PartId;
    readonly label: string;
    readonly default: boolean;
}

export const PARTS: readonly PartMetadata[] = [
    { id: "activityBar", label: "Activity bar", default: true },
    { id: "statusBar", label: "Status bar", default: true },
    { id: "titleBar", label: "Title bar", default: true },
    { id: "sashHover", label: "Sash hover border", default: true },
    { id: "editorGroupBorder", label: "Editor group border", default: false },
    { id: "panelBorder", label: "Panel border", default: false },
    { id: "sideBarBorder", label: "Side bar border", default: false },
    { id: "statusBarBorder", label: "Status bar border", default: false },
    { id: "titleBarBorder", label: "Title bar border", default: false },
    { id: "tabActiveBorder", label: "Active tab border", default: false },
    { id: "windowBorder", label: "Window border", default: false },
];

export interface Preferences {
    readonly autoColorEnabled: boolean;
    readonly autoColorSource: AutoColorSource;
    readonly preferDistinctColors: boolean;
    readonly adjustmentStep: number;
    readonly coloredParts: Readonly<Record<PartId, boolean>>;
    readonly adjustments: Readonly<Record<"activityBar" | "titleBar" | "statusBar", ShadeMode>>;
    readonly previewEnabled: boolean;
    readonly statusBarItemEnabled: boolean;
}

function defaultParts(): Record<PartId, boolean> {
    return {
        activityBar: true,
        statusBar: true,
        titleBar: true,
        sashHover: true,
        editorGroupBorder: false,
        panelBorder: false,
        sideBarBorder: false,
        statusBarBorder: false,
        titleBarBorder: false,
        tabActiveBorder: false,
        windowBorder: false,
    };
}

export const DEFAULT_PREFERENCES: Preferences = {
    autoColorEnabled: false,
    autoColorSource: "presets",
    preferDistinctColors: true,
    adjustmentStep: 5,
    coloredParts: defaultParts(),
    adjustments: { activityBar: "lighten", titleBar: "none", statusBar: "none" },
    previewEnabled: true,
    statusBarItemEnabled: true,
};

function property(value: unknown, key: PartId | "activityBar" | "titleBar" | "statusBar"): unknown {
    if (!isObject(value)) {
        return undefined;
    }
    if (key === "activityBar" && Object.hasOwn(value, "activityBar") && "activityBar" in value) {
        return value.activityBar;
    }
    if (key === "statusBar" && Object.hasOwn(value, "statusBar") && "statusBar" in value) {
        return value.statusBar;
    }
    if (key === "titleBar" && Object.hasOwn(value, "titleBar") && "titleBar" in value) {
        return value.titleBar;
    }
    if (key === "sashHover" && Object.hasOwn(value, "sashHover") && "sashHover" in value) {
        return value.sashHover;
    }
    if (key === "editorGroupBorder" && Object.hasOwn(value, "editorGroupBorder") && "editorGroupBorder" in value) {
        return value.editorGroupBorder;
    }
    if (key === "panelBorder" && Object.hasOwn(value, "panelBorder") && "panelBorder" in value) {
        return value.panelBorder;
    }
    if (key === "sideBarBorder" && Object.hasOwn(value, "sideBarBorder") && "sideBarBorder" in value) {
        return value.sideBarBorder;
    }
    if (key === "statusBarBorder" && Object.hasOwn(value, "statusBarBorder") && "statusBarBorder" in value) {
        return value.statusBarBorder;
    }
    if (key === "titleBarBorder" && Object.hasOwn(value, "titleBarBorder") && "titleBarBorder" in value) {
        return value.titleBarBorder;
    }
    if (key === "tabActiveBorder" && Object.hasOwn(value, "tabActiveBorder") && "tabActiveBorder" in value) {
        return value.tabActiveBorder;
    }
    if (key === "windowBorder" && Object.hasOwn(value, "windowBorder") && "windowBorder" in value) {
        return value.windowBorder;
    }
    return undefined;
}

function isObject(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rootProperty(value: Readonly<Record<string, unknown>>, key: string): unknown {
    return Object.hasOwn(value, key) ? value[key] : undefined;
}

export function parsePreferences(value: Readonly<Record<string, unknown>>): {
    readonly preferences: Preferences;
    readonly issues: readonly string[];
} {
    const issues: string[] = [];
    const knownKeys = new Set([
        "autoColor.enabled",
        "autoColor.source",
        "preferDistinctColors",
        "adjustmentStep",
        "coloredParts",
        "adjustments",
        "preview.enabled",
        "statusBarItem.enabled",
    ]);
    for (const key of Object.keys(value)) {
        if (!knownKeys.has(key)) {
            issues.push(`${key} is not a supported preference.`);
        }
    }
    const booleanValue = (key: string, fallback: boolean): boolean => {
        const candidate = rootProperty(value, key);
        if (candidate === undefined) {
            return fallback;
        }
        if (typeof candidate === "boolean") {
            return candidate;
        }
        issues.push(`${key} must be a boolean.`);
        return fallback;
    };
    const sourceValue = rootProperty(value, "autoColor.source");
    const autoColorSource: AutoColorSource =
        sourceValue === "presets" || sourceValue === "generated" ? sourceValue : DEFAULT_PREFERENCES.autoColorSource;
    if (sourceValue !== undefined && sourceValue !== "presets" && sourceValue !== "generated") {
        issues.push("autoColor.source must be presets or generated.");
    }
    const stepValue = rootProperty(value, "adjustmentStep");
    const adjustmentStep =
        Number.isInteger(stepValue) && typeof stepValue === "number" && stepValue >= 1 && stepValue <= 10
            ? stepValue
            : DEFAULT_PREFERENCES.adjustmentStep;
    if (stepValue !== undefined && adjustmentStep !== stepValue) {
        issues.push("adjustmentStep must be an integer from 1 through 10.");
    }
    const partsInput = rootProperty(value, "coloredParts");
    const coloredParts = defaultParts();
    if (partsInput !== undefined && !isObject(partsInput)) {
        issues.push("coloredParts must be an object.");
    } else if (isObject(partsInput)) {
        const partIds: ReadonlySet<string> = new Set(PARTS.map((part) => part.id));
        for (const key of Object.keys(partsInput)) {
            if (!partIds.has(key)) {
                issues.push(`coloredParts.${key} is not a supported part.`);
            }
        }
    }
    for (const part of PARTS) {
        const candidate = property(partsInput, part.id);
        if (candidate === undefined) {
            continue;
        }
        if (typeof candidate === "boolean") {
            coloredParts[part.id] = candidate;
        } else {
            issues.push(`coloredParts.${part.id} must be a boolean.`);
        }
    }
    const adjustmentInput = rootProperty(value, "adjustments");
    const adjustments: Record<"activityBar" | "titleBar" | "statusBar", ShadeMode> = {
        activityBar: "lighten",
        titleBar: "none",
        statusBar: "none",
    };
    if (adjustmentInput !== undefined && !isObject(adjustmentInput)) {
        issues.push("adjustments must be an object.");
    } else if (isObject(adjustmentInput)) {
        const adjustmentNames = new Set(["activityBar", "titleBar", "statusBar"]);
        for (const key of Object.keys(adjustmentInput)) {
            if (!adjustmentNames.has(key)) {
                issues.push(`adjustments.${key} is not a supported bar.`);
            }
        }
    }
    const adjustmentKeys: readonly (keyof typeof adjustments)[] = ["activityBar", "titleBar", "statusBar"];
    for (const key of adjustmentKeys) {
        const candidate = property(adjustmentInput, key);
        if (candidate === undefined) {
            continue;
        }
        if (candidate === "none" || candidate === "lighten" || candidate === "darken") {
            adjustments[key] = candidate;
        } else {
            issues.push(`adjustments.${key} must be none, lighten, or darken.`);
        }
    }
    return {
        preferences: {
            autoColorEnabled: booleanValue("autoColor.enabled", false),
            autoColorSource,
            preferDistinctColors: booleanValue("preferDistinctColors", true),
            adjustmentStep,
            coloredParts,
            adjustments,
            previewEnabled: booleanValue("preview.enabled", true),
            statusBarItemEnabled: booleanValue("statusBarItem.enabled", true),
        },
        issues,
    };
}
