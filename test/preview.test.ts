import { strict as assert } from "node:assert";
import { test } from "node:test";
import { PreviewScheduler } from "../src/preview";
import type { PreviewClock } from "../src/preview";

class Clock implements PreviewClock {
    private milliseconds = 0;
    private readonly tasks = new Map<() => void, number>();

    public schedule(callback: () => void, milliseconds: number): () => void {
        this.tasks.set(callback, this.milliseconds + milliseconds);
        return () => {
            this.tasks.delete(callback);
        };
    }

    public tick(milliseconds: number): void {
        this.milliseconds += milliseconds;
        for (const [callback, due] of this.tasks) {
            if (due <= this.milliseconds) {
                this.tasks.delete(callback);
                callback();
            }
        }
    }
}

function failed(error: unknown): void {
    process.exitCode = 1;
    console.error(error);
}

test("preview debounce starts at 100 ms and superseded input never writes", async () => {
    const clock = new Clock();
    const written: string[] = [];
    const scheduler = new PreviewScheduler(
        (color) => {
            written.push(color);
            return Promise.resolve();
        },
        failed,
        clock,
    );
    scheduler.schedule("#ff0000");
    clock.tick(99);
    assert.deepEqual(written, []);
    scheduler.schedule("#008000");
    clock.tick(99);
    assert.deepEqual(written, []);
    clock.tick(1);
    assert.deepEqual(written, ["#008000"]);
    await scheduler.close();
}).catch(failed);

test("cancel waits for an active write and prevents every queued write", async () => {
    const clock = new Clock();
    const written: string[] = [];
    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
        release = resolve;
    });
    const scheduler = new PreviewScheduler(
        async (color) => {
            written.push(color);
            await waiting;
        },
        failed,
        clock,
    );
    scheduler.schedule("#ff0000");
    clock.tick(100);
    scheduler.schedule("#008000");
    clock.tick(100);
    let closed = false;
    const closing = scheduler.close().then(() => {
        closed = true;
    });
    await Promise.resolve();
    assert.equal(closed, false);
    release?.();
    await closing;
    scheduler.schedule("#0000ff");
    clock.tick(1000);
    assert.deepEqual(written, ["#ff0000"]);
    await scheduler.close();
}).catch(failed);

test("invalid input discards the last pending valid preview", async () => {
    const clock = new Clock();
    const written: string[] = [];
    const scheduler = new PreviewScheduler(
        (color) => {
            written.push(color);
            return Promise.resolve();
        },
        failed,
        clock,
    );
    scheduler.schedule("#ff0000");
    scheduler.discardPending();
    clock.tick(100);
    await scheduler.close();
    assert.deepEqual(written, []);
}).catch(failed);

test("a preview failure reaches one terminal handler and close remains safe", async () => {
    const clock = new Clock();
    const errors: unknown[] = [];
    const scheduler = new PreviewScheduler(
        () => Promise.reject(new Error("read_only")),
        (error) => errors.push(error),
        clock,
    );
    scheduler.schedule("#ff0000");
    clock.tick(100);
    await scheduler.close();
    assert.equal(errors.length, 1);
    await scheduler.close();
}).catch(failed);
