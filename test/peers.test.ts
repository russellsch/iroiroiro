import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { PeerCoordinator } from "../src/peers";
import type { PeerStorage, PeerStorageSnapshot } from "../src/peers";

function registerTest(name: string, body: () => void | Promise<void>): void {
    test(name, body).catch((error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.message : "Unknown test registration failure"}\n`);
        process.exitCode = 1;
    });
}

registerTest("peer coordination prefers a color separated from another workspace", async () => {
    const directory = await mkdtemp(join(tmpdir(), "iroiro-peers-"));
    try {
        const records = join(directory, "active", "v1");
        await mkdir(records, { recursive: true });
        const now = Date.now();
        const peerId = randomUUID();
        await writeFile(
            join(records, `${peerId}.json`),
            JSON.stringify({
                schemaVersion: 1,
                instanceId: peerId,
                workspaceKey: createHash("sha256").update("file:///other").digest("hex"),
                color: "#ff0000",
                phase: "committed",
                updatedAtMs: now,
                expiresAtMs: now + 90_000,
            }),
        );
        const diagnostics: string[] = [];
        const coordinator = new PeerCoordinator(directory, "file:///current", (message) => diagnostics.push(message));
        const chosen = await coordinator.choose(["#ff0000", "#0000ff"], undefined, true);
        assert.equal(chosen, "#0000ff");
        await coordinator.publish(chosen);
        const ownName = (await readdir(records)).find((name) => name !== `${peerId}.json`);
        assert.ok(ownName !== undefined);
        const ownText = await readFile(join(records, ownName), "utf8");
        const ownValue: unknown = JSON.parse(ownText);
        assert.equal(typeof ownValue, "object");
        assert.doesNotMatch(ownText, /file:\/\/\/current/);
        assert.match(ownText, /"phase":"committed"/);
        assert.deepEqual(diagnostics, []);
        await coordinator.publish(undefined);
        assert.deepEqual(await readdir(records), [`${peerId}.json`]);
        await coordinator.dispose();
        await coordinator.dispose();
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

registerTest("disabled distinction chooses without creating coordination files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "iroiro-peers-"));
    try {
        const coordinator = new PeerCoordinator(directory, "file:///current", () => undefined);
        assert.equal(await coordinator.choose(["#123456"], undefined, false), "#123456");
        assert.deepEqual(await readdir(directory), []);
        await coordinator.dispose();
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

registerTest("stalled storage respects the shared deadline and stale writes clean themselves", async () => {
    let releaseWrite: (() => void) | undefined;
    let reportCleanup: (() => void) | undefined;
    const writeGate = new Promise<void>((resolve) => {
        releaseWrite = resolve;
    });
    const cleaned = new Promise<void>((resolve) => {
        reportCleanup = resolve;
    });
    class StalledStorage implements PeerStorage {
        public record: string | undefined;
        public writes = 0;

        public read(_directory: string): Promise<PeerStorageSnapshot> {
            return Promise.resolve({ contents: [], limited: false, ignored: false });
        }

        public async writeAtomic(
            _path: string,
            _temporaryPath: string,
            content: string,
            current: () => boolean,
        ): Promise<void> {
            this.writes += 1;
            const mayRename = current();
            await writeGate;
            if (mayRename) {
                this.record = content;
                if (!current()) {
                    this.record = undefined;
                }
            }
        }

        public remove(_path: string): Promise<void> {
            this.record = undefined;
            reportCleanup?.();
            return Promise.resolve();
        }
    }
    const storage = new StalledStorage();
    const diagnostics: string[] = [];
    const coordinator = new PeerCoordinator("/unused", "file:///deadline", (message) => diagnostics.push(message), {
        storage,
        budgetMs: 30,
    });
    const started = Date.now();
    const selected = await coordinator.choose(["#123456", "#abcdef"], undefined, true);
    assert.match(selected, /^#[0-9a-f]{6}$/);
    await coordinator.publish(selected);
    await coordinator.dispose();
    assert.ok(Date.now() - started < 200, "Choose, publish, and dispose must return without waiting for stalled I/O.");
    releaseWrite?.();
    await cleaned;
    assert.equal(storage.record, undefined, "A late reservation must not survive disposal.");
    assert.equal(storage.writes, 1, "Superseded writes must be skipped before they reach storage.");
    assert.ok(diagnostics.includes("PEER_COORDINATION_BUDGET_EXHAUSTED"));
});

registerTest("a stalled snapshot and failed writes still return a local candidate", async () => {
    const storage: PeerStorage = {
        read: () => new Promise<PeerStorageSnapshot>(() => undefined),
        writeAtomic: () => Promise.reject(new Error("injected write failure")),
        remove: () => Promise.reject(new Error("injected removal failure")),
    };
    const diagnostics: string[] = [];
    const coordinator = new PeerCoordinator("/unused", "file:///failed-io", (message) => diagnostics.push(message), {
        storage,
        budgetMs: 20,
    });
    const started = Date.now();
    const selected = await coordinator.choose(["#123456"], undefined, true);
    await coordinator.publish(selected);
    await coordinator.dispose();
    assert.equal(selected, "#123456");
    assert.ok(Date.now() - started < 150);
    assert.ok(diagnostics.includes("PEER_SNAPSHOT_FAILED_OR_TIMED_OUT"));
});

registerTest("a read rejected after the deadline check is consumed", async () => {
    let clockReads = 0;
    const unhandled: unknown[] = [];
    const listener = (reason: unknown): void => {
        unhandled.push(reason);
    };
    process.on("unhandledRejection", listener);
    try {
        const storage: PeerStorage = {
            read: () => Promise.reject(new Error("injected expired read")),
            writeAtomic: () => Promise.resolve(),
            remove: () => Promise.resolve(),
        };
        const coordinator = new PeerCoordinator("/unused", "file:///expired-read", () => undefined, {
            storage,
            budgetMs: 10,
            now: () => {
                clockReads += 1;
                return clockReads === 1 ? 0 : 11;
            },
        });
        assert.equal(await coordinator.choose(["#abcdef"], undefined, true), "#abcdef");
        await new Promise<void>((resolve) => setImmediate(resolve));
        assert.deepEqual(unhandled, []);
        await coordinator.dispose();
    } finally {
        process.off("unhandledRejection", listener);
    }
});
