/**
 * Sound as data, not as an action.
 *
 * Product-spec §7: audio is driven by ticks, not by the wall clock, so game
 * logic never plays a sound directly — it RETURNS the sounds this tick produced
 * and the core plays them. That is what lets audio stop with the simulation on
 * pause and resume at the same point in the state, and it keeps game logic pure.
 */
export type SoundId = string;

export type SoundEvent =
  /** Play once. */
  | { readonly kind: 'play'; readonly id: SoundId; readonly gain?: number }
  /**
   * Start or update a looping sound. Re-emitting with a different `rate`
   * changes speed without restarting — this is how the Space Invaders march
   * accelerates as the horde thins out.
   */
  | { readonly kind: 'loop'; readonly id: SoundId; readonly rate?: number; readonly gain?: number }
  | { readonly kind: 'stop'; readonly id: SoundId };

export const NO_SOUNDS: readonly SoundEvent[] = [];
