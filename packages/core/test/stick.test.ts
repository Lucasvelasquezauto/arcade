import { describe, expect, it } from 'vitest';
import { resolveStick } from '../src/input/stick.js';

describe('resolveStick (spec §4.3–4.4 — digital stick)', () => {
  it('horizontal ignores y entirely', () => {
    expect(resolveStick('horizontal', 0.8, 0.9, 0.2)).toEqual({ x: 1, y: 0 });
    expect(resolveStick('horizontal', -0.8, -0.9, 0.2)).toEqual({ x: -1, y: 0 });
  });

  it('horizontal centres inside the dead zone', () => {
    expect(resolveStick('horizontal', 0.1, 0, 0.2)).toEqual({ x: 0, y: 0 });
  });

  it('four-way never reports a diagonal, favouring the axis with the larger displacement', () => {
    expect(resolveStick('four-way', 0.7, 0.3, 0.2)).toEqual({ x: 1, y: 0 });
    expect(resolveStick('four-way', 0.2, -0.6, 0.2)).toEqual({ x: 0, y: -1 });
  });

  it('four-way centres inside the dead zone', () => {
    expect(resolveStick('four-way', 0.05, -0.05, 0.2)).toEqual({ x: 0, y: 0 });
  });
});
