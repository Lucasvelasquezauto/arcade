/**
 * Counts events in a trailing time window, to report a MEASURED rate rather
 * than an assumed constant — spec §9 asks for "fps real" and "ticks por
 * segundo" precisely because the whole point of the diagnostics screen is
 * to catch a device that ISN'T holding 60. Takes a monotonic clock
 * (`performance.now()`-style) supplied by the caller, never reads one
 * itself, so it is fully deterministic under test.
 */
const DEFAULT_WINDOW_MS = 1000;

export class RollingRateCounter {
  private readonly timestamps: number[] = [];

  constructor(private readonly windowMs: number = DEFAULT_WINDOW_MS) {}

  record(nowMs: number, count = 1): void {
    for (let i = 0; i < count; i++) this.timestamps.push(nowMs);
    this.prune(nowMs);
  }

  ratePerSecond(nowMs: number): number {
    this.prune(nowMs);
    return this.timestamps.length / (this.windowMs / 1000);
  }

  private prune(nowMs: number): void {
    const cutoff = nowMs - this.windowMs;
    while (this.timestamps.length > 0) {
      const oldest = this.timestamps[0];
      if (oldest === undefined || oldest >= cutoff) break;
      this.timestamps.shift();
    }
  }
}
