/**
 * The control panel a game declares, and the shell renders.
 *
 * Product-spec §6: the panel is declared per game — Pac-Man had no buttons at
 * all, Tetris needs rotation, Space Invaders needs one fire button. The shell
 * never draws a control a game did not declare: no dead buttons.
 */
export type StickKind =
  /** Left and right only. */
  | 'horizontal'
  /** Up, down, left, right — no diagonals. */
  | 'four-way';

export type ButtonColor = 'red' | 'blue' | 'yellow' | 'green';

export interface PanelButton {
  /** Key used to read this button from InputState.buttons. */
  readonly id: string;
  /** Short label shown on the button face. Empty string for a blank cap. */
  readonly label: string;
  readonly color: ButtonColor;
}

export interface ControlPanel {
  /** Stick on the left side of the panel, or null for a game that needs none. */
  readonly stick: StickKind | null;
  /** Buttons on the right side, in left-to-right order. */
  readonly buttons: readonly PanelButton[];
}
