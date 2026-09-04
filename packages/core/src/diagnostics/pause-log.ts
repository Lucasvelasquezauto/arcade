/**
 * Last few pause events with their duration (spec §9). Takes both a
 * monotonic clock (for the duration math) and a wall clock ISO string (for
 * the displayed timestamp) from the caller — same split `env.ts` already
 * makes between `FrameClock.now()` and `realNowIso()`.
 */
import type { PauseLogEntry } from './types.js';

/** SUPUESTO — no spec fixes how many pause events to keep; 10 mirrors `RecordsView.top10`'s scale. */
const MAX_ENTRIES = 10;

export class PauseLogRecorder {
  private readonly entries: PauseLogEntry[] = [];
  private pendingStartMonotonicMs: number | null = null;
  private pendingStartedAtIso: string | null = null;

  /** Call alongside the real `LifecycleCallbacks.onPause`. Ignored if a pause is already being tracked (idempotent, like `LifecycleController.pause`). */
  recordPauseStart(nowMonotonicMs: number, nowIso: string): void {
    if (this.pendingStartMonotonicMs !== null) return;
    this.pendingStartMonotonicMs = nowMonotonicMs;
    this.pendingStartedAtIso = nowIso;
  }

  /** Call alongside the real `LifecycleCallbacks.onResume` (the countdown reaching zero, not visibility regained). */
  recordResume(nowMonotonicMs: number): void {
    if (this.pendingStartMonotonicMs === null || this.pendingStartedAtIso === null) return;
    const durationMs = Math.max(0, nowMonotonicMs - this.pendingStartMonotonicMs);
    this.entries.push({ startedAt: this.pendingStartedAtIso, durationMs });
    if (this.entries.length > MAX_ENTRIES) this.entries.shift();
    this.pendingStartMonotonicMs = null;
    this.pendingStartedAtIso = null;
  }

  log(): readonly PauseLogEntry[] {
    return this.entries;
  }
}
