/**
 * Seeded, deterministic pseudo-random generator.
 *
 * Constitution Art. 3.2: `Math.random()` is forbidden in game logic. Every
 * source of chance goes through this generator, whose whole state is a single
 * integer, so it serialises with the rest of the game state and replays
 * identically.
 *
 * Algorithm: mulberry32. Chosen for being 32-bit, allocation-free and trivially
 * reproducible across engines.
 */
export interface Rng {
  readonly seed: number;
}

/** A value drawn from the generator, together with the generator that follows it. */
export interface RngDraw<T> {
  readonly rng: Rng;
  readonly value: T;
}

export function createRng(seed: number): Rng {
  return { seed: seed >>> 0 };
}

function next(rng: Rng): RngDraw<number> {
  const t = (rng.seed + 0x6d2b79f5) >>> 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return { rng: { seed: t }, value };
}

/** Uniform float in [0, 1). */
export function nextFloat(rng: Rng): RngDraw<number> {
  return next(rng);
}

/** Uniform integer in [0, maxExclusive). */
export function nextInt(rng: Rng, maxExclusive: number): RngDraw<number> {
  const draw = next(rng);
  return { rng: draw.rng, value: Math.floor(draw.value * maxExclusive) };
}

/** Uniform element of a non-empty list. */
export function pick<T>(rng: Rng, items: readonly T[]): RngDraw<T> {
  const draw = nextInt(rng, items.length);
  const value = items[draw.value];
  if (value === undefined) throw new Error('pick() called with an empty list');
  return { rng: draw.rng, value };
}
