import { describe, expect, it } from 'vitest';
import type { SoundEvent } from '@arcade/contracts';
import { reconcileSounds, type LoopState } from '../src/audio/reconcile.js';

function loops(entries: readonly [string, LoopState][]): ReadonlyMap<string, LoopState> {
  return new Map(entries);
}

describe('reconcileSounds (spec §6.3–§6.4 — audio is data, not action)', () => {
  it('a "play" event is always a one-shot, regardless of active loops', () => {
    const plan = reconcileSounds(loops([]), [{ kind: 'play', id: 'shot' }]);
    expect(plan.toPlay).toEqual([{ id: 'shot', gain: 1 }]);
    expect(plan.toStartLoop).toEqual([]);
  });

  it('a "play" event carries its gain through, defaulting to 1', () => {
    const plan = reconcileSounds(loops([]), [{ kind: 'play', id: 'shot', gain: 0.5 }]);
    expect(plan.toPlay).toEqual([{ id: 'shot', gain: 0.5 }]);
  });

  it('a new "loop" id starts a loop', () => {
    const plan = reconcileSounds(loops([]), [{ kind: 'loop', id: 'march', rate: 1 }]);
    expect(plan.toStartLoop).toEqual([{ id: 'march', rate: 1, gain: 1 }]);
    expect(plan.toUpdateLoop).toEqual([]);
  });

  it('re-emitting "loop" with the SAME rate and gain is a no-op — the common case must not touch the node', () => {
    const plan = reconcileSounds(loops([['march', { rate: 1, gain: 1 }]]), [
      { kind: 'loop', id: 'march', rate: 1, gain: 1 },
    ]);
    expect(plan.toStartLoop).toEqual([]);
    expect(plan.toUpdateLoop).toEqual([]);
    expect(plan.toStopLoop).toEqual([]);
  });

  it('re-emitting "loop" with a DIFFERENT rate updates the existing loop instead of restarting it', () => {
    const plan = reconcileSounds(loops([['march', { rate: 1, gain: 1 }]]), [
      { kind: 'loop', id: 'march', rate: 1.4, gain: 1 },
    ]);
    expect(plan.toUpdateLoop).toEqual([{ id: 'march', rate: 1.4, gain: 1 }]);
    expect(plan.toStartLoop).toEqual([]);
  });

  it('a changed gain alone also produces an update, not a restart', () => {
    const plan = reconcileSounds(loops([['march', { rate: 1, gain: 1 }]]), [
      { kind: 'loop', id: 'march', rate: 1, gain: 0.3 },
    ]);
    expect(plan.toUpdateLoop).toEqual([{ id: 'march', rate: 1, gain: 0.3 }]);
  });

  it('"stop" on a currently-looping id schedules it to stop', () => {
    const plan = reconcileSounds(loops([['march', { rate: 1, gain: 1 }]]), [{ kind: 'stop', id: 'march' }]);
    expect(plan.toStopLoop).toEqual(['march']);
  });

  it('"stop" on an id that is not looping is a no-op, not an error', () => {
    const plan = reconcileSounds(loops([]), [{ kind: 'stop', id: 'nothing-playing' }]);
    expect(plan.toStopLoop).toEqual([]);
  });

  it('handles a mixed batch of events in one tick independently', () => {
    const events: readonly SoundEvent[] = [
      { kind: 'play', id: 'shot' },
      { kind: 'loop', id: 'march', rate: 2 },
      { kind: 'stop', id: 'siren' },
    ];
    const plan = reconcileSounds(loops([['siren', { rate: 1, gain: 1 }]]), events);
    expect(plan.toPlay).toEqual([{ id: 'shot', gain: 1 }]);
    expect(plan.toStartLoop).toEqual([{ id: 'march', rate: 2, gain: 1 }]);
    expect(plan.toStopLoop).toEqual(['siren']);
  });

  it('no events produces an entirely empty plan', () => {
    const plan = reconcileSounds(loops([['march', { rate: 1, gain: 1 }]]), []);
    expect(plan).toEqual({ toPlay: [], toStartLoop: [], toUpdateLoop: [], toStopLoop: [] });
  });
});
