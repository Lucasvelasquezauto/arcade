/**
 * Normalised input handed to game logic.
 *
 * The core translates touch gestures on the cabinet panel into this shape, so
 * game logic never knows about fingers, pixels or pointer events. Every game
 * declares which of these it actually uses through its ControlPanel.
 */

/** Digital axis value: -1 (left/up), 0 (centred), 1 (right/down). */
export type Axis = -1 | 0 | 1;

export interface ButtonState {
  /** Held down at the start of this tick. */
  readonly down: boolean;
  /** Went from up to down during this tick. Use for one-shot actions. */
  readonly pressed: boolean;
}

export interface InputState {
  /** Horizontal stick direction. */
  readonly x: Axis;
  /** Vertical stick direction. Always 0 for horizontal-only panels. */
  readonly y: Axis;
  /** Buttons by the id declared in the game's ControlPanel. */
  readonly buttons: Readonly<Record<string, ButtonState>>;
}

export const NEUTRAL_INPUT: InputState = { x: 0, y: 0, buttons: {} };

/** Convenience reader; unknown ids read as released rather than throwing. */
export function button(input: InputState, id: string): ButtonState {
  return input.buttons[id] ?? { down: false, pressed: false };
}
