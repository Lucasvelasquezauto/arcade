/**
 * Ticks/s and ticks dropped by the loop's cap (spec §9), measured by
 * reusing — not reimplementing — `advanceAccumulator` from `loop.ts`: the
 * exact same pure function `GameLoop.onFrame` calls internally, fed the same
 * `elapsedMs` sequence.
 *
 * SUPUESTO — `GameLoop` exposes no hook to observe its ticks-per-frame from
 * the outside, and this task's brief is explicit that the loop is not to be
 * rewritten ("respétalos, no los reescribas"). So this recorder keeps its
 * OWN accumulator, mirroring `GameLoop`'s private one via the same public,
 * already-tested pure function — it does not duplicate the algorithm, it
 * calls it. Whoever wires the real loop must call `recordFrame` here with
 * the exact same `elapsedMs` given to `GameLoop.onFrame`, and `pause`/
 * `resume` here alongside the real `GameLoop.pause()`/`resume()` calls, or
 * the two accumulators drift apart. See `docs/handoff/1.9-core-records.md`.
 */
import { TICK_MS } from '@arcade/contracts';
import { advanceAccumulator, MAX_TICKS_PER_FRAME } from '../loop.js';
import { RollingRateCounter } from './rolling-rate-counter.js';

export class LoopStatsRecorder {
  private accumulatorMs = 0;
  private droppedTicksTotalCount = 0;
  private readonly rate = new RollingRateCounter();

  /** Call once per displayed frame, alongside `GameLoop.onFrame(elapsedMs)`, with the same `elapsedMs`. */
  recordFrame(nowMs: number, elapsedMs: number): void {
    const total = this.accumulatorMs + elapsedMs;
    const wantedTicks = Math.floor(total / TICK_MS);
    const advance = advanceAccumulator(this.accumulatorMs, elapsedMs, TICK_MS, MAX_TICKS_PER_FRAME);
    this.accumulatorMs = advance.accumulatorMs;
    if (advance.ticks > 0) this.rate.record(nowMs, advance.ticks);
    if (wantedTicks > advance.ticks) this.droppedTicksTotalCount += wantedTicks - advance.ticks;
  }

  /** Mirrors `GameLoop.pause()`: the accumulator is discarded, never carried across a pause. */
  pause(): void {
    this.accumulatorMs = 0;
  }

  /** Mirrors `GameLoop.resume()`. */
  resume(): void {
    this.accumulatorMs = 0;
  }

  ticksPerSecond(nowMs: number): number {
    return this.rate.ratePerSecond(nowMs);
  }

  droppedTicksTotal(): number {
    return this.droppedTicksTotalCount;
  }
}
