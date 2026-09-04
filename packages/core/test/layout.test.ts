import { describe, expect, it } from 'vitest';
import type { Resolution } from '@arcade/contracts';
import { computeCanvasLayout } from '../src/renderer/layout.js';

/** A resolution loosely test-pattern-shaped, kept generic — not any real game's. */
const SQUARE_LOGICAL: Resolution = { width: 200, height: 150 };
/** A taller, non-square logical resolution, to exercise both axes independently. */
const TALL_LOGICAL: Resolution = { width: 240, height: 320 };

describe('computeCanvasLayout (spec §5.1–§5.4)', () => {
  it('picks the largest integer scale that fits both axes, in physical pixels', () => {
    // 1000x800 CSS px at 1x device pixel ratio: 200x150 fits 5x exactly on
    // width (1000/200) and 5.33x on height (800/150) — the smaller wins.
    const layout = computeCanvasLayout(SQUARE_LOGICAL, { width: 1000, height: 800 }, 1);
    expect(layout.scale).toBe(5);
    expect(Number.isInteger(layout.scale)).toBe(true);
  });

  it('computes the scale against PHYSICAL pixels, not CSS pixels (devicePixelRatio respected)', () => {
    // Same CSS area as above, but a 3x device pixel ratio phone: physical
    // area is 3000x2400, so scale should be 3x as generous (15, not 5).
    const layout = computeCanvasLayout(SQUARE_LOGICAL, { width: 1000, height: 800 }, 3);
    expect(layout.scale).toBe(15);
  });

  it('never produces a fractional or zero scale, even on a screen smaller than the logical resolution', () => {
    // 100x100 CSS px at 1x: smaller than the 200x150 logical resolution on
    // both axes. Deforming the image is forbidden (§5.1), so scale clamps to
    // the whole-number minimum of 1 rather than going to 0 or interpolating.
    const layout = computeCanvasLayout(SQUARE_LOGICAL, { width: 100, height: 100 }, 1);
    expect(layout.scale).toBe(1);
    expect(Number.isInteger(layout.scale)).toBe(true);
  });

  it('the canvas backing store is an exact integer multiple of the logical resolution', () => {
    const layout = computeCanvasLayout(TALL_LOGICAL, { width: 500, height: 900 }, 2.625);
    expect(layout.canvasWidthPx % TALL_LOGICAL.width).toBe(0);
    expect(layout.canvasHeightPx % TALL_LOGICAL.height).toBe(0);
    expect(layout.canvasWidthPx / TALL_LOGICAL.width).toBe(layout.scale);
    expect(layout.canvasHeightPx / TALL_LOGICAL.height).toBe(layout.scale);
  });

  it('the CSS size equals the physical backing store divided by the device pixel ratio', () => {
    const dpr = 2.75;
    const layout = computeCanvasLayout(SQUARE_LOGICAL, { width: 900, height: 700 }, dpr);
    expect(layout.cssWidthPx).toBeCloseTo(layout.canvasWidthPx / dpr, 10);
    expect(layout.cssHeightPx).toBeCloseTo(layout.canvasHeightPx / dpr, 10);
  });

  it('letterboxes symmetrically around the centred canvas, never deforming it', () => {
    const layout = computeCanvasLayout(SQUARE_LOGICAL, { width: 1000, height: 800 }, 1);
    // width 200*5=1000 fills exactly: no horizontal letterbox.
    expect(layout.letterboxXPx).toBe(0);
    // height 150*5=750, leaving 50 CSS px of vertical slack, 25 on each side.
    expect(layout.letterboxYPx).toBeCloseTo(25, 10);
    expect(layout.cssHeightPx + 2 * layout.letterboxYPx).toBeCloseTo(800, 10);
  });

  it('produces no negative letterboxing when the canvas overflows the available area', () => {
    const layout = computeCanvasLayout(SQUARE_LOGICAL, { width: 100, height: 100 }, 1);
    expect(layout.letterboxXPx).toBeGreaterThanOrEqual(0);
    expect(layout.letterboxYPx).toBeGreaterThanOrEqual(0);
  });

  it.each([
    { name: 'phone 1x', css: { width: 390, height: 844 }, dpr: 3 },
    { name: 'phone 2.625x-ish', css: { width: 393, height: 851 }, dpr: 2.75 },
    { name: 'tablet', css: { width: 834, height: 1194 }, dpr: 2 },
    { name: 'desktop 1x', css: { width: 1920, height: 1080 }, dpr: 1 },
  ])('always yields an integer scale >= 1 on realistic screens ($name)', ({ css, dpr }) => {
    const layout = computeCanvasLayout(SQUARE_LOGICAL, css, dpr);
    expect(Number.isInteger(layout.scale)).toBe(true);
    expect(layout.scale).toBeGreaterThanOrEqual(1);
  });
});
