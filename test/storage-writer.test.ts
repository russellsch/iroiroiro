import assert from "node:assert/strict";
import test from "node:test";

import { SettingsWriter, type ConfigurationPort, type StatePort } from "../src/storage/writer";

const BACKGROUND = "statusBar.background";
const FOREGROUND = "statusBar.foreground";

function copy(value: unknown): unknown {
    return value === undefined ? undefined : structuredClone(value);
}

class MemoryConfiguration implements ConfigurationPort {
    public colors: Record<string, unknown> | undefined;
    public effective: Record<string, unknown> | undefined;
    public readonly settings = new Map<string, unknown>();
    public colorWrites = 0;
    public settingWrites = 0;
    public failNextColorWrite = false;
    public failSettingKey: string | undefined;
    public mismatchReadback = false;
    public gate: Promise<void> | undefined;

    public readColors(): unknown {
        return copy(this.colors);
    }

    public readEffectiveColors(): unknown {
        return copy(this.effective ?? this.colors);
    }

    public readSetting(key: string): unknown {
        return copy(this.settings.get(key));
    }

    public async writeColors(value: Readonly<Record<string, unknown>> | undefined): Promise<void> {
        this.colorWrites += 1;
        if (this.gate !== undefined) {
            await this.gate;
            this.gate = undefined;
        }
        if (this.failNextColorWrite) {
            this.failNextColorWrite = false;
            throw new Error("injected color failure");
        }
        this.colors = value === undefined ? undefined : (copy(value) as Record<string, unknown>);
        if (this.mismatchReadback && this.colors !== undefined) {
            this.colors[BACKGROUND] = "#eeeeee";
        }
    }

    public writeSetting(key: string, value: unknown): Promise<void> {
        this.settingWrites += 1;
        if (this.failSettingKey === key) {
            this.failSettingKey = undefined;
            return Promise.reject(new Error(`injected setting failure: ${key}`));
        }
        if (value === undefined) {
            this.settings.delete(key);
        } else {
            this.settings.set(key, copy(value));
        }
        return Promise.resolve();
    }
}

class MemoryState implements StatePort {
    public value: unknown;
    public readonly writes: unknown[] = [];

    public read(): unknown {
        return this.value;
    }

    public write(value: unknown): Promise<void> {
        this.value = copy(value);
        this.writes.push(copy(value));
        return Promise.resolve();
    }
}

function makeWriter(config = new MemoryConfiguration(), state = new MemoryState()): SettingsWriter {
    return new SettingsWriter(config, state, [BACKGROUND, FOREGROUND], () => undefined);
}

function registerTest(name: string, body: () => Promise<void>): void {
    test(name, body).catch((error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.message : "Test registration failed"}\n`);
        process.exitCode = 1;
    });
}

registerTest("preview cancellation restores owned values and keeps unrelated settings", async () => {
    const config = new MemoryConfiguration();
    config.colors = { [BACKGROUND]: "#111111", sentinel: "keep" };
    const state = new MemoryState();
    const writer = makeWriter(config, state);
    await writer.initialize();
    await writer.begin();
    await writer.applyPreview({ [BACKGROUND]: "#222222" });
    assert.equal(config.colors?.[BACKGROUND], "#222222");
    assert.equal(writer.historySize, 0);
    await writer.cancel();
    assert.equal(config.colors?.[BACKGROUND], "#111111");
    assert.equal(config.colors?.sentinel, "keep");
    assert.equal(writer.isPreviewing, false);
});

registerTest("journal records an attempted write before a failing configuration write", async () => {
    const config = new MemoryConfiguration();
    const state = new MemoryState();
    const writer = makeWriter(config, state);
    await writer.initialize();
    config.failNextColorWrite = true;
    await assert.rejects(writer.commit({ [BACKGROUND]: "#123456" }, "#123456"), /injected color failure/);
    const preparedAttempt = state.writes.find((entry) => {
        if (typeof entry !== "object" || entry === null || !("pending" in entry)) {
            return false;
        }
        const pending = entry.pending;
        return (
            typeof pending === "object" &&
            pending !== null &&
            "attemptedWrites" in pending &&
            Array.isArray(pending.attemptedWrites) &&
            pending.attemptedWrites.length > 0
        );
    });
    assert.notEqual(preparedAttempt, undefined);
    assert.equal(config.colors?.[BACKGROUND], undefined);
});

registerTest("cancel waits for an in-flight preview write and then restores it", async () => {
    const config = new MemoryConfiguration();
    const writer = makeWriter(config);
    await writer.initialize();
    await writer.begin();
    let release: (() => void) | undefined;
    config.gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    const preview = writer.applyPreview({ [BACKGROUND]: "#abcdef" });
    const cancellation = writer.cancel();
    await Promise.resolve();
    assert.equal(writer.isPreviewing, true);
    if (release === undefined) {
        throw new Error("The write gate was not installed.");
    }
    release();
    await preview;
    await cancellation;
    assert.equal(config.colors?.[BACKGROUND], undefined);
    assert.equal(writer.isPreviewing, false);
});

registerTest(
    "Reset restores baseline, preserves an external conflict, removes color, and disables auto color",
    async () => {
        const config = new MemoryConfiguration();
        config.colors = { [BACKGROUND]: "#101010", [FOREGROUND]: "#fafafa" };
        const writer = makeWriter(config);
        await writer.initialize();
        await writer.commit({ [BACKGROUND]: "#202020", [FOREGROUND]: "#ffffff" }, "#202020");
        if (config.colors === undefined) {
            throw new Error("Expected workspace colors.");
        }
        config.colors[FOREGROUND] = "#external";
        const changed = await writer.reset();
        assert.equal(changed, true);
        assert.equal(config.colors?.[BACKGROUND], "#101010");
        assert.equal(config.colors?.[FOREGROUND], "#external");
        assert.equal(config.settings.has("iroiroIro.color"), false);
        assert.equal(config.settings.get("iroiroIro.autoColor.enabled"), false);
    },
);

registerTest("startup reapply mirrors user-only selectors, adopts matches, and preserves conflicts", async () => {
    const config = new MemoryConfiguration();
    config.colors = { [BACKGROUND]: "#334455", [FOREGROUND]: "#conflict" };
    config.effective = {
        [BACKGROUND]: "#334455",
        [FOREGROUND]: "#conflict",
        "[Ocean Theme]": { [BACKGROUND]: "#user", sentinel: "effective-only" },
    };
    const writer = makeWriter(config);
    await writer.initialize();
    await writer.reapply({ [BACKGROUND]: "#334455", [FOREGROUND]: "#ffffff" }, "#334455");
    assert.equal(config.colors?.[BACKGROUND], "#334455");
    assert.equal(config.colors?.[FOREGROUND], "#conflict");
    const selector = config.colors?.["[Ocean Theme]"];
    assert.equal(typeof selector, "object");
    assert.equal(selector === null ? undefined : (selector as Record<string, unknown>)[BACKGROUND], "#334455");
    assert.equal(selector === null ? undefined : (selector as Record<string, unknown>).sentinel, undefined);
    await writer.reset();
    assert.equal(config.colors?.[BACKGROUND], undefined);
    assert.equal(config.colors?.[FOREGROUND], "#conflict");
    assert.equal(config.colors?.["[Ocean Theme]"], undefined);
});

registerTest("poisoned and oversized recovery data block writes", async () => {
    const poisonState = new MemoryState();
    poisonState.value = {
        schemaVersion: 1,
        revision: "1",
        committed: {
            color: { present: false },
            owned: [{ path: ["__proto__"], before: { present: false }, lastWritten: { present: true, value: "red" } }],
            workspacePreferences: {},
        },
    };
    const poisonConfig = new MemoryConfiguration();
    const poisoned = makeWriter(poisonConfig, poisonState);
    await poisoned.initialize();
    assert.equal(poisoned.isBlocked, true);
    await assert.rejects(poisoned.commit({ [BACKGROUND]: "#123456" }, "#123456"), /blocked/);
    await assert.rejects(poisoned.retryRecovery(), /invalid/);
    assert.equal(poisoned.isBlocked, true);
    assert.equal(poisonConfig.colorWrites, 0);

    const largeState = new MemoryState();
    largeState.value = { junk: "x".repeat(257 * 1024) };
    const large = makeWriter(new MemoryConfiguration(), largeState);
    await large.initialize();
    assert.equal(large.isBlocked, true);
});

registerTest("Undo restores color, rendered values, and parts preference; a no-op adds no history", async () => {
    const config = new MemoryConfiguration();
    const state = new MemoryState();
    config.settings.set("iroiroIro.coloredParts", { statusBar: true });
    const writer = makeWriter(config, state);
    await writer.initialize();
    assert.equal(
        await writer.commit({ [BACKGROUND]: "#101010" }, "#101010", { "iroiroIro.coloredParts": { statusBar: false } }),
        true,
    );
    assert.equal(writer.historySize, 1);
    const stateWritesBeforeNoOp = state.writes.length;
    const colorWritesBeforeNoOp = config.colorWrites;
    const settingWritesBeforeNoOp = config.settingWrites;
    assert.equal(await writer.commit({ [BACKGROUND]: "#101010" }, "#101010"), false);
    assert.equal(writer.historySize, 1);
    assert.equal(state.writes.length, stateWritesBeforeNoOp);
    assert.equal(config.colorWrites, colorWritesBeforeNoOp);
    assert.equal(config.settingWrites, settingWritesBeforeNoOp);
    assert.equal(await writer.undo(), true);
    assert.equal(config.colors?.[BACKGROUND], undefined);
    assert.equal(config.settings.has("iroiroIro.color"), false);
    assert.deepEqual(config.settings.get("iroiroIro.coloredParts"), { statusBar: true });
});

registerTest("a readback mismatch rejects success and restores the baseline", async () => {
    const config = new MemoryConfiguration();
    config.mismatchReadback = true;
    const writer = makeWriter(config);
    await writer.initialize();
    await assert.rejects(writer.commit({ [BACKGROUND]: "#123456" }, "#123456"), /readback/);
    assert.equal(writer.historySize, 0);
    assert.equal(config.settings.has("iroiroIro.color"), false);
});

registerTest("an interrupted multi-step preview recovers its original pre-picker value", async () => {
    const config = new MemoryConfiguration();
    config.colors = { [BACKGROUND]: "#010101", sentinel: true };
    const state = new MemoryState();
    const first = makeWriter(config, state);
    await first.initialize();
    await first.begin();
    for (const color of ["#111111", "#222222", "#333333", "#444444", "#555555"]) {
        await first.applyPreview({ [BACKGROUND]: color });
    }
    assert.equal(config.colors?.[BACKGROUND], "#555555");

    const restarted = makeWriter(config, state);
    await restarted.initialize();
    assert.equal(config.colors?.[BACKGROUND], "#010101");
    assert.equal(config.colors?.sentinel, true);
    assert.equal(restarted.isBlocked, false);
});

registerTest("a preference failure rolls back an already-written color and primary setting", async () => {
    const config = new MemoryConfiguration();
    const state = new MemoryState();
    const writer = makeWriter(config, state);
    await writer.initialize();
    config.failSettingKey = "iroiroIro.coloredParts";
    await assert.rejects(
        writer.commit({ [BACKGROUND]: "#123456" }, "#123456", { "iroiroIro.coloredParts": { statusBar: false } }),
        /injected setting failure/,
    );
    assert.equal(config.colors?.[BACKGROUND], undefined);
    assert.equal(config.settings.has("iroiroIro.color"), false);
    assert.deepEqual(config.settings.get("iroiroIro.coloredParts"), undefined);
    assert.equal(writer.isBlocked, false);
    assert.equal(writer.historySize, 0);
});

registerTest("journal validation rejects unknown types, settings, and path shapes", async () => {
    const invalidRecords: unknown[] = [
        { schemaVersion: 2, revision: "1", committed: {} },
        {
            schemaVersion: 1,
            revision: "1",
            committed: {
                color: { present: false },
                owned: [{ path: [BACKGROUND, "extra"], before: { present: false }, lastWritten: { present: false } }],
                workspacePreferences: {},
            },
        },
        {
            schemaVersion: 1,
            revision: "1",
            committed: {
                color: { present: false },
                owned: [],
                workspacePreferences: { "iroiroIro.unknown": { present: true, value: false } },
            },
        },
        {
            schemaVersion: 1,
            revision: "1",
            committed: {
                color: { present: true, value: () => undefined },
                owned: [],
                workspacePreferences: {},
            },
        },
    ];
    for (const invalid of invalidRecords) {
        const state = new MemoryState();
        state.value = invalid;
        const config = new MemoryConfiguration();
        const writer = makeWriter(config, state);
        await writer.initialize();
        assert.equal(writer.isBlocked, true);
        assert.equal(config.colorWrites, 0);
    }
});

registerTest("render and preference boundaries reject unregistered or non-JSON input", async () => {
    const writer = makeWriter();
    await writer.initialize();
    await assert.rejects(writer.commit({ "editor.background": "#000000" }, "#000000"), /unregistered/);
    await assert.rejects(writer.updatePreferences({ "iroiroIro.adjustmentStep": 5 }), /Unsafe workspace preference/);
    await assert.rejects(
        writer.updatePreferences({ "iroiroIro.coloredParts": { valid: () => undefined } }),
        /Unsafe workspace preference/,
    );
});

registerTest("history retains only the 20 latest completed appearances", async () => {
    const writer = makeWriter();
    await writer.initialize();
    for (let index = 0; index < 21; index += 1) {
        const color = `#${(index + 1).toString(16).padStart(6, "0")}`;
        assert.equal(await writer.commit({ [BACKGROUND]: color }, color), true);
    }
    assert.equal(writer.historySize, 20);
    for (let index = 0; index < 20; index += 1) {
        assert.equal(await writer.undo(), true);
    }
    assert.equal(await writer.undo(), false);
});

registerTest("the 256 KiB guard prevents a configuration write", async () => {
    const config = new MemoryConfiguration();
    config.colors = { [BACKGROUND]: "x".repeat(257 * 1024) };
    const writer = makeWriter(config);
    await writer.initialize();
    await assert.rejects(writer.commit({ [BACKGROUND]: "#123456" }, "#123456"), /256 KiB/);
    assert.equal(config.colorWrites, 0);
});
