export interface ConfigurationPort {
    readColors(): unknown;
    readEffectiveColors(): unknown;
    readSetting(key: string): unknown;
    writeColors(value: Readonly<Record<string, unknown>> | undefined): Promise<void>;
    writeSetting(key: string, value: unknown): Promise<void>;
}

export interface StatePort {
    read(): unknown;
    write(value: unknown): Promise<void>;
}

export type StoredValue = Readonly<{ present: false } | { present: true; value: unknown }>;

export interface OwnedEntry {
    readonly path: readonly string[];
    readonly before: StoredValue;
    readonly lastWritten: StoredValue;
}

export interface AppearanceSnapshot {
    readonly color: StoredValue;
    readonly owned: readonly OwnedEntry[];
    readonly workspacePreferences: Readonly<Record<string, StoredValue>>;
}

type JournalPhase = "prepared" | "preview" | "committing" | "complete";

interface AttemptedWrite {
    readonly path: readonly string[];
    readonly value: StoredValue;
}

interface RecoveryJournal {
    readonly schemaVersion: 1;
    readonly operationId: string;
    readonly phase: JournalPhase;
    readonly base: AppearanceSnapshot;
    readonly intended: AppearanceSnapshot;
    readonly attemptedWrites: readonly AttemptedWrite[];
}

interface WorkspaceRecord {
    readonly schemaVersion: 1;
    readonly revision: string;
    readonly committed: AppearanceSnapshot;
    readonly pending?: RecoveryJournal;
}

const COLOR_SETTING = "iroiroIro.color";
const PARTS_SETTING = "iroiroIro.coloredParts";
const AUTO_SETTING = "iroiroIro.autoColor.enabled";
const PREFERENCE_KEYS: readonly string[] = [PARTS_SETTING, AUTO_SETTING];
const MAX_RECORD_BYTES = 256 * 1024;
const MAX_HISTORY = 20;
const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

function hasOwn(value: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Readonly<Record<string, unknown>>, allowed: readonly string[]): boolean {
    return Object.keys(value).every((key) => allowed.includes(key));
}

function isSafeJson(value: unknown, depth = 0): boolean {
    if (value === null || typeof value === "string" || typeof value === "boolean") {
        return true;
    }
    if (typeof value === "number") {
        return Number.isFinite(value);
    }
    if (depth > 64) {
        return false;
    }
    if (Array.isArray(value)) {
        return value.every((entry) => isSafeJson(entry, depth + 1));
    }
    if (!isRecord(value)) {
        return false;
    }
    for (const key of Object.keys(value)) {
        if (FORBIDDEN_SEGMENTS.has(key) || !isSafeJson(value[key], depth + 1)) {
            return false;
        }
    }
    return true;
}

function cloneValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((entry) => cloneValue(entry));
    }
    if (isRecord(value)) {
        const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
        for (const key of Object.keys(value)) {
            if (!FORBIDDEN_SEGMENTS.has(key)) {
                result[key] = cloneValue(value[key]);
            }
        }
        return result;
    }
    return value;
}

function present(value: unknown): StoredValue {
    return value === undefined ? { present: false } : { present: true, value: cloneValue(value) };
}

function equal(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) {
        return true;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((entry, index) => equal(entry, right[index]));
    }
    if (!isRecord(left) || !isRecord(right)) {
        return false;
    }
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
        leftKeys.length === rightKeys.length &&
        leftKeys.every((key) => hasOwn(right, key) && equal(left[key], right[key]))
    );
}

function equalStored(left: StoredValue, right: StoredValue): boolean {
    if (left.present !== right.present) {
        return false;
    }
    return !left.present || (right.present && equal(left.value, right.value));
}

function pathId(path: readonly string[]): string {
    return JSON.stringify(path);
}

function isSelector(value: string): boolean {
    return value.startsWith("[") && value.endsWith("]") && value.length >= 3 && !FORBIDDEN_SEGMENTS.has(value);
}

function readPath(colors: Readonly<Record<string, unknown>>, path: readonly string[]): StoredValue {
    if (path.length === 1) {
        const key = path[0];
        return key !== undefined && hasOwn(colors, key) ? present(colors[key]) : { present: false };
    }
    const selector = path[0];
    const key = path[1];
    if (selector === undefined || key === undefined || !hasOwn(colors, selector) || !isRecord(colors[selector])) {
        return { present: false };
    }
    const selected = colors[selector];
    return hasOwn(selected, key) ? present(selected[key]) : { present: false };
}

function setPath(target: Record<string, unknown>, path: readonly string[], value: StoredValue): void {
    const first = path[0];
    if (first === undefined) {
        return;
    }
    if (path.length === 1) {
        if (value.present) {
            target[first] = cloneValue(value.value);
        } else {
            delete target[first];
        }
        return;
    }
    const second = path[1];
    if (second === undefined) {
        return;
    }
    const current = target[first];
    const selected: Record<string, unknown> = isRecord(current)
        ? (cloneValue(current) as Record<string, unknown>)
        : (Object.create(null) as Record<string, unknown>);
    if (value.present) {
        selected[second] = cloneValue(value.value);
    } else {
        delete selected[second];
    }
    if (Object.keys(selected).length === 0) {
        delete target[first];
    } else {
        target[first] = selected;
    }
}

function colorsRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) && isSafeJson(value) ? (cloneValue(value) as Record<string, unknown>) : {};
}

function snapshotEqual(left: AppearanceSnapshot, right: AppearanceSnapshot): boolean {
    if (!equalStored(left.color, right.color) || left.owned.length !== right.owned.length) {
        return false;
    }
    const leftOwned = new Map(left.owned.map((entry) => [pathId(entry.path), entry]));
    for (const entry of right.owned) {
        const match = leftOwned.get(pathId(entry.path));
        if (
            match === undefined ||
            !equalStored(match.before, entry.before) ||
            !equalStored(match.lastWritten, entry.lastWritten)
        ) {
            return false;
        }
    }
    return equal(left.workspacePreferences, right.workspacePreferences);
}

function isStoredValue(value: unknown): value is StoredValue {
    if (!isRecord(value) || typeof value.present !== "boolean") {
        return false;
    }
    if (value.present) {
        return hasOnlyKeys(value, ["present", "value"]) && hasOwn(value, "value") && isSafeJson(value.value);
    }
    return hasOnlyKeys(value, ["present"]) && !hasOwn(value, "value");
}

function isValidPath(path: unknown, registered: ReadonlySet<string>): path is readonly string[] {
    if (
        !Array.isArray(path) ||
        (path.length !== 1 && path.length !== 2) ||
        !path.every((part) => typeof part === "string")
    ) {
        return false;
    }
    const key = path[path.length - 1];
    if (key === undefined || !registered.has(key) || FORBIDDEN_SEGMENTS.has(key)) {
        return false;
    }
    return path.length === 1 || (typeof path[0] === "string" && isSelector(path[0]));
}

function isSnapshot(value: unknown, registered: ReadonlySet<string>): value is AppearanceSnapshot {
    if (
        !isRecord(value) ||
        !hasOnlyKeys(value, ["color", "owned", "workspacePreferences"]) ||
        !isStoredValue(value.color) ||
        !Array.isArray(value.owned) ||
        !isRecord(value.workspacePreferences)
    ) {
        return false;
    }
    const ownedPaths = new Set<string>();
    for (const entry of value.owned) {
        if (
            !isRecord(entry) ||
            !hasOnlyKeys(entry, ["path", "before", "lastWritten"]) ||
            !isValidPath(entry.path, registered) ||
            !isStoredValue(entry.before) ||
            !isStoredValue(entry.lastWritten)
        ) {
            return false;
        }
        const id = pathId(entry.path);
        if (ownedPaths.has(id)) {
            return false;
        }
        ownedPaths.add(id);
    }
    for (const key of Object.keys(value.workspacePreferences)) {
        if (!PREFERENCE_KEYS.includes(key) || !isStoredValue(value.workspacePreferences[key])) {
            return false;
        }
    }
    return true;
}

function isJournal(value: unknown, registered: ReadonlySet<string>): value is RecoveryJournal {
    if (
        !isRecord(value) ||
        !hasOnlyKeys(value, ["schemaVersion", "operationId", "phase", "base", "intended", "attemptedWrites"]) ||
        value.schemaVersion !== 1 ||
        typeof value.operationId !== "string" ||
        !/^[a-z0-9-]{1,128}$/u.test(value.operationId) ||
        !["prepared", "preview", "committing", "complete"].includes(String(value.phase)) ||
        !isSnapshot(value.base, registered) ||
        !isSnapshot(value.intended, registered) ||
        !Array.isArray(value.attemptedWrites)
    ) {
        return false;
    }
    return value.attemptedWrites.every(
        (attempt) =>
            isRecord(attempt) &&
            hasOnlyKeys(attempt, ["path", "value"]) &&
            ((isValidPath(attempt.path, registered) && isStoredValue(attempt.value)) ||
                (Array.isArray(attempt.path) &&
                    attempt.path.length === 1 &&
                    typeof attempt.path[0] === "string" &&
                    [COLOR_SETTING, ...PREFERENCE_KEYS].includes(attempt.path[0]) &&
                    isStoredValue(attempt.value))),
    );
}

function parseRecord(value: unknown, registered: ReadonlySet<string>): WorkspaceRecord | undefined {
    let serialized: string;
    try {
        serialized = JSON.stringify(value);
    } catch {
        return undefined;
    }
    if (new TextEncoder().encode(serialized).length > MAX_RECORD_BYTES || !isRecord(value)) {
        return undefined;
    }
    if (
        value.schemaVersion !== 1 ||
        !hasOnlyKeys(value, ["schemaVersion", "revision", "committed", "pending"]) ||
        typeof value.revision !== "string" ||
        !/^(?:0|[1-9][0-9]{0,15})$/u.test(value.revision) ||
        !Number.isSafeInteger(Number(value.revision)) ||
        !isSnapshot(value.committed, registered) ||
        (hasOwn(value, "pending") && !isJournal(value.pending, registered))
    ) {
        return undefined;
    }
    return cloneValue(value) as WorkspaceRecord;
}

export class SettingsWriter {
    private readonly registered: ReadonlySet<string>;
    private record: WorkspaceRecord | undefined;
    private operationBase: AppearanceSnapshot | undefined;
    private history: AppearanceSnapshot[] = [];
    private blocked = false;
    private previewing = false;
    private writing = false;
    private sequence: Promise<void> = Promise.resolve();
    private operationCounter = 0;
    private knownEffectiveSelectors = new Set<string>();

    public constructor(
        private readonly config: ConfigurationPort,
        private readonly state: StatePort,
        registeredColorKeys: readonly string[],
        private readonly diagnostic: (message: string) => void,
    ) {
        this.registered = new Set(registeredColorKeys.filter((key) => key.length > 0 && !FORBIDDEN_SEGMENTS.has(key)));
    }

    public get isBlocked(): boolean {
        return this.blocked;
    }

    public get isPreviewing(): boolean {
        return this.previewing;
    }

    public get isWriting(): boolean {
        return this.writing;
    }

    public get currentColor(): string | undefined {
        const color = this.record?.committed.color;
        return color?.present && typeof color.value === "string" ? color.value : undefined;
    }

    public get historySize(): number {
        return this.history.length;
    }

    public initialize(): Promise<void> {
        return this.enqueue(async () => {
            this.history = [];
            this.endOperation();
            this.blocked = false;
            const stored = this.state.read();
            if (stored === undefined || stored === null) {
                this.record = this.freshRecord();
                this.captureEffectiveSelectors();
                return;
            }
            const parsed = parseRecord(stored, this.registered);
            if (parsed === undefined) {
                this.blocked = true;
                this.diagnostic("RECOVERY_DATA_INVALID");
                return;
            }
            this.record = parsed;
            this.captureEffectiveSelectors();
            if (parsed.pending === undefined) {
                return;
            }
            if (parsed.pending.phase === "complete") {
                try {
                    await this.finishRecord(parsed.pending.intended);
                } catch (error: unknown) {
                    this.blocked = true;
                    this.diagnostic("RECOVERY_FINALIZATION_FAILED");
                    throw error;
                }
                return;
            }
            try {
                await this.restoreJournal(parsed.pending);
            } catch (error: unknown) {
                this.blocked = true;
                this.diagnostic("RECOVERY_FAILED");
                throw error;
            }
        });
    }

    public begin(): Promise<void> {
        return this.enqueue(async () => {
            this.assertReady();
            if (this.previewing) {
                return;
            }
            const committed = this.requireRecord().committed;
            this.operationBase = cloneValue(committed) as AppearanceSnapshot;
            this.previewing = true;
            await this.savePending("prepared", committed, committed, []);
        });
    }

    public applyPreview(rendered: Readonly<Record<string, string>>): Promise<void> {
        return this.enqueue(async () => {
            this.assertReady();
            if (!this.previewing) {
                throw new Error("A preview must begin before it can be applied.");
            }
            await this.applyRendered(rendered, "preview", true);
        });
    }

    public commit(
        rendered: Readonly<Record<string, string>>,
        color: string | undefined,
        preferences: Readonly<Record<string, unknown>> = {},
    ): Promise<boolean> {
        return this.enqueueResult(async () => {
            this.assertReady();
            this.validateRendered(rendered);
            this.validatePreferences(preferences);
            const base = this.operationBase ?? (cloneValue(this.requireRecord().committed) as AppearanceSnapshot);
            if (!this.previewing) {
                if (this.isDirectNoOp(rendered, color, preferences)) {
                    return false;
                }
                this.operationBase = base;
                await this.savePending("prepared", base, base, []);
            }
            try {
                const intendedColors = await this.applyRendered(rendered, "committing", true);
                const intended = this.makeIntendedSnapshot(intendedColors, color, preferences);
                await this.savePending("committing", base, intended, this.requirePending().attemptedWrites);
                await this.writeSettings(intended, preferences);
                if (snapshotEqual(base, intended)) {
                    await this.finishRecord(intended);
                    this.endOperation();
                    return false;
                }
                await this.markCompleteAndFinish(intended);
                this.pushHistory(base);
                this.endOperation();
                return true;
            } catch (error: unknown) {
                await this.failAndRestore(error);
                throw error;
            }
        });
    }

    public cancel(): Promise<void> {
        return this.enqueue(async () => {
            if (!this.previewing && this.requireRecord().pending === undefined) {
                return;
            }
            const pending = this.requireRecord().pending;
            if (pending !== undefined) {
                if (pending.phase === "complete") {
                    try {
                        await this.finishRecord(pending.intended);
                    } catch (_error: unknown) {
                        this.diagnostic("RECOVERY_FINALIZATION_PENDING");
                    }
                    this.endOperation();
                    return;
                }
                try {
                    await this.restoreJournal(pending);
                } catch (error: unknown) {
                    this.blocked = true;
                    this.diagnostic("PREVIEW_RESTORATION_FAILED");
                    throw error;
                }
            }
            this.endOperation();
        });
    }

    public reset(): Promise<boolean> {
        return this.enqueueResult(async () => {
            this.assertReady();
            const base = cloneValue(this.requireRecord().committed) as AppearanceSnapshot;
            const target: AppearanceSnapshot = {
                color: { present: false },
                owned: [],
                workspacePreferences: {
                    ...base.workspacePreferences,
                    [AUTO_SETTING]: { present: true, value: false },
                },
            };
            if (snapshotEqual(base, target) && base.owned.length === 0) {
                return false;
            }
            await this.savePending("committing", base, target, []);
            try {
                await this.restoreSnapshot(target, this.requirePending());
                await this.writeOneSetting(COLOR_SETTING, target.color);
                await this.writeOneSetting(
                    AUTO_SETTING,
                    target.workspacePreferences[AUTO_SETTING] ?? { present: true, value: false },
                );
                await this.markCompleteAndFinish(target);
                this.pushHistory(base);
                return true;
            } catch (error: unknown) {
                await this.failAndRestore(error);
                throw error;
            }
        });
    }

    public undo(): Promise<boolean> {
        return this.enqueueResult(async () => {
            this.assertReady();
            this.externalChange();
            const target = this.history.pop();
            if (target === undefined) {
                return false;
            }
            const base = cloneValue(this.requireRecord().committed) as AppearanceSnapshot;
            await this.savePending("committing", base, target, []);
            try {
                const restored = await this.restoreSnapshot(target, this.requirePending());
                await this.markCompleteAndFinish(restored);
                return true;
            } catch (error: unknown) {
                this.history.push(target);
                await this.failAndRestore(error);
                throw error;
            }
        });
    }

    public retryRecovery(): Promise<void> {
        return this.enqueue(async () => {
            const raw = this.state.read();
            if (raw === undefined || raw === null) {
                this.record = this.freshRecord();
                this.blocked = false;
                return;
            }
            const stored = parseRecord(raw, this.registered);
            if (stored === undefined) {
                this.blocked = true;
                this.diagnostic("RECOVERY_DATA_INVALID");
                throw new Error("Stored recovery data is invalid.");
            }
            this.record = stored;
            if (stored.pending === undefined) {
                this.blocked = false;
                return;
            }
            if (stored.pending.phase === "complete") {
                await this.finishRecord(stored.pending.intended);
            } else {
                await this.restoreJournal(stored.pending);
            }
            this.blocked = false;
        });
    }

    public reapply(rendered: Readonly<Record<string, string>>, color: string): Promise<void> {
        return this.enqueue(async () => {
            this.assertReady();
            this.validateRendered(rendered);
            const base = cloneValue(this.requireRecord().committed) as AppearanceSnapshot;
            await this.savePending("prepared", base, base, []);
            try {
                const owned = await this.applyRendered(rendered, "committing", false);
                const currentPreferences: Record<string, unknown> = {};
                for (const key of PREFERENCE_KEYS) {
                    currentPreferences[key] = this.config.readSetting(key);
                }
                const intended = this.makeIntendedSnapshot(owned, color, currentPreferences);
                await this.writeOneSetting(COLOR_SETTING, intended.color);
                await this.markCompleteAndFinish(intended);
            } catch (error: unknown) {
                await this.failAndRestore(error);
                throw error;
            }
        });
    }

    public updatePreferences(preferences: Readonly<Record<string, unknown>>): Promise<void> {
        return this.enqueue(async () => {
            this.assertReady();
            this.validatePreferences(preferences);
            const base = cloneValue(this.requireRecord().committed) as AppearanceSnapshot;
            const intended = this.makeIntendedSnapshot(base.owned, this.currentColor, preferences);
            if (snapshotEqual(base, intended)) {
                return;
            }
            await this.savePending("committing", base, intended, []);
            try {
                for (const key of Object.keys(preferences)) {
                    const value = intended.workspacePreferences[key];
                    if (value !== undefined) {
                        await this.writeOneSetting(key, value);
                    }
                }
                await this.markCompleteAndFinish(intended);
                // A general preference is outside appearance history, including earlier entries.
                this.history = this.history.map((snapshot) => {
                    const workspacePreferences = { ...snapshot.workspacePreferences };
                    for (const [key, value] of Object.entries(preferences)) {
                        workspacePreferences[key] = present(value);
                    }
                    return { ...snapshot, workspacePreferences };
                });
            } catch (error: unknown) {
                await this.failAndRestore(error);
                throw error;
            }
        });
    }

    public externalChange(): readonly string[] {
        if (this.writing || this.record === undefined) {
            return [];
        }
        const colors = colorsRecord(this.config.readColors());
        const affected = new Set<string>();
        const retained: OwnedEntry[] = [];
        const pending = this.record.pending;
        for (const entry of this.record.committed.owned) {
            const current = readPath(colors, entry.path);
            if (!equalStored(current, entry.lastWritten)) {
                const expectedAttempt = pending?.attemptedWrites.some(
                    (attempt) => pathId(attempt.path) === pathId(entry.path) && equalStored(current, attempt.value),
                );
                if (expectedAttempt === true) {
                    retained.push(entry);
                    continue;
                }
                const key = entry.path[entry.path.length - 1];
                if (key !== undefined) {
                    affected.add(key);
                }
            } else {
                retained.push(entry);
            }
        }
        const effective = colorsRecord(this.config.readEffectiveColors());
        for (const selector of Object.keys(effective)) {
            if (!isSelector(selector) || this.knownEffectiveSelectors.has(selector) || !isRecord(effective[selector])) {
                continue;
            }
            for (const key of this.registered) {
                if (hasOwn(effective[selector], key)) {
                    affected.add(key);
                }
            }
        }
        if (!equalStored(present(this.config.readSetting(COLOR_SETTING)), this.record.committed.color)) {
            const current = present(this.config.readSetting(COLOR_SETTING));
            const expectedAttempt = pending?.attemptedWrites.some(
                (attempt) =>
                    attempt.path.length === 1 &&
                    attempt.path[0] === COLOR_SETTING &&
                    equalStored(current, attempt.value),
            );
            if (expectedAttempt !== true) {
                affected.add(COLOR_SETTING);
            }
        }
        for (const key of PREFERENCE_KEYS) {
            const expected = this.record.committed.workspacePreferences[key];
            if (expected !== undefined && !equalStored(present(this.config.readSetting(key)), expected)) {
                const current = present(this.config.readSetting(key));
                const expectedAttempt = pending?.attemptedWrites.some(
                    (attempt) =>
                        attempt.path.length === 1 && attempt.path[0] === key && equalStored(current, attempt.value),
                );
                if (expectedAttempt !== true) {
                    affected.add(key);
                }
            }
        }
        if (affected.size > 0) {
            this.history = [];
            this.record = {
                ...this.record,
                committed: { ...this.record.committed, owned: retained },
            };
            this.captureEffectiveSelectors();
        }
        return [...affected];
    }

    private enqueue(work: () => Promise<void>): Promise<void> {
        const result = this.sequence.then(work, work);
        this.sequence = result.catch((_error: unknown) => {
            this.diagnostic("SETTINGS_OPERATION_FAILED");
        });
        return result;
    }

    private enqueueResult<T>(work: () => Promise<T>): Promise<T> {
        const result = this.sequence.then(work, work);
        this.sequence = result.then(
            () => undefined,
            (_error: unknown) => {
                this.diagnostic("SETTINGS_OPERATION_FAILED");
            },
        );
        return result;
    }

    private freshRecord(): WorkspaceRecord {
        const preferences: Record<string, StoredValue> = {};
        for (const key of PREFERENCE_KEYS) {
            preferences[key] = present(this.config.readSetting(key));
        }
        return {
            schemaVersion: 1,
            revision: "0",
            committed: {
                color: present(this.config.readSetting(COLOR_SETTING)),
                owned: [],
                workspacePreferences: preferences,
            },
        };
    }

    private requireRecord(): WorkspaceRecord {
        if (this.record === undefined) {
            throw new Error("SettingsWriter.initialize() must complete before use.");
        }
        return this.record;
    }

    private requirePending(): RecoveryJournal {
        const pending = this.requireRecord().pending;
        if (pending === undefined) {
            throw new Error("The operation has no recovery journal.");
        }
        return pending;
    }

    private assertReady(): void {
        if (this.blocked) {
            throw new Error("Workspace writes are blocked until recovery succeeds.");
        }
        this.requireRecord();
    }

    private validateRendered(rendered: Readonly<Record<string, string>>): void {
        for (const [key, value] of Object.entries(rendered)) {
            if (!this.registered.has(key) || FORBIDDEN_SEGMENTS.has(key) || typeof value !== "string") {
                throw new Error(`Unsafe or unregistered color key: ${key}`);
            }
        }
    }

    private validatePreferences(preferences: Readonly<Record<string, unknown>>): void {
        for (const [key, value] of Object.entries(preferences)) {
            if (!PREFERENCE_KEYS.includes(key) || !isSafeJson(value)) {
                throw new Error(`Unsafe workspace preference: ${key}`);
            }
        }
    }

    private makeIntendedSnapshot(
        owned: readonly OwnedEntry[],
        color: string | undefined,
        preferences: Readonly<Record<string, unknown>>,
    ): AppearanceSnapshot {
        const current = this.requireRecord().committed.workspacePreferences;
        const next: Record<string, StoredValue> = { ...current };
        for (const [key, value] of Object.entries(preferences)) {
            next[key] = present(value);
        }
        return { color: present(color), owned, workspacePreferences: next };
    }

    private isDirectNoOp(
        rendered: Readonly<Record<string, string>>,
        color: string | undefined,
        preferences: Readonly<Record<string, unknown>>,
    ): boolean {
        const committed = this.requireRecord().committed;
        if (!equalStored(committed.color, present(color))) {
            return false;
        }
        for (const [key, value] of Object.entries(preferences)) {
            const current = committed.workspacePreferences[key];
            if (current === undefined || !equalStored(current, present(value))) {
                return false;
            }
        }
        const desired = this.desiredPaths(rendered);
        if (desired.size !== committed.owned.length) {
            return false;
        }
        const colors = colorsRecord(this.config.readColors());
        for (const entry of committed.owned) {
            const value = desired.get(pathId(entry.path));
            if (
                value === undefined ||
                !equalStored(value, entry.lastWritten) ||
                !equalStored(readPath(colors, entry.path), value)
            ) {
                return false;
            }
        }
        return true;
    }

    private desiredPaths(rendered: Readonly<Record<string, string>>): ReadonlyMap<string, StoredValue> {
        const result = new Map<string, StoredValue>();
        const effective = colorsRecord(this.config.readEffectiveColors());
        for (const [key, value] of Object.entries(rendered)) {
            const stored = present(value);
            result.set(pathId([key]), stored);
            for (const selector of Object.keys(effective)) {
                const selected = effective[selector];
                if (isSelector(selector) && isRecord(selected) && hasOwn(selected, key)) {
                    result.set(pathId([selector, key]), stored);
                }
            }
        }
        return result;
    }

    private async applyRendered(
        rendered: Readonly<Record<string, string>>,
        phase: JournalPhase,
        acquireConflicts: boolean,
    ): Promise<readonly OwnedEntry[]> {
        this.validateRendered(rendered);
        const colors = colorsRecord(this.config.readColors());
        const desired = this.desiredPaths(rendered);
        const previousSnapshot = this.requireRecord().pending?.intended ?? this.requireRecord().committed;
        const previous = new Map(previousSnapshot.owned.map((entry) => [pathId(entry.path), entry]));
        const nextOwned: OwnedEntry[] = [];
        const changes = new Map<string, { path: readonly string[]; value: StoredValue; observed: StoredValue }>();

        for (const entry of previous.values()) {
            const id = pathId(entry.path);
            if (!desired.has(id)) {
                const current = readPath(colors, entry.path);
                if (equalStored(current, entry.lastWritten)) {
                    changes.set(id, { path: entry.path, value: entry.before, observed: current });
                }
            }
        }
        for (const [id, value] of desired) {
            const path = JSON.parse(id) as unknown;
            if (!isValidPath(path, this.registered)) {
                throw new Error("An internal color path was invalid.");
            }
            const current = readPath(colors, path);
            const old = previous.get(id);
            if (!acquireConflicts) {
                if (old === undefined && current.present && !equalStored(current, value)) {
                    continue;
                }
                if (old !== undefined && !equalStored(current, old.lastWritten) && !equalStored(current, value)) {
                    continue;
                }
            }
            const before: StoredValue = old?.before ?? (acquireConflicts ? current : { present: false });
            nextOwned.push({ path, before, lastWritten: value });
            if (!equalStored(current, value)) {
                changes.set(id, { path, value, observed: current });
            }
        }
        if (changes.size === 0) {
            return nextOwned;
        }
        const attempts = [...this.requirePending().attemptedWrites];
        for (const change of changes.values()) {
            if (!previous.has(pathId(change.path))) {
                attempts.push({ path: change.path, value: readPath(colors, change.path) });
            }
            attempts.push({ path: change.path, value: change.value });
        }
        const intended: AppearanceSnapshot = {
            ...this.requireRecord().committed,
            owned: nextOwned,
        };
        await this.savePending(phase, this.operationBase ?? this.requirePending().base, intended, attempts);
        const latest = colorsRecord(this.config.readColors());
        for (const change of changes.values()) {
            if (!equalStored(readPath(latest, change.path), change.observed)) {
                throw new Error(`Color settings changed during the operation for ${change.path.join(" / ")}.`);
            }
        }
        for (const change of changes.values()) {
            setPath(latest, change.path, change.value);
        }
        await this.withWriting(() => this.config.writeColors(Object.keys(latest).length === 0 ? undefined : latest));
        const readback = colorsRecord(this.config.readColors());
        for (const change of changes.values()) {
            if (!equalStored(readPath(readback, change.path), change.value)) {
                throw new Error(`Color settings readback failed for ${change.path.join(" / ")}.`);
            }
        }
        return nextOwned;
    }

    private async writeSettings(
        snapshot: AppearanceSnapshot,
        preferences: Readonly<Record<string, unknown>>,
    ): Promise<void> {
        await this.writeOneSetting(COLOR_SETTING, snapshot.color);
        for (const key of Object.keys(preferences)) {
            const value = snapshot.workspacePreferences[key];
            if (value !== undefined) {
                await this.writeOneSetting(key, value);
            }
        }
    }

    private async writeOneSetting(key: string, value: StoredValue, expectedCurrent?: StoredValue): Promise<boolean> {
        const current = present(this.config.readSetting(key));
        if (expectedCurrent !== undefined && !equalStored(current, expectedCurrent)) {
            return false;
        }
        if (equalStored(current, value)) {
            return true;
        }
        const pending = this.requirePending();
        const attempts = [...pending.attemptedWrites, { path: [key], value }];
        await this.savePending(pending.phase, pending.base, pending.intended, attempts);
        if (expectedCurrent !== undefined && !equalStored(present(this.config.readSetting(key)), expectedCurrent)) {
            return false;
        }
        await this.withWriting(() =>
            this.config.writeSetting(key, value.present ? cloneValue(value.value) : undefined),
        );
        if (!equalStored(present(this.config.readSetting(key)), value)) {
            throw new Error(`Workspace setting readback failed for ${key}.`);
        }
        return true;
    }

    private async savePending(
        phase: JournalPhase,
        base: AppearanceSnapshot,
        intended: AppearanceSnapshot,
        attemptedWrites: readonly AttemptedWrite[],
    ): Promise<void> {
        let current = this.requireRecord();
        if (phase !== "complete" && current.pending?.phase === "complete") {
            await this.finishRecord(current.pending.intended);
            current = this.requireRecord();
        }
        const pending: RecoveryJournal = {
            schemaVersion: 1,
            operationId:
                current.pending?.operationId ?? `${Date.now().toString(36)}-${(++this.operationCounter).toString(36)}`,
            phase,
            base: cloneValue(base) as AppearanceSnapshot,
            intended: cloneValue(intended) as AppearanceSnapshot,
            attemptedWrites: cloneValue(attemptedWrites) as readonly AttemptedWrite[],
        };
        const next: WorkspaceRecord = { ...current, pending };
        this.guardSize(next);
        await this.state.write(next);
        this.record = next;
    }

    private async markCompleteAndFinish(intended: AppearanceSnapshot): Promise<void> {
        const pending = this.requirePending();
        await this.savePending("complete", pending.base, intended, pending.attemptedWrites);
        try {
            await this.finishRecord(intended);
        } catch (_error: unknown) {
            const current = this.requireRecord();
            this.record = {
                ...current,
                committed: cloneValue(intended) as AppearanceSnapshot,
            };
            this.captureEffectiveSelectors();
            this.diagnostic("RECOVERY_FINALIZATION_PENDING");
        }
    }

    private async finishRecord(committed: AppearanceSnapshot): Promise<void> {
        const revision = (Number.parseInt(this.requireRecord().revision, 10) + 1).toString();
        const next: WorkspaceRecord = {
            schemaVersion: 1,
            revision,
            committed: cloneValue(committed) as AppearanceSnapshot,
        };
        this.guardSize(next);
        await this.state.write(next);
        this.record = next;
        this.captureEffectiveSelectors();
    }

    private guardSize(value: WorkspaceRecord): void {
        const serialized = JSON.stringify(value);
        if (new TextEncoder().encode(serialized).length > MAX_RECORD_BYTES) {
            throw new Error("Recovery data exceeds the 256 KiB safety limit.");
        }
    }

    private async restoreJournal(journal: RecoveryJournal): Promise<void> {
        const restored = await this.restoreSnapshot(journal.base, journal);
        await this.finishRecord(restored);
        this.endOperation();
    }

    private async restoreSnapshot(target: AppearanceSnapshot, journal: RecoveryJournal): Promise<AppearanceSnapshot> {
        const colors = colorsRecord(this.config.readColors());
        const targetByPath = new Map(target.owned.map((entry) => [pathId(entry.path), entry]));
        const currentOwned = new Map(this.requireRecord().committed.owned.map((entry) => [pathId(entry.path), entry]));
        const attempted = new Map<string, StoredValue[]>();
        const attemptedPaths = new Map<string, readonly string[]>();
        for (const entry of journal.attemptedWrites) {
            if (isValidPath(entry.path, this.registered)) {
                const id = pathId(entry.path);
                const values = attempted.get(id) ?? [];
                values.push(entry.value);
                attempted.set(id, values);
                attemptedPaths.set(id, entry.path);
            }
        }
        const ids = new Set([...currentOwned.keys(), ...targetByPath.keys(), ...attempted.keys()]);
        let changed = false;
        const conflicted = new Set<string>();
        const expected = new Map<string, { path: readonly string[]; value: StoredValue; observed: StoredValue }>();
        for (const id of ids) {
            const source = currentOwned.get(id);
            const destination = targetByPath.get(id);
            const path = source?.path ?? destination?.path ?? attemptedPaths.get(id);
            if (path === undefined) {
                continue;
            }
            const current = readPath(colors, path);
            const allowed = [source?.lastWritten, ...(attempted.get(id) ?? [])].filter(
                (value): value is StoredValue => value !== undefined,
            );
            if (allowed.some((value) => equalStored(current, value))) {
                const desired = destination?.lastWritten ??
                    source?.before ??
                    attempted.get(id)?.[0] ?? { present: false };
                if (!equalStored(current, desired)) {
                    setPath(colors, path, desired);
                    changed = true;
                    expected.set(id, { path, value: desired, observed: current });
                }
            } else if (destination !== undefined) {
                conflicted.add(id);
            }
        }
        if (changed) {
            // Restoration is a write too. A failed Reset must recognize these restored values
            // when rolling forward to its pre-operation appearance.
            const pending = this.requirePending();
            await this.savePending(pending.phase, pending.base, pending.intended, [
                ...pending.attemptedWrites,
                ...[...expected.values()].map((entry) => ({ path: entry.path, value: entry.value })),
            ]);
            const latest = colorsRecord(this.config.readColors());
            const performed: { readonly path: readonly string[]; readonly value: StoredValue }[] = [];
            for (const [id, entry] of expected) {
                if (!equalStored(readPath(latest, entry.path), entry.observed)) {
                    conflicted.add(id);
                    continue;
                }
                setPath(latest, entry.path, entry.value);
                performed.push(entry);
            }
            if (performed.length > 0) {
                await this.withWriting(() =>
                    this.config.writeColors(Object.keys(latest).length === 0 ? undefined : latest),
                );
                const readback = colorsRecord(this.config.readColors());
                for (const entry of performed) {
                    if (!equalStored(readPath(readback, entry.path), entry.value)) {
                        throw new Error(`Color restoration readback failed for ${entry.path.join(" / ")}.`);
                    }
                }
            }
        }
        let resolvedColor = target.color;
        const resolvedPreferences: Record<string, StoredValue> = { ...target.workspacePreferences };
        for (const key of [COLOR_SETTING, ...PREFERENCE_KEYS]) {
            const desired = key === COLOR_SETTING ? target.color : target.workspacePreferences[key];
            if (desired === undefined) {
                continue;
            }
            const attempts = journal.attemptedWrites.filter(
                (entry) => entry.path.length === 1 && entry.path[0] === key,
            );
            const current = present(this.config.readSetting(key));
            const committed =
                key === COLOR_SETTING
                    ? this.requireRecord().committed.color
                    : this.requireRecord().committed.workspacePreferences[key];
            if (
                (committed !== undefined && equalStored(current, committed)) ||
                attempts.some((entry) => equalStored(current, entry.value))
            ) {
                const restored = await this.writeOneSetting(key, desired, current);
                if (!restored) {
                    const latest = present(this.config.readSetting(key));
                    if (key === COLOR_SETTING) {
                        resolvedColor = latest;
                    } else {
                        resolvedPreferences[key] = latest;
                    }
                }
            } else if (key === COLOR_SETTING) {
                resolvedColor = current;
            } else {
                resolvedPreferences[key] = current;
            }
        }
        return {
            color: resolvedColor,
            owned: target.owned.filter((entry) => !conflicted.has(pathId(entry.path))),
            workspacePreferences: resolvedPreferences,
        };
    }

    private async failAndRestore(_original: unknown): Promise<void> {
        const pending = this.requireRecord().pending;
        if (pending === undefined) {
            return;
        }
        try {
            await this.restoreJournal(pending);
        } catch (_recoveryError: unknown) {
            this.blocked = true;
            this.diagnostic("RECOVERY_AFTER_FAILURE_FAILED");
        }
        this.endOperation();
    }

    private pushHistory(snapshot: AppearanceSnapshot): void {
        this.history.push(cloneValue(snapshot) as AppearanceSnapshot);
        if (this.history.length > MAX_HISTORY) {
            this.history.splice(0, this.history.length - MAX_HISTORY);
        }
    }

    private endOperation(): void {
        this.previewing = false;
        this.operationBase = undefined;
    }

    private captureEffectiveSelectors(): void {
        this.knownEffectiveSelectors = this.currentSelectors();
    }

    private currentSelectors(): Set<string> {
        const effective = colorsRecord(this.config.readEffectiveColors());
        const workspace = colorsRecord(this.config.readColors());
        return new Set([...Object.keys(effective), ...Object.keys(workspace)].filter(isSelector));
    }

    private async withWriting(work: () => Promise<void>): Promise<void> {
        this.writing = true;
        try {
            await work();
        } finally {
            this.writing = false;
        }
    }
}
