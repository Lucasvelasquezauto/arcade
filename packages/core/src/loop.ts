/**
 * Fixed-step game loop (spec §2). The simulation always advances in whole
 * `TICK_MS` steps, independent of the display's actual refresh rate.
 */
import type { DrawSurface, GameModule, InputState, SoundEvent } from '@arcade/contracts';
import { TICK_MS } from '@arcade/contracts';
import { realFrameClock, type FrameClock } from './env.js';

/**
 * VERIFICADO docs/specs/core.md §2.1: without this cap, a slow frame produces
 * a flood of catch-up ticks, which makes the next frame slower still — the
 * game freezes in a spiral, rather than showing one visible skipped beat.
 */
export const MAX_TICKS_PER_FRAME = 5;

export interface AccumulatorAdvance {
  readonly ticks: number;
  readonly accumulatorMs: number;
  /** Interpolation factor in [0, 1) between the last tick and the next one. */
  readonly alpha: number;
}

/**
 * Advances the fixed-step accumulator by `elapsedMs` of wall-clock time.
 *
 * Time beyond what `maxTicksPerFrame` ticks can consume is discarded, not
 * carried over to the next frame (§2.1: "el exceso del acumulador se
 * descarta"). A device that falls behind therefore does a bounded amount of
 * work every frame — a visible skip — instead of an ever-growing backlog
 * that would make every subsequent frame slower too.
 *
 * The tick count comes from one division, not a `while (acc >= tickMs)`
 * loop that repeatedly subtracts `tickMs`: `TICK_MS` (1000/60) is not exact
 * in binary floating point, so repeated subtraction accumulates rounding
 * error and can under-count by a whole tick right at the cap boundary.
 */
export function advanceAccumulator(
  accumulatorMs: number,
  elapsedMs: number,
  tickMs: number = TICK_MS,
  maxTicksPerFrame: number = MAX_TICKS_PER_FRAME,
): AccumulatorAdvance {
  const total = accumulatorMs + elapsedMs;
  const wantedTicks = Math.floor(total / tickMs);
  const ticks = Math.min(wantedTicks, maxTicksPerFrame);
  const remainder = ticks < wantedTicks ? 0 : total - ticks * tickMs;
  return { ticks, accumulatorMs: remainder, alpha: remainder / tickMs };
}

export interface GameLoopConfig<S> {
  readonly game: GameModule<S>;
  /** Provided by the core, never invented by the game (game-module.ts). */
  readonly seed: number;
  readonly surface: DrawSurface;
  /** Called once per tick, at the start of that tick (spec §4.1). */
  readonly sampleInput: () => InputState;
  /** Sounds this tick produced. Playing them is the audio module's job, not the loop's. */
  readonly onSounds?: (sounds: readonly SoundEvent[]) => void;
  readonly maxTicksPerFrame?: number;
}

/**
 * Drives one `GameModule` at the fixed simulation rate.
 *
 * `onFrame` is the entire per-frame algorithm and is plain arithmetic plus
 * calls into the game module — no clock, no `requestAnimationFrame` — so
 * tests call it directly with fabricated elapsed times, without a browser.
 * `start`/`stop` are the thin real adapter that feeds it real frames; they
 * are not exercised by tests.
 */
export class GameLoop<S> {
  private state: S;
  private accumulatorMs = 0;
  private running = true;
  private readonly maxTicksPerFrame: number;
  private frameHandle: number | null = null;
  private lastFrameMs: number | null = null;
  private clock: FrameClock = realFrameClock;

  constructor(private readonly config: GameLoopConfig<S>) {
    this.state = config.game.createState(config.seed);
    this.maxTicksPerFrame = config.maxTicksPerFrame ?? MAX_TICKS_PER_FRAME;
  }

  getState(): S {
    return this.state;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Stops the loop from ticking. No tick is ever left half-done: a tick only
   * ever completes fully inside `onFrame`, so there is nothing to unwind.
   * The accumulator is discarded (§3 "al pausar ... el acumulador se
   * descarta") and the game state itself is left untouched — it needs no
   * freezing, because all of its time already lives inside it (Art. 3.3).
   */
  pause(): void {
    this.running = false;
    this.accumulatorMs = 0;
  }

  /**
   * Resumes ticking. The accumulator starts back at zero: time that passed
   * while paused never existed for the simulation (§2.2), it is not
   * recovered as a burst of catch-up ticks.
   */
  resume(): void {
    this.running = true;
    this.accumulatorMs = 0;
  }

  /**
   * Advances the simulation by `elapsedMs` of wall-clock time — one call per
   * displayed frame. A no-op while paused: neither the accumulator nor the
   * game state changes, and `sampleInput` is never called, so nothing that
   * happens to the touch input while hidden reaches the game (§3 rule 4).
   */
  onFrame(elapsedMs: number): void {
    if (!this.running) return;
    const advance = advanceAccumulator(this.accumulatorMs, elapsedMs, TICK_MS, this.maxTicksPerFrame);
    this.accumulatorMs = advance.accumulatorMs;
    for (let i = 0; i < advance.ticks; i++) {
      const input = this.config.sampleInput();
      const result = this.config.game.step(this.state, input);
      this.state = result.state;
      if (result.sounds.length > 0) this.config.onSounds?.(result.sounds);
    }
    this.config.game.draw(this.state, this.config.surface, advance.alpha);
  }

  snapshot(): string {
    return this.config.game.snapshot(this.state);
  }

  restore(snapshot: string): void {
    this.state = this.config.game.restore(snapshot);
  }

  /** Real adapter: schedules `onFrame` from `requestAnimationFrame`. Untested — see the module comment. */
  start(clock: FrameClock = realFrameClock): void {
    if (this.frameHandle !== null) return;
    this.clock = clock;
    const onRaf = (nowMs: number): void => {
      const elapsedMs = this.lastFrameMs === null ? 0 : nowMs - this.lastFrameMs;
      this.lastFrameMs = nowMs;
      this.onFrame(elapsedMs);
      this.frameHandle = clock.requestFrame(onRaf);
    };
    this.frameHandle = clock.requestFrame(onRaf);
  }

  stop(): void {
    if (this.frameHandle !== null) this.clock.cancelFrame(this.frameHandle);
    this.frameHandle = null;
    this.lastFrameMs = null;
  }
}
