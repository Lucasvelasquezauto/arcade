/**
 * Touch → `InputState` (spec §4).
 *
 * SUPUESTO — division of labour with the shell: nothing in `docs/specs/core.md`
 * says which layer owns raw DOM touch listening and hit-testing against the
 * drawn control panel. Since the panel's pixels belong to the shell (Art.
 * 3.7), this class assumes the shell listens to pointer events and calls the
 * methods below with already-classified signals (a button id, or the
 * stick's displacement already normalised to its own on-screen radius).
 * `TouchInput` itself only resolves edges and axes, so it needs no DOM types
 * and is testable without a browser.
 */
import type { InputState, StickKind } from '@arcade/contracts';
import { NEUTRAL_INPUT } from '@arcade/contracts';
import { ButtonEdgeTracker } from './edge.js';
import { resolveStick } from './stick.js';

export interface TouchInputConfig {
  /** Must match the game's declared `ControlPanel.stick` (null if it has none). */
  readonly stick: StickKind | null;
  readonly deadZone: number;
}

/**
 * Live input state for one game session. Buttons and the stick are tracked
 * independently by construction, so a finger on each works at once without
 * either cancelling the other (§4.5).
 */
export class TouchInput {
  private readonly buttons = new ButtonEdgeTracker();
  private stickDx = 0;
  private stickDy = 0;

  constructor(private readonly config: TouchInputConfig) {}

  press(buttonId: string): void {
    this.buttons.press(buttonId);
  }

  release(buttonId: string): void {
    this.buttons.release(buttonId);
  }

  /**
   * Live stick displacement from centre, each component roughly in [-1, 1].
   * Not edge-latched — only the latest position at sample time matters
   * (§4.1: the stick is sampled instantaneously, unlike a button's `pressed`).
   */
  moveStick(dx: number, dy: number): void {
    this.stickDx = dx;
    this.stickDy = dy;
  }

  /** The stick's finger lifted: it recentres immediately. */
  releaseStick(): void {
    this.stickDx = 0;
    this.stickDy = 0;
  }

  /** Snapshot for the current tick (spec §4.1: one instantaneous sample per tick). */
  sample(): InputState {
    const buttons = this.buttons.sample();
    if (this.config.stick === null) return { ...NEUTRAL_INPUT, buttons };
    const { x, y } = resolveStick(this.config.stick, this.stickDx, this.stickDy, this.config.deadZone);
    return { x, y, buttons };
  }

  /** Pause discipline (spec §3 rule 4): forget every touch and latched edge. */
  reset(): void {
    this.buttons.reset();
    this.stickDx = 0;
    this.stickDy = 0;
  }
}
