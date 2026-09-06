import { createHash, randomInt, randomUUID } from "node:crypto";
import { mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import { colorDistance, parseHex, selectRandomColor } from "./domain/colors";

interface WindowRecord {
    readonly schemaVersion: 1;
    readonly instanceId: string;
    readonly workspaceKey: string;
    readonly color: string;
    readonly phase: "reservation" | "committed";
    readonly updatedAtMs: number;
    readonly expiresAtMs: number;
}

export interface PeerStorageSnapshot {
    readonly contents: readonly string[];
    readonly limited: boolean;
    readonly ignored: boolean;
}

export interface PeerStorage {
    read(directory: string): Promise<PeerStorageSnapshot>;
    writeAtomic(path: string, temporaryPath: string, content: string, current: () => boolean): Promise<void>;
    remove(path: string): Promise<void>;
}

export interface PeerCoordinatorOptions {
    readonly storage?: PeerStorage;
    readonly now?: () => number;
    readonly wait?: (milliseconds: number) => Promise<void>;
    readonly budgetMs?: number;
}

const HEARTBEAT_MS = 30_000;
const COMMITTED_EXPIRY_MS = 90_000;
const RESERVATION_EXPIRY_MS = 10_000;
const DEFAULT_BUDGET_MS = 250;
const MAX_RECORDS = 256;
const MAX_RECORD_BYTES = 4 * 1024;

const nodeStorage: PeerStorage = {
    async read(directory): Promise<PeerStorageSnapshot> {
        await mkdir(directory, { recursive: true });
        const names = (await readdir(directory)).filter((name) => /^[0-9a-f-]{36}\.json$/.test(name)).sort();
        let ignored = false;
        const contents: string[] = [];
        for (const name of names.slice(0, MAX_RECORDS)) {
            const path = join(directory, name);
            try {
                const information = await stat(path);
                if (information.size > MAX_RECORD_BYTES) {
                    ignored = true;
                    continue;
                }
                const handle = await open(path, "r");
                try {
                    const buffer = Buffer.alloc(MAX_RECORD_BYTES + 1);
                    const result = await handle.read(buffer, 0, buffer.length, 0);
                    if (result.bytesRead > MAX_RECORD_BYTES) {
                        ignored = true;
                    } else {
                        contents.push(buffer.toString("utf8", 0, result.bytesRead));
                    }
                } finally {
                    await handle.close();
                }
            } catch (_error: unknown) {
                ignored = true;
            }
        }
        return { contents, limited: names.length > MAX_RECORDS, ignored };
    },
    async writeAtomic(path, temporaryPath, content, current): Promise<void> {
        try {
            await mkdir(join(path, ".."), { recursive: true });
            const handle = await open(temporaryPath, "wx", 0o600);
            try {
                await handle.writeFile(content, { encoding: "utf8" });
                await handle.sync();
            } finally {
                await handle.close();
            }
            if (!current()) {
                await rm(temporaryPath, { force: true });
                return;
            }
            await rename(temporaryPath, path);
            // A logical timeout can supersede this write while rename is in progress.
            if (!current()) {
                await rm(path, { force: true });
            }
        } catch (error: unknown) {
            await rm(temporaryPath, { force: true });
            throw error;
        }
    },
    async remove(path): Promise<void> {
        await rm(path, { force: true });
    },
};

function isRecord(value: unknown, now: number): value is WindowRecord {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }
    const required = ["schemaVersion", "instanceId", "workspaceKey", "color", "phase", "updatedAtMs", "expiresAtMs"];
    if (Object.keys(value).length !== required.length || required.some((key) => !Object.hasOwn(value, key))) {
        return false;
    }
    if (
        !("schemaVersion" in value) ||
        !("instanceId" in value) ||
        !("workspaceKey" in value) ||
        !("color" in value) ||
        !("phase" in value) ||
        !("updatedAtMs" in value) ||
        !("expiresAtMs" in value)
    ) {
        return false;
    }
    const color = parseHex(value.color);
    if (value.phase !== "reservation" && value.phase !== "committed") {
        return false;
    }
    const maximumLifetime = value.phase === "committed" ? COMMITTED_EXPIRY_MS : RESERVATION_EXPIRY_MS;
    return (
        value.schemaVersion === 1 &&
        typeof value.instanceId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.instanceId) &&
        typeof value.workspaceKey === "string" &&
        /^[0-9a-f]{64}$/.test(value.workspaceKey) &&
        color === value.color &&
        typeof value.updatedAtMs === "number" &&
        Number.isSafeInteger(value.updatedAtMs) &&
        value.updatedAtMs >= 0 &&
        typeof value.expiresAtMs === "number" &&
        Number.isSafeInteger(value.expiresAtMs) &&
        value.expiresAtMs > now &&
        value.expiresAtMs <= now + COMMITTED_EXPIRY_MS &&
        value.updatedAtMs <= value.expiresAtMs &&
        value.expiresAtMs - value.updatedAtMs <= maximumLifetime
    );
}

function systemWait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

export class PeerCoordinator {
    private readonly directory: string;
    private readonly instanceId = randomUUID();
    private readonly workspaceKey: string;
    private readonly recordPath: string;
    private readonly diagnostic: (message: string) => void;
    private readonly storage: PeerStorage;
    private readonly now: () => number;
    private readonly wait: (milliseconds: number) => Promise<void>;
    private readonly budgetMs: number;
    private heartbeat: ReturnType<typeof setInterval> | undefined;
    private physicalWrites: Promise<void> = Promise.resolve();
    private generation = 0;
    private committedColor: string | undefined;
    // The next publication consumes the random operation's original coordination deadline.
    private pendingPublishDeadline: number | undefined;
    private disposed = false;

    public constructor(
        directory: string,
        workspaceUri: string,
        diagnostic: (message: string) => void,
        options: PeerCoordinatorOptions = {},
    ) {
        this.directory = join(directory, "active", "v1");
        this.workspaceKey = createHash("sha256").update(workspaceUri).digest("hex");
        this.recordPath = join(this.directory, `${this.instanceId}.json`);
        this.diagnostic = diagnostic;
        this.storage = options.storage ?? nodeStorage;
        this.now = options.now ?? Date.now;
        this.wait = options.wait ?? systemWait;
        this.budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
    }

    public async choose(
        candidates: readonly string[],
        current: string | undefined,
        preferDistinct: boolean,
    ): Promise<string> {
        const deadline = this.now() + this.budgetMs;
        this.pendingPublishDeadline = deadline;
        if (!preferDistinct) {
            return selectRandomColor(candidates, [], current, false, randomInt);
        }
        let peers = await this.readPeersBefore(deadline);
        let selection = selectRandomColor(
            candidates,
            peers.map((record) => record.color),
            current,
            true,
            randomInt,
        );
        for (let attempt = 0; attempt < 3 && this.remaining(deadline) > 0; attempt += 1) {
            await this.beforeDeadline(this.scheduleRecord(selection, "reservation"), deadline, undefined);
            const waited = await this.beforeDeadline(
                this.wait(50).then(() => true),
                deadline,
                false,
            );
            if (!waited) {
                break;
            }
            peers = await this.readPeersBefore(deadline);
            const conflict = peers.some(
                (record) =>
                    colorDistance(selection, record.color) < 0.1 &&
                    (record.phase === "committed" || record.instanceId < this.instanceId),
            );
            if (!conflict) {
                return selection;
            }
            if (attempt < 2) {
                selection = selectRandomColor(
                    candidates,
                    peers.map((record) => record.color),
                    current,
                    true,
                    randomInt,
                );
            }
        }
        this.diagnostic("PEER_COORDINATION_BUDGET_EXHAUSTED");
        return selection;
    }

    public async publish(color: string | undefined): Promise<void> {
        const deadline = this.pendingPublishDeadline ?? this.now() + this.budgetMs;
        this.pendingPublishDeadline = undefined;
        const parsed = parseHex(color);
        if (parsed !== undefined) {
            this.committedColor = parsed;
            await this.beforeDeadline(this.scheduleRecord(parsed, "committed"), deadline, undefined);
            this.startHeartbeat();
            return;
        }
        this.committedColor = undefined;
        this.stopHeartbeat();
        await this.beforeDeadline(this.scheduleRemoval(), deadline, undefined);
    }

    public async dispose(): Promise<void> {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.committedColor = undefined;
        this.stopHeartbeat();
        const deadline = this.now() + this.budgetMs;
        await this.beforeDeadline(this.scheduleRemoval(), deadline, undefined);
    }

    private startHeartbeat(): void {
        if (this.heartbeat !== undefined || this.disposed) {
            return;
        }
        this.heartbeat = setInterval(() => {
            const color = this.committedColor;
            if (color !== undefined && !this.disposed) {
                this.scheduleRecord(color, "committed").catch((_error: unknown) => {
                    this.diagnostic("PEER_HEARTBEAT_WRITE_FAILED");
                });
            }
        }, HEARTBEAT_MS);
    }

    private stopHeartbeat(): void {
        if (this.heartbeat !== undefined) {
            clearInterval(this.heartbeat);
            this.heartbeat = undefined;
        }
    }

    private async readPeersBefore(deadline: number): Promise<readonly WindowRecord[]> {
        const snapshot = await this.beforeDeadline(this.storage.read(this.directory), deadline, undefined);
        if (snapshot === undefined) {
            this.diagnostic("PEER_SNAPSHOT_FAILED_OR_TIMED_OUT");
            return [];
        }
        if (snapshot.limited) {
            this.diagnostic("PEER_RECORD_LIMIT_REACHED");
        }
        if (snapshot.ignored) {
            this.diagnostic("PEER_RECORD_IGNORED");
        }
        const records: WindowRecord[] = [];
        const now = this.now();
        for (const content of snapshot.contents.slice(0, MAX_RECORDS)) {
            try {
                const parsed: unknown = JSON.parse(content);
                if (
                    isRecord(parsed, now) &&
                    parsed.workspaceKey !== this.workspaceKey &&
                    parsed.instanceId !== this.instanceId
                ) {
                    records.push(parsed);
                }
            } catch (_error: unknown) {
                this.diagnostic("PEER_RECORD_IGNORED");
            }
        }
        return records;
    }

    private scheduleRecord(color: string, phase: WindowRecord["phase"]): Promise<void> {
        // Serialized generations let late writes clean up before a newer write reaches the same record path.
        const generation = ++this.generation;
        const now = this.now();
        const record: WindowRecord = {
            schemaVersion: 1,
            instanceId: this.instanceId,
            workspaceKey: this.workspaceKey,
            color,
            phase,
            updatedAtMs: now,
            expiresAtMs: now + (phase === "committed" ? COMMITTED_EXPIRY_MS : RESERVATION_EXPIRY_MS),
        };
        const temporary = join(this.directory, `${this.instanceId}.${randomUUID()}.tmp`);
        return this.enqueuePhysical(async () => {
            if (!this.isCurrent(generation)) {
                return;
            }
            await this.storage.writeAtomic(this.recordPath, temporary, JSON.stringify(record), () =>
                this.isCurrent(generation),
            );
        }, "PEER_RECORD_UPDATE_FAILED");
    }

    private scheduleRemoval(): Promise<void> {
        const generation = ++this.generation;
        return this.enqueuePhysical(async () => {
            if (generation === this.generation) {
                await this.storage.remove(this.recordPath);
            }
        }, "PEER_RECORD_CLEANUP_FAILED");
    }

    private enqueuePhysical(work: () => Promise<void>, failureCode: string): Promise<void> {
        const operation = this.physicalWrites.then(work, work).catch((_error: unknown) => {
            this.diagnostic(failureCode);
        });
        this.physicalWrites = operation;
        return operation;
    }

    private isCurrent(generation: number): boolean {
        return !this.disposed && generation === this.generation;
    }

    private remaining(deadline: number): number {
        return Math.max(0, deadline - this.now());
    }

    private async beforeDeadline<T>(operation: Promise<T>, deadline: number, fallback: T): Promise<T> {
        const remaining = this.remaining(deadline);
        if (remaining <= 0) {
            operation.catch((_error: unknown) => undefined);
            return fallback;
        }
        return await new Promise<T>((resolve) => {
            let completed = false;
            const finish = (value: T): void => {
                if (!completed) {
                    completed = true;
                    clearTimeout(timer);
                    resolve(value);
                }
            };
            const timer = setTimeout(() => finish(fallback), remaining);
            operation.then(finish, () => finish(fallback));
        });
    }
}
