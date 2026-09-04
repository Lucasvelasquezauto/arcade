import { TICK_MS } from '@arcade/contracts';
import { describe, expect, it } from 'vitest';
import { MAX_TICKS_PER_FRAME } from '../src/loop.js';
import { LoopStatsRecorder } from '../src/diagnostics/loop-stats.js';

describe('LoopStatsRecorder (spec §9 — ticks/s and ticks dropped by the cap)', () => {
  it('reports 0 ticks/s and 0 dropped with nothing recorded', () => {
    const stats = new LoopStatsRecorder();
    expect(stats.ticksPerSecond(0)).toBe(0);
    expect(stats.droppedTicksTotal()).toBe(0);
  });

  it('one frame worth of exactly one tick is not a drop', () => {
    const stats = new LoopStatsRecorder();
    stats.recordFrame(TICK_MS, TICK_MS);
    expect(stats.droppedTicksTotal()).toBe(0);
    expect(stats.ticksPerSecond(TICK_MS)).toBeGreaterThan(0);
  });

  it('an artificially long frame beyond the cap counts the discarded ticks (mirrors loop.md §2.1)', () => {
    const stats = new LoopStatsRecorder();
    const hugeElapsedMs = TICK_MS * (MAX_TICKS_PER_FRAME + 7); // would want 5+7=12 ticks, only 5 allowed
    stats.recordFrame(hugeElapsedMs, hugeElapsedMs);
    expect(stats.droppedTicksTotal()).toBe(7);
  });

  it('accumulates dropped ticks across multiple over-cap frames', () => {
    const stats = new LoopStatsRecorder();
    const hugeElapsedMs = TICK_MS * (MAX_TICKS_PER_FRAME + 2);
    stats.recordFrame(hugeElapsedMs, hugeElapsedMs);
    stats.recordFrame(hugeElapsedMs + TICK_MS * 20, hugeElapsedMs); // accumulator was reset to 0 by the cap, so this is another fresh over-cap frame
    expect(stats.droppedTicksTotal()).toBe(4);
  });

  it('pause() and resume() discard the accumulator, mirroring GameLoop (spec §2.2/§3)', () => {
    const stats = new LoopStatsRecorder();
    stats.recordFrame(0, TICK_MS * 0.9); // almost a full tick, sitting in the accumulator
    stats.pause();
    stats.resume();
    // Without the reset, 0.9 + 0.9 = 1.8 tick worth of time would produce a tick here.
    stats.recordFrame(TICK_MS, TICK_MS * 0.9);
    expect(stats.ticksPerSecond(TICK_MS)).toBe(0);
    expect(stats.droppedTicksTotal()).toBe(0);
  });
});
