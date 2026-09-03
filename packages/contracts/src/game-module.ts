/**
 * The single contract every game implements, and the only thing the core knows
 * about a game (Constitution Art. 3.8).
 *
 * The state type `S` is opaque to the core: each game organises its world as it
 * sees fit (Art. 3.6). Two requirements bind it:
 *
 *  1. It must be JSON-serialisable, so pause and replay tests can snapshot it.
 *  2. It must contain ALL of the game's time — every pending timer, animation
 *     and cadence — because nothing outside it survives a pause (Art. 3.3).
 */
import type { ControlPanel } from './control-panel.js';
import type { InputState } from './input.js';
import type { DrawSurface, Resolution } from './render.js';
import type { SoundEvent } from './audio.js';

export type GameStatus = 'playing' | 'over';

export interface TickResult<S> {
  readonly state: S;
  /** Sounds produced by this tick. Empty is the common case. */
  readonly sounds: readonly SoundEvent[];
}

export interface GameModule<S> {
  /** Stable identifier, also used as the records key. Lowercase, hyphenated. */
  readonly id: string;
  /** Title shown on the marquee. */
  readonly title: string;
  /** Accent colour of the cabinet for this game (product-spec §5). */
  readonly accentColor: string;
  /** Logical resolution of the game screen, from its canonical reference version. */
  readonly resolution: Resolution;
  /** Control panel the shell renders for this game (product-spec §6). */
  readonly panel: ControlPanel;

  /** Fresh game state. `seed` comes from the core; the game never invents one. */
  createState(seed: number): S;

  /**
   * Advance the simulation by EXACTLY one tick. Pure: same state and input
   * always produce the same result. No clocks, no randomness, no I/O.
   */
  step(state: S, input: InputState): TickResult<S>;

  /**
   * Draw the current state. Must not mutate it and must not decide anything:
   * two draws of the same state produce the same picture.
   *
   * `alpha` is the interpolation factor in [0, 1) between the last tick and the
   * next one, for smoothing motion on displays faster than 60 Hz. Ignoring it
   * is valid and correct — it changes appearance, never simulation.
   */
  draw(state: S, surface: DrawSurface, alpha: number): void;

  /** Current score, for the records table. */
  readScore(state: S): number;
  readStatus(state: S): GameStatus;

  /**
   * Snapshot and restore. Required, not optional: they are how the pause test
   * proves that "the state freezes completely" is true and not a hope.
   */
  snapshot(state: S): string;
  restore(snapshot: string): S;
}

/**
 * A game module with its state type erased, as the core and the catalog handle
 * it. Method shorthand makes `GameModule<S>` assignable to this, so the core can
 * hold any game without knowing its state type — and without `any`.
 */
export type AnyGameModule = GameModule<unknown>;
