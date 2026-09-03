import { describe, expect, it } from 'vitest';
import { createRng, nextFloat, nextInt, pick } from '../src/rng.js';

describe('seeded rng (Art. 3.2)', () => {
  it('produces the same sequence for the same seed', () => {
    const draw = (seed: number) => {
      let rng = createRng(seed);
      const out: number[] = [];
      for (let i = 0; i < 20; i++) {
        const step = nextInt(rng, 1000);
        rng = step.rng;
        out.push(step.value);
      }
      return out;
    };
    expect(draw(12345)).toEqual(draw(12345));
    expect(draw(12345)).not.toEqual(draw(12346));
  });

  it('stays inside the requested range', () => {
    let rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      const step = nextInt(rng, 7);
      rng = step.rng;
      expect(step.value).toBeGreaterThanOrEqual(0);
      expect(step.value).toBeLessThan(7);
    }
  });

  it('produces floats in [0, 1)', () => {
    let rng = createRng(99);
    for (let i = 0; i < 200; i++) {
      const step = nextFloat(rng);
      rng = step.rng;
      expect(step.value).toBeGreaterThanOrEqual(0);
      expect(step.value).toBeLessThan(1);
    }
  });

  it('picks from a list and refuses an empty one', () => {
    const { value } = pick(createRng(1), ['I', 'O', 'T'] as const);
    expect(['I', 'O', 'T']).toContain(value);
    expect(() => pick(createRng(1), [])).toThrow();
  });

  it('is a plain serialisable value', () => {
    const rng = nextInt(createRng(42), 10).rng;
    expect(JSON.parse(JSON.stringify(rng))).toEqual(rng);
  });
});
