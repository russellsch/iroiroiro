import assert from "node:assert/strict";
import test from "node:test";
import { SettingsWriter } from "../src/storage/writer";
import type { ConfigurationPort, StatePort } from "../src/storage/writer";

const background = "statusBar.background";

class Fixture implements ConfigurationPort, StatePort {
    public colors: Readonly<Record<string, unknown>> | undefined = { [background]: "#111111" };
    public readonly settings = new Map<string, unknown>();
    public state: unknown;
    public failSetting = false;
    public failCompletion = false;
    public readonly diagnostics: string[] = [];

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
        this.colors = value;
        return Promise.resolve();
    }
    public writeSetting(key: string, value: unknown): Promise<void> {
        if (this.failSetting) {
            this.failSetting = false;
            return Promise.reject(new Error("Access denied: /private/sentinel-workspace/private-settings.json"));
        }
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
        if (this.failCompletion && typeof value === "object" && value !== null && "pending" in value) {
            const pending = value.pending;
            if (typeof pending === "object" && pending !== null && "phase" in pending && pending.phase === "complete") {
                this.failCompletion = false;
                return Promise.reject(new Error("journal completion failed"));
            }
        }
        this.state = structuredClone(value);
        return Promise.resolve();
    }
    public writer(): SettingsWriter {
        return new SettingsWriter(this, this, [background], (message) => this.diagnostics.push(message));
    }
}

function failed(error: unknown): void {
    process.exitCode = 1;
    console.error(error);
}

test("failed Reset rolls the restored surface forward to the pre-Reset appearance", async () => {
    const fixture = new Fixture();
    const writer = fixture.writer();
    await writer.initialize();
    await writer.commit({ [background]: "#222222" }, "#222222");
    fixture.failSetting = true;
    await assert.rejects(writer.reset());
    assert.equal(fixture.colors?.[background], "#222222");
    assert.equal(fixture.settings.get("iroiroIro.color"), "#222222");
}).catch(failed);

test("host error data never enters default diagnostic output", async () => {
    const fixture = new Fixture();
    const writer = fixture.writer();
    await writer.initialize();
    fixture.failSetting = true;
    await assert.rejects(writer.commit({ [background]: "#222222" }, "#222222"));
    assert.ok(fixture.diagnostics.length > 0);
    assert.equal(fixture.diagnostics.join(" ").includes("sentinel-workspace"), false);
}).catch(failed);

test("a failed durable completion creates no Undo entry", async () => {
    const fixture = new Fixture();
    const writer = fixture.writer();
    await writer.initialize();
    fixture.failCompletion = true;
    await assert.rejects(writer.commit({ [background]: "#222222" }, "#222222"));
    assert.equal(writer.historySize, 0);
    assert.equal(fixture.colors?.[background], "#111111");
}).catch(failed);

test("Undo detects an external primary color edit before restoring a history entry", async () => {
    const fixture = new Fixture();
    const writer = fixture.writer();
    await writer.initialize();
    await writer.commit({ [background]: "#222222" }, "#222222");
    fixture.settings.set("iroiroIro.color", "#abcdef");
    assert.equal(await writer.undo(), false);
    assert.equal(fixture.settings.get("iroiroIro.color"), "#abcdef");
    assert.equal(writer.historySize, 0);
}).catch(failed);

test("Undo of a color leaves a later general automatic-color preference unchanged", async () => {
    const fixture = new Fixture();
    const writer = fixture.writer();
    await writer.initialize();
    await writer.commit({ [background]: "#222222" }, "#222222");
    await writer.commit({ [background]: "#333333" }, "#333333");
    await writer.updatePreferences({ "iroiroIro.autoColor.enabled": true });
    await writer.undo();
    assert.equal(fixture.settings.get("iroiroIro.color"), "#222222");
    assert.equal(fixture.settings.get("iroiroIro.autoColor.enabled"), true);
}).catch(failed);
