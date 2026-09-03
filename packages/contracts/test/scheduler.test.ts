import { describe, expect, it } from 'vitest';
import { advanceTimers, cancel, createTimers, isPending, remaining, schedule } from '../src/scheduler.js';

describe('tick timers (Art. 3.3)', () => {
  it('fires after exactly the scheduled number of ticks', () => {
    let timers = schedule(createTimers(), 'ufo', 3);
    const fired: string[][] = [];
    for (let i = 0; i < 4; i++) {
      const step = advanceTimers(timers);
      timers = step.timers;
      fired.push([...step.fired]);
    }
    expect(fired).toEqual([[], [], ['ufo'], []]);
  });

  it('re-scheduling a tag restarts it instead of duplicating it', () => {
    let timers = schedule(createTimers(), 'frightened', 10);
    timers = advanceTimers(timers).timers;
    expect(remaining(timers, 'frightened')).toBe(9);
    timers = schedule(timers, 'frightened', 10);
    expect(timers.pending).toHaveLength(1);
    expect(remaining(timers, 'frightened')).toBe(10);
  });

  it('cancels and reports pending state', () => {
    let timers = schedule(createTimers(), 'lock-delay', 30);
    expect(isPending(timers, 'lock-delay')).toBe(true);
    timers = cancel(timers, 'lock-delay');
    expect(isPending(timers, 'lock-delay')).toBe(false);
    expect(remaining(timers, 'lock-delay')).toBeNull();
  });

  it('rejects non-integer or non-positive durations', () => {
    expect(() => schedule(createTimers(), 'bad', 0)).toThrow();
    expect(() => schedule(createTimers(), 'bad', 1.5)).toThrow();
  });

  it('survives a JSON round trip with its remaining time intact', () => {
    let timers = schedule(createTimers(), 'march', 45);
    timers = advanceTimers(timers).timers;
    const restored = JSON.parse(JSON.stringify(timers)) as typeof timers;
    expect(remaining(restored, 'march')).toBe(44);
  });
});
