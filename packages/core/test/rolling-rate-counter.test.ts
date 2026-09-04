import { describe, expect, it } from 'vitest';
import { RollingRateCounter } from '../src/diagnostics/rolling-rate-counter.js';

describe('RollingRateCounter (spec §9 — measured, not assumed)', () => {
  it('reports 0 with no events recorded', () => {
    const counter = new RollingRateCounter(1000);
    expect(counter.ratePerSecond(0)).toBe(0);
  });

  it('counts events within the trailing window', () => {
    const counter = new RollingRateCounter(1000);
    for (let i = 0; i < 60; i++) counter.record(i * 16); // ~60 events spread across ~960ms
    expect(counter.ratePerSecond(960)).toBe(60);
  });

  it('prunes events that fall outside the window as time advances', () => {
    const counter = new RollingRateCounter(1000);
    counter.record(0, 30);
    expect(counter.ratePerSecond(500)).toBe(30);
    expect(counter.ratePerSecond(1500)).toBe(0); // the batch at t=0 is now 1500ms old
  });

  it('a shorter window reports a proportionally different rate for the same events', () => {
    const counter = new RollingRateCounter(500);
    counter.record(0, 30);
    expect(counter.ratePerSecond(0)).toBe(60); // 30 events / 0.5s
  });

  it('record(count) with count > 1 adds that many timestamps at once', () => {
    const counter = new RollingRateCounter(1000);
    counter.record(0, 5);
    expect(counter.ratePerSecond(0)).toBe(5);
  });
});
