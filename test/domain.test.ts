import assert from "node:assert/strict";
import test from "node:test";

import {
    adjustLightness,
    colorDistance,
    contrastRatio,
    foregroundFor,
    generatedCandidates,
    parseHex,
    selectRandomColor,
} from "../src/domain/colors";
import {
    allPresets,
    BUILTIN_PRESETS,
    normalizeName,
    readCustomPresets,
    validatePresetName,
} from "../src/domain/presets";
import { DEFAULT_PREFERENCES, parsePreferences, PARTS } from "../src/domain/settings";
import { KNOWN_COLOR_KEYS, partForKey, renderColors } from "../src/domain/surfaces";

function registerTest(name: string, body: () => void | Promise<void>): void {
    test(name, body).catch((error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.message : "Unknown test registration failure"}\n`);
        process.exitCode = 1;
    });
}

function referenceSelection(
    candidates: readonly string[],
    peers: readonly string[],
    current: string | undefined,
    preferDistinct: boolean,
    chooseIndex: (minimum: number, maximum: number) => number,
): string {
    const valid = candidates.map(parseHex).filter((color): color is string => color !== undefined);
    const currentColor = parseHex(current);
    const available =
        currentColor !== undefined && valid.some((color) => color !== currentColor)
            ? valid.filter((color) => color !== currentColor)
            : valid;
    const member = (values: readonly string[]): string =>
        values[chooseIndex(0, values.length)] ?? values[0] ?? "#000000";
    const validPeers = peers.map(parseHex).filter((color): color is string => color !== undefined);
    if (!preferDistinct || validPeers.length === 0) {
        return member(available);
    }
    const ranked = available.map((color) => ({
        color,
        distance: Math.min(...validPeers.map((peer) => colorDistance(color, peer))),
    }));
    const preferred = ranked.filter((entry) => entry.distance >= 0.1).map((entry) => entry.color);
    if (preferred.length > 0) {
        return member(preferred);
    }
    const maximum = Math.max(...ranked.map((entry) => entry.distance));
    return member(
        ranked.filter((entry) => Math.abs(entry.distance - maximum) <= Number.EPSILON).map((entry) => entry.color),
    );
}

registerTest("hex parsing accepts only the solid three-digit and six-digit grammar", () => {
    assert.equal(parseHex(" \n#AbC\t"), "#aabbcc");
    assert.equal(parseHex("A1b2C3"), "#a1b2c3");
    for (const value of [undefined, null, 12, "", "#abcd", "#aabbccdd", "red", "rgb(1,2,3)", "#ggg"]) {
        assert.equal(parseHex(value), undefined);
    }
});

registerTest("HSL adjustment clamps and rounds specified vectors", () => {
    assert.equal(adjustLightness("#000000", 5), "#0d0d0d");
    assert.equal(adjustLightness("#ffffff", 5), "#ffffff");
    assert.equal(adjustLightness("#ff0000", -50), "#000000");
});

registerTest("contrast and foreground calculations use relative luminance", () => {
    assert.equal(contrastRatio("#000000", "#ffffff"), 21);
    assert.equal(foregroundFor("#777777"), "#000000");
    assert.equal(foregroundFor("#000080"), "#ffffff");
    assert.ok(contrastRatio("#777777", foregroundFor("#777777")) >= 4.5);
});

registerTest("OKLab distances and random ranking prefer separated colors", () => {
    assert.equal(colorDistance("#123456", "#123456"), 0);
    assert.ok(colorDistance("#ff0000", "#0000ff") > 0.1);
    assert.equal(
        selectRandomColor(["#ff0000", "#0000ff"], ["#ff0000"], undefined, true, () => 0),
        "#0000ff",
    );
    assert.equal(
        selectRandomColor(["#ff0000", "#0000ff"], [], "#ff0000", false, () => 0),
        "#0000ff",
    );
});

registerTest("cached OKLab ranking is exactly equivalent to the direct-distance reference", () => {
    const cases = [
        {
            candidates: ["#ff0000", "#0000ff", "#00ff00", "#0000ff", "invalid"],
            peers: ["#ff0000", "#ffff00", "invalid"],
            current: "#00ff00",
            preferDistinct: true,
        },
        {
            candidates: ["#101010", "#111111", "#121212"],
            peers: ["#000000", "#ffffff"],
            current: undefined,
            preferDistinct: true,
        },
        {
            candidates: ["#abcdef", "#abcdef", "#123456"],
            peers: [],
            current: "#123456",
            preferDistinct: false,
        },
    ];
    const chooseLast = (minimum: number, maximum: number): number => Math.max(minimum, maximum - 1);
    for (const entry of cases) {
        assert.equal(
            selectRandomColor(entry.candidates, entry.peers, entry.current, entry.preferDistinct, chooseLast),
            referenceSelection(entry.candidates, entry.peers, entry.current, entry.preferDistinct, chooseLast),
        );
    }
});

registerTest("generated candidates make 64 bounded HSL draws", () => {
    const calls: { readonly minimum: number; readonly maximum: number }[] = [];
    const colors = generatedCandidates((minimum, maximum) => {
        calls.push({ minimum, maximum });
        return minimum;
    });
    assert.equal(colors.length, 64);
    assert.equal(calls.length, 192);
    assert.deepEqual(calls.slice(0, 3), [
        { minimum: 0, maximum: 360 },
        { minimum: 45, maximum: 86 },
        { minimum: 25, maximum: 71 },
    ]);
    assert.ok(colors.every((color) => /^#[0-9a-f]{6}$/.test(color)));
});

registerTest("the built-in preset catalog has the exact required size and endpoints", () => {
    assert.equal(BUILTIN_PRESETS.length, 240);
    assert.deepEqual(BUILTIN_PRESETS[0], { name: "Red", value: "#ff0000" });
    assert.deepEqual(BUILTIN_PRESETS[239], { name: "Deep black", value: "#08090a" });
    assert.equal(new Set(BUILTIN_PRESETS.map((preset) => preset.name)).size, 240);
});

registerTest("custom preset validation normalizes names and excludes invalid entries", () => {
    assert.equal(normalizeName("ＦＯＯ"), "foo");
    assert.match(validatePresetName("red", []) ?? "", /built-in/);
    assert.match(validatePresetName("x".repeat(65), []) ?? "", /64/);
    assert.equal(validatePresetName(" Renamed ", [{ name: "Old", value: "#123456" }], "Old"), undefined);
    const result = readCustomPresets([
        { name: " Zed ", value: "#abc" },
        { name: "ｚｅｄ", value: "#123456" },
        { name: "Bad", value: "transparent" },
    ]);
    assert.deepEqual(result.presets, [{ name: "Zed", value: "#aabbcc" }]);
    assert.equal(result.issues.length, 2);
    assert.equal(
        allPresets([
            { name: "Zed", value: "#000000" },
            { name: "Able", value: "#ffffff" },
        ])[240]?.name,
        "Able",
    );
    assert.deepEqual(
        allPresets([
            { name: "\u{10000}", value: "#000000" },
            { name: "\ue000", value: "#ffffff" },
        ])
            .slice(240)
            .map((preset) => preset.name),
        ["\ue000", "\u{10000}"],
    );
    class InheritedPreset {
        public get name(): string {
            return "Inherited";
        }

        public get value(): string {
            return "#123456";
        }
    }
    assert.equal(readCustomPresets([new InheritedPreset()]).presets.length, 0);
});

registerTest("preferences apply defaults independently to invalid settings", () => {
    class InheritedParts {
        public get activityBar(): boolean {
            return false;
        }
    }
    assert.equal(PARTS.length, 11);
    const result = parsePreferences({
        "autoColor.enabled": true,
        "autoColor.source": "bad",
        adjustmentStep: 2.5,
        coloredParts: { panelBorder: true, titleBar: "yes" },
        adjustments: { activityBar: "darken", statusBar: "bad" },
        "preview.enabled": false,
    });
    assert.equal(result.preferences.autoColorEnabled, true);
    assert.equal(result.preferences.autoColorSource, "presets");
    assert.equal(result.preferences.adjustmentStep, 5);
    assert.equal(result.preferences.coloredParts.panelBorder, true);
    assert.equal(result.preferences.coloredParts.titleBar, true);
    assert.equal(result.preferences.adjustments.activityBar, "darken");
    assert.equal(result.preferences.adjustments.statusBar, "none");
    assert.equal(result.preferences.previewEnabled, false);
    assert.equal(result.issues.length, 4);
    const hostile = parsePreferences({ coloredParts: new InheritedParts(), unknownSetting: true });
    assert.equal(hostile.preferences.coloredParts.activityBar, true);
    assert.equal(hostile.issues.length, 1);
    const inheritedRoot = parsePreferences({ __proto__: { "autoColor.enabled": true } });
    assert.equal(inheritedRoot.preferences.autoColorEnabled, false);
    assert.deepEqual(inheritedRoot.issues, []);
});

registerTest("surface rendering covers every registered key with specified pair colors", () => {
    const allParts = Object.fromEntries(PARTS.map((part) => [part.id, true]));
    const parsed = parsePreferences({ coloredParts: allParts }).preferences;
    const colors = renderColors("#000000", parsed);
    assert.deepEqual(Object.keys(colors).sort(), [...KNOWN_COLOR_KEYS].sort());
    assert.equal(colors["activityBar.background"], "#0d0d0d");
    assert.equal(colors["activityBarBadge.background"], "#ffffff");
    assert.equal(colors["activityBarBadge.foreground"], "#0d0d0d");
    assert.equal(colors["commandCenter.border"], "#ffffff");
    assert.equal(colors["panel.border"], "#000000");
    assert.equal(partForKey("tab.activeBorderTop"), "tabActiveBorder");
    assert.equal(partForKey("editor.background"), undefined);
    assert.deepEqual(renderColors("invalid", DEFAULT_PREFERENCES), {});
});
