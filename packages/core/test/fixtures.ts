/**
 * Minimal fake `GameModule` and `DrawSurface` for core's own tests.
 *
 * Per the task brief: this is NOT `packages/games/test-pattern` (another
 * agent owns that in parallel) and core must never import from
 * `packages/games/**` anyway (Art. 3.8). This fixture also exercises the
 * scheduler's ticks-only `Timers` (`@arcade/contracts`), which is what makes
 * the pause-equivalence test meaningful: an "internal timer" that only ever
 * advances on `step`, so pausing must freeze it exactly.
 */
import type { DrawSurface, GameModule, Timers } from '@arcade/contracts';
import { advanceTimers, button, createTimers, schedule } from '@arcade/contracts';

export interface FakeState {
  readonly ticks: number;
  readonly score: number;
  readonly timers: Timers;
  readonly firedCount: number;
}

export const FIRE_BUTTON = 'fire';
const BOOM_TAG = 'boom';
const BOOM_PERIOD_TICKS = 4;

export const fakeGame: GameModule<FakeState> = {
  id: 'fixture',
  title: 'Fixture',
  accentColor: '#ffffff',
  resolution: { width: 1, height: 1 },
  panel: { stick: 'horizontal', buttons: [{ id: FIRE_BUTTON, label: '', color: 'red' }] },

  createState(seed) {
    return {
      ticks: 0,
      score: seed,
      timers: schedule(createTimers(), BOOM_TAG, BOOM_PERIOD_TICKS),
      firedCount: 0,
    };
  },

  step(state, input) {
    const advance = advanceTimers(state.timers);
    const boomed = advance.fired.includes(BOOM_TAG);
    const timers = boomed ? schedule(advance.timers, BOOM_TAG, BOOM_PERIOD_TICKS) : advance.timers;
    const pressed = button(input, FIRE_BUTTON).pressed;
    return {
      state: {
        ticks: state.ticks + 1,
        score: state.score + (pressed ? 10 : 1),
        timers,
        firedCount: state.firedCount + (boomed ? 1 : 0),
      },
      sounds: [],
    };
  },

  draw() {
    // Rendering is out of this milestone's scope; nothing to do.
  },

  readScore(state) {
    return state.score;
  },

  readStatus() {
    return 'playing';
  },

  snapshot(state) {
    return JSON.stringify(state);
  },

  restore(snapshot) {
    return JSON.parse(snapshot) as FakeState;
  },
};

export const fakeSurface: DrawSurface = {
  width: 1,
  height: 1,
  clear() {},
  fillRect() {},
  drawSprite() {},
  drawText() {},
};
