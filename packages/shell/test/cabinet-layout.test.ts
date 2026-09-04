import { describe, expect, it } from 'vitest';
import { computeCabinetSize } from '../src/cabinet/layout.js';

describe('computeCabinetSize (product-spec.md §2.1 regla 1 — contain fit)', () => {
  it('is height-bound in a wide window, filling the available height', () => {
    const result = computeCabinetSize({ width: 1200, height: 800 }, 0.5);
    expect(result.height).toBe(800);
    expect(result.width).toBe(400);
  });

  it('is width-bound in a narrow/tall window, never overflowing width', () => {
    const result = computeCabinetSize({ width: 300, height: 900 }, 0.5);
    expect(result.width).toBe(300);
    expect(result.height).toBe(600);
  });

  it('preserves the aspect ratio in both cases', () => {
    const aspectRatio = 9 / 19.5;
    for (const available of [
      { width: 1600, height: 900 },
      { width: 400, height: 1200 },
    ]) {
      const result = computeCabinetSize(available, aspectRatio);
      expect(result.width / result.height).toBeCloseTo(aspectRatio);
      expect(result.width).toBeLessThanOrEqual(available.width + 1e-9);
      expect(result.height).toBeLessThanOrEqual(available.height + 1e-9);
    }
  });

  it('degrades to zero rather than a negative/NaN size for a collapsed area', () => {
    expect(computeCabinetSize({ width: 0, height: 800 }, 0.5)).toEqual({ width: 0, height: 0 });
    expect(computeCabinetSize({ width: 400, height: 0 }, 0.5)).toEqual({ width: 0, height: 0 });
  });
});
