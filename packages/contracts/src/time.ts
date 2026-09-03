/**
 * Fixed simulation rate for every game in the app.
 *
 * Constitution Art. 3.3 / product-spec §10: the simulation is normalised to
 * 60 Hz and decoupled from the display refresh rate. No original arcade board
 * ran at exactly 60 Hz; the resulting ~1% wall-clock drift is a registered
 * deviation. Because every duration in game logic is expressed in TICKS and
 * never in milliseconds, the simulation stays frame-identical to the original.
 */
export const TICK_HZ = 60;

/** Duration of one tick in milliseconds. For the core loop only, never for game logic. */
export const TICK_MS = 1000 / TICK_HZ;

/** Convert seconds to whole ticks. Rounds to nearest; durations are integers. */
export function ticksFromSeconds(seconds: number): number {
  return Math.round(seconds * TICK_HZ);
}

/** Convert original-hardware frames to ticks. Identity at 60 Hz, kept explicit for traceability. */
export function ticksFromFrames(frames: number): number {
  return frames;
}
