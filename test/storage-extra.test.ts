import assert from "node:assert/strict";
import test from "node:test";

import { SettingsWriter } from "../src/storage/writer";
import type { ConfigurationPort, StatePort } from "../src/storage/writer";

const background = "statusBar.background";
const selector = "[Removed Theme]";

class SelectorFixture implements ConfigurationPort, StatePort {
    public colors: Readonly<Record<string, unknown>> | undefined = {
        [background]: "#111111",
        [selector]: { [background]: "#111111" },
    };
    public state: unknown;
    public colorWrites = 0;
    public mutateOnAttemptJournal: (() => void) | undefined;
    public failFinalRecordAfterComplete = false;
    public readonly settings = new Map<string, unknown>();

    public readColors(): unknown {
        return this.colors;
    }

    public readEffectiveColors(): unknown {
        return this.colors;
    }

    public readSetting(key: string): unknown {
        return this.settings.get(key);
    }

    public writeColors(value: Readonly<Record<string, unknown>> | undefined): Promise<void> {
        this.colorWrites += 1;
        this.colors = value;
        return Promise.resolve();
    }

    public writeSetting(key: string, value: unknown): Promise<void> {
        if (value === undefined) {
            this.settings.delete(key);
        } else {
            this.settings.set(key, value);
        }
        return Promise.resolve();
    }

    public read(): unknown {
        return this.state;
    }

    public write(value: unknown): Promise<void> {
        if (typeof value === "object" && value !== null && "pending" in value) {
            const pending = value.pending;
            if (
                typeof pending === "object" &&
                pending !== null &&
                "attemptedWrites" in pending &&
                Array.isArray(pending.attemptedWrites) &&
                pending.attemptedWrites.length > 0 &&
                this.mutateOnAttemptJournal !== undefined
            ) {
                const mutate = this.mutateOnAttemptJournal;
                this.mutateOnAttemptJournal = undefined;
                mutate();
            }
        } else if (this.failFinalRecordAfterComplete && this.hasCompleteJournal()) {
            this.failFinalRecordAfterComplete = false;
            return Promise.reject(new Error("final record write failed"));
        }
        this.state = structuredClone(value);
        return Promise.resolve();
    }

    public writer(): SettingsWriter {
        return new SettingsWriter(this, this, [background], () => undefined);
    }

    private hasCompleteJournal(): boolean {
        if (typeof this.state !== "object" || this.state === null || !("pending" in this.state)) {
            return false;
        }
        const pending = this.state.pending;
        return typeof pending === "object" && pending !== null && "phase" in pending && pending.phase === "complete";
    }
}

function failed(error: unknown): void {
    process.exitCode = 1;
    console.error(error);
}

test("a removed stored theme selector stays removed after activation", async () => {
    const fixture = new SelectorFixture();
    const first = fixture.writer();
    await first.initialize();
    await first.commit({ [background]: "#222222" }, "#222222");

    fixture.colors = { [background]: "#222222" };
    const restarted = fixture.writer();
    await restarted.initialize();
    assert.equal(restarted.isBlocked, false);
    await restarted.reapply({ [background]: "#222222" }, "#222222");
    assert.deepEqual(fixture.colors, { [background]: "#222222" });
}).catch(failed);

test("a late external edit aborts a rendered transaction before its configuration write", async () => {
    const fixture = new SelectorFixture();
    fixture.colors = { [background]: "#111111" };
    const writer = fixture.writer();
    await writer.initialize();
    fixture.mutateOnAttemptJournal = () => {
        fixture.colors = { [background]: "#external" };
    };
    await assert.rejects(writer.commit({ [background]: "#222222" }, "#222222"), /changed during/);
    assert.deepEqual(fixture.colors, { [background]: "#external" });
    assert.equal(fixture.colorWrites, 0);
    assert.equal(writer.historySize, 0);
}).catch(failed);

test("a late external edit is skipped and released during restoration", async () => {
    const fixture = new SelectorFixture();
    fixture.colors = { [background]: "#111111" };
    const writer = fixture.writer();
    await writer.initialize();
    await writer.commit({ [background]: "#222222" }, "#222222");
    fixture.mutateOnAttemptJournal = () => {
        fixture.colors = { [background]: "#external" };
    };
    assert.equal(await writer.reset(), true);
    assert.deepEqual(fixture.colors, { [background]: "#external" });
}).catch(failed);

test("a durable complete journal remains authoritative when final consolidation fails", async () => {
    const fixture = new SelectorFixture();
    fixture.colors = { [background]: "#111111" };
    const writer = fixture.writer();
    await writer.initialize();
    fixture.failFinalRecordAfterComplete = true;
    assert.equal(await writer.commit({ [background]: "#222222" }, "#222222"), true);
    assert.equal(fixture.colors?.[background], "#222222");
    assert.equal(fixture.settings.get("iroiroIro.color"), "#222222");
    assert.equal(writer.currentColor, "#222222");
    assert.equal(writer.historySize, 1);
    fixture.failFinalRecordAfterComplete = true;
    await writer.cancel();
    assert.equal(fixture.colors?.[background], "#222222");

    const restarted = fixture.writer();
    await restarted.initialize();
    assert.equal(restarted.isBlocked, false);
    assert.equal(restarted.currentColor, "#222222");
}).catch(failed);

test("record validation rejects duplicate ownership and malformed identifiers", async () => {
    const entry = {
        path: [background],
        before: { present: true, value: "#111111" },
        lastWritten: { present: true, value: "#222222" },
    };
    const snapshot = {
        color: { present: true, value: "#222222" },
        owned: [entry],
        workspacePreferences: {
            "iroiroIro.coloredParts": { present: false },
            "iroiroIro.autoColor.enabled": { present: false },
        },
    };
    const invalidRecords: unknown[] = [
        { schemaVersion: 1, revision: "01", committed: snapshot },
        { schemaVersion: 1, revision: "not-a-revision", committed: snapshot },
        { schemaVersion: 1, revision: "9999999999999999", committed: snapshot },
        { schemaVersion: 1, revision: "1", committed: { ...snapshot, owned: [entry, entry] } },
        {
            schemaVersion: 1,
            revision: "1",
            committed: snapshot,
            pending: {
                schemaVersion: 1,
                operationId: "bad operation id",
                phase: "prepared",
                base: snapshot,
                intended: snapshot,
                attemptedWrites: [],
            },
        },
    ];
    for (const record of invalidRecords) {
        const fixture = new SelectorFixture();
        fixture.colors = { [background]: "#222222" };
        fixture.state = record;
        const writer = fixture.writer();
        await writer.initialize();
        assert.equal(writer.isBlocked, true);
        assert.equal(fixture.colorWrites, 0);
    }
}).catch(failed);
