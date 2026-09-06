import assert from "node:assert/strict";
import test from "node:test";
import { contrastRatio, generatedCandidates, selectRandomColor } from "../src/domain/colors";
import { BUILTIN_PRESETS } from "../src/domain/presets";
import { DEFAULT_PREFERENCES } from "../src/domain/settings";
import type { ShadeMode } from "../src/domain/settings";
import { renderColors } from "../src/domain/surfaces";

function failed(error: unknown): void {
    process.stderr.write(`${error instanceof Error ? error.message : "Test registration failed"}\n`);
    process.exitCode = 1;
}

test("all built-in backgrounds and supported shades retain 4.5:1 owned-pair contrast", () => {
    const modes: readonly ShadeMode[] = ["none", "lighten", "darken"];
    const pairs = [
        ["activityBar.background", "activityBar.foreground"],
        ["activityBar.background", "activityBar.inactiveForeground"],
        ["activityBarBadge.background", "activityBarBadge.foreground"],
        ["activityBarTop.background", "activityBarTop.foreground"],
        ["titleBar.activeBackground", "titleBar.activeForeground"],
        ["titleBar.inactiveBackground", "titleBar.inactiveForeground"],
        ["commandCenter.background", "commandCenter.foreground"],
        ["statusBar.background", "statusBar.foreground"],
        ["statusBarItem.hoverBackground", "statusBarItem.hoverForeground"],
    ] as const;
    for (const preset of BUILTIN_PRESETS) {
        for (const mode of modes) {
            for (const step of [1, 5, 10]) {
                const colors = renderColors(preset.value, {
                    ...DEFAULT_PREFERENCES,
                    adjustmentStep: step,
                    adjustments: { activityBar: mode, titleBar: mode, statusBar: mode },
                });
                for (const [background, foreground] of pairs) {
                    const backgroundColor = colors[background];
                    const foregroundColor = colors[foreground];
                    assert.ok(backgroundColor !== undefined && foregroundColor !== undefined);
                    assert.ok(
                        contrastRatio(backgroundColor, foregroundColor) >= 4.5,
                        `${preset.name}, ${mode}, ${step}, ${background}`,
                    );
                }
            }
        }
    }
}).catch(failed);

test("crowded random pools use maximum minimum distance and allow a one-color pool", () => {
    assert.equal(
        selectRandomColor(["#010101", "#020202"], ["#000000"], undefined, true, () => 0),
        "#020202",
    );
    assert.equal(
        selectRandomColor(["#abcdef"], [], "#abcdef", true, () => 0),
        "#abcdef",
    );
    const maximumDraws = generatedCandidates((_minimum, maximum) => maximum - 1);
    assert.equal(maximumDraws.length, 64);
    assert.ok(maximumDraws.every((value) => /^#[0-9a-f]{6}$/u.test(value)));
}).catch(failed);
