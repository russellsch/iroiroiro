export interface PreviewClock {
    readonly schedule: (callback: () => void, milliseconds: number) => () => void;
}

const systemClock: PreviewClock = {
    schedule(callback, milliseconds) {
        const timer = setTimeout(callback, milliseconds);
        return () => clearTimeout(timer);
    },
};

/** Owns the debounce timer and drops queued input before an in-flight write ends. */
export class PreviewScheduler {
    private cancelTimer: (() => void) | undefined;
    private pending: string | undefined;
    private active: Promise<void> = Promise.resolve();
    private running = false;
    private closed = false;

    public constructor(
        private readonly apply: (color: string) => Promise<void>,
        private readonly report: (error: unknown) => void,
        private readonly clock: PreviewClock = systemClock,
    ) {}

    public schedule(color: string): void {
        if (this.closed) {
            return;
        }
        this.discardPending();
        this.cancelTimer = this.clock.schedule(() => {
            this.cancelTimer = undefined;
            this.pending = color;
            if (!this.running) {
                this.running = true;
                this.active = this.drain().catch((error: unknown) => {
                    this.pending = undefined;
                    this.report(error);
                });
            }
        }, 100);
    }

    public discardPending(): void {
        this.cancelTimer?.();
        this.cancelTimer = undefined;
        this.pending = undefined;
    }

    public async close(): Promise<void> {
        this.closed = true;
        this.discardPending();
        await this.active;
    }

    private async drain(): Promise<void> {
        try {
            while (!this.closed && this.pending !== undefined) {
                const color = this.pending;
                this.pending = undefined;
                await this.apply(color);
            }
        } finally {
            this.running = false;
        }
    }
}
