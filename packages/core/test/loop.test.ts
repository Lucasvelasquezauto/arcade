import { describe, expect, it } from 'vitest';
import type { InputState } from '@arcade/contracts';
import { TICK_MS } from '@arcade/contracts';
import { GameLoop, MAX_TICKS_PER_FRAME, advanceAccumulator } from '../src/loop.js';
import { fakeGame, fakeSurface } from './fixtures.js';

function neutralInput(): InputState {
  return { x: 0, y: 0, buttons: {} };
}

/** One scripted input source per loop instance: same pattern, independent cursor. */
function scriptedInput(pattern: readonly boolean[]): () => InputState {
  let i = 0;
  return () => {
    const fire = pattern[i % pattern.length] ?? false;
    i++;
    return { x: 0, y: 0, buttons: { fire: { down: fire, pressed: fire } } };
  };
}

/** Feeds exactly one tick's worth of elapsed time per call, `n` times. */
function runTicks<S>(loop: GameLoop<S>, n: number): void {
  for (let i = 0; i < n; i++) loop.onFrame(TICK_MS);
}

describe('advanceAccumulator (spec §2.1 — loop cap)', () => {
  it('never produces more than MAX_TICKS_PER_FRAME ticks, however long the frame', () => {
    const result = advanceAccumulator(0, 10_000);
    expect(result.ticks).toBe(MAX_TICKS_PER_FRAME);
  });

  it('discards the excess instead of carrying it into the next frame', () => {
    const first = advanceAccumulator(0, 10_000);
    const second = advanceAccumulator(first.accumulatorMs, 0);
    expect(second.ticks).toBe(0);
    expect(first.accumulatorMs).toBeLessThan(TICK_MS);
  });

  it('alpha always stays in [0, 1)', () => {
    const result = advanceAccumulator(0, 10_000);
    expect(result.alpha).toBeGreaterThanOrEqual(0);
    expect(result.alpha).toBeLessThan(1);
  });

  it('exactly one tick worth of elapsed time produces exactly one tick and an empty accumulator', () => {
    const result = advanceAccumulator(0, TICK_MS);
    expect(result.ticks).toBe(1);
    expect(result.accumulatorMs).toBe(0);
  });
});

describe('GameLoop.onFrame (spec §2 — fixed-step loop)', () => {
  it('never steps the game more than MAX_TICKS_PER_FRAME times for one long frame', () => {
    let calls = 0;
    const loop = new GameLoop({
      game: fakeGame,
      seed: 1,
      surface: fakeSurface,
      sampleInput: () => {
        calls++;
        return neutralInput();
      },
    });
    loop.onFrame(10_000);
    expect(calls).toBe(MAX_TICKS_PER_FRAME);
  });

  it('is deterministic: the same input sequence produces the same final state', () => {
    const pattern = [false, true, false, false, true, true, false];
    const a = new GameLoop({ game: fakeGame, seed: 7, surface: fakeSurface, sampleInput: scriptedInput(pattern) });
    const b = new GameLoop({ game: fakeGame, seed: 7, surface: fakeSurface, sampleInput: scriptedInput(pattern) });
    runTicks(a, 23);
    runTicks(b, 23);
    expect(a.snapshot()).toBe(b.snapshot());
  });

  it(
    'pausing across a huge wall-clock gap — with an internal ticks-only timer "running" throughout — ' +
      'produces exactly the same state as never pausing at all (spec §3, §10.3)',
    () => {
      const pattern = [true, false, false, true, false, true, true, false, false, true, true, true];
      const preTicks = 6;
      const postTicks = 12;

      const baseline = new GameLoop({
        game: fakeGame,
        seed: 99,
        surface: fakeSurface,
        sampleInput: scriptedInput(pattern),
      });
      runTicks(baseline, preTicks);
      const afterPre = baseline.snapshot();
      runTicks(baseline, postTicks);
      const baselineFinal = baseline.snapshot();

      const paused = new GameLoop({
        game: fakeGame,
        seed: 99,
        surface: fakeSurface,
        sampleInput: scriptedInput(pattern),
      });
      runTicks(paused, preTicks);
      expect(paused.snapshot()).toBe(afterPre);

      paused.pause();
      // Wall-clock time keeps passing while paused — feed it in, repeatedly,
      // as if hours went by. None of it may turn into a tick.
      paused.onFrame(10_000);
      paused.onFrame(999_999);
      expect(paused.snapshot()).toBe(afterPre);

      paused.resume();
      runTicks(paused, postTicks);

      expect(paused.snapshot()).toBe(baselineFinal);
    },
  );

  it('pause() stops ticking immediately: onFrame is a no-op while paused', () => {
    let calls = 0;
    const loop = new GameLoop({
      game: fakeGame,
      seed: 1,
      surface: fakeSurface,
      sampleInput: () => {
        calls++;
        return neutralInput();
      },
    });
    loop.pause();
    loop.onFrame(TICK_MS * 3);
    expect(calls).toBe(0);
    expect(loop.isRunning()).toBe(false);
  });
});
