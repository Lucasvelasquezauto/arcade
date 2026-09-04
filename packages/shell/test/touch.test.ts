import { describe, expect, it } from 'vitest';
import { clampToRadius, normalizeStickDrag } from '../src/controls/touch.js';

const RADIUS = 100;

describe('normalizeStickDrag (core.md §4.0 — shell hands over the CONTINUOUS displacement)', () => {
  it('normalises a drag inside the radius to a fraction of it, per axis', () => {
    expect(normalizeStickDrag({ dx: 50, dy: -25 }, RADIUS)).toEqual({ x: 0.5, y: -0.25 });
  });

  it('a drag at the exact radius normalises to magnitude 1', () => {
    expect(normalizeStickDrag({ dx: RADIUS, dy: 0 }, RADIUS)).toEqual({ x: 1, y: 0 });
  });

  it('clamps a drag beyond the radius to magnitude 1, preserving direction', () => {
    const result = normalizeStickDrag({ dx: 300, dy: 0 }, RADIUS);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
  });

  it('clamps a diagonal beyond the radius without distorting its direction', () => {
    const result = normalizeStickDrag({ dx: 300, dy: 300 }, RADIUS);
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(1);
    expect(result.x).toBeCloseTo(result.y);
  });

  it('a centred drag normalises to centred', () => {
    expect(normalizeStickDrag({ dx: 0, dy: 0 }, RADIUS)).toEqual({ x: 0, y: 0 });
  });

  it('never divides by a non-positive radius', () => {
    expect(normalizeStickDrag({ dx: 40, dy: 10 }, 0)).toEqual({ x: 0, y: 0 });
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
