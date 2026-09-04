import { describe, expect, it } from 'vitest';
import { clampToRadius, resolveStickAxis, STICK_DEAD_ZONE_RATIO } from '../src/controls/touch.js';

const RADIUS = 100;

describe('resolveStickAxis (core.md §4.3)', () => {
  it('centres a horizontal stick inside the dead zone', () => {
    const insideDeadZone = RADIUS * STICK_DEAD_ZONE_RATIO - 1;
    expect(resolveStickAxis('horizontal', { dx: insideDeadZone, dy: 0 }, RADIUS)).toEqual({ x: 0, y: 0 });
  });

  it('a horizontal stick never reports y', () => {
    expect(resolveStickAxis('horizontal', { dx: 50, dy: 90 }, RADIUS)).toEqual({ x: 1, y: 0 });
    expect(resolveStickAxis('horizontal', { dx: -50, dy: -90 }, RADIUS)).toEqual({ x: -1, y: 0 });
  });

  it('a four-way stick never reports a diagonal', () => {
    const result = resolveStickAxis('four-way', { dx: 40, dy: 80 }, RADIUS);
    expect(result.x === 0 || result.y === 0).toBe(true);
  });

  it('four-way favours the axis with the larger displacement', () => {
    expect(resolveStickAxis('four-way', { dx: 80, dy: 20 }, RADIUS)).toEqual({ x: 1, y: 0 });
    expect(resolveStickAxis('four-way', { dx: 20, dy: -80 }, RADIUS)).toEqual({ x: 0, y: -1 });
  });

  it('centres a four-way stick when both axes are inside the dead zone', () => {
    const insideDeadZone = RADIUS * STICK_DEAD_ZONE_RATIO - 1;
    expect(resolveStickAxis('four-way', { dx: insideDeadZone, dy: insideDeadZone }, RADIUS)).toEqual({ x: 0, y: 0 });
  });
});

describe('clampToRadius', () => {
  it('leaves a vector inside the radius untouched', () => {
    expect(clampToRadius({ dx: 10, dy: 10 }, RADIUS)).toEqual({ dx: 10, dy: 10 });
  });

  it('scales a vector beyond the radius down to it', () => {
    const clamped = clampToRadius({ dx: 300, dy: 0 }, RADIUS);
    expect(clamped.dx).toBeCloseTo(RADIUS);
    expect(clamped.dy).toBeCloseTo(0);
  });

  it('preserves direction when clamping a diagonal', () => {
    const clamped = clampToRadius({ dx: 300, dy: 300 }, RADIUS);
    expect(Math.hypot(clamped.dx, clamped.dy)).toBeCloseTo(RADIUS);
    expect(clamped.dx).toBeCloseTo(clamped.dy);
  });
});
