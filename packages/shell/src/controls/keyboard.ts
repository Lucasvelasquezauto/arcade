/**
 * Keyboard mode (product-spec.md §2.1): pure key -> control mapping, kept
 * separate from `Stick.ts`/`Button.ts` so it is testable without touching the
 * DOM, same reasoning as `touch.ts`.
 *
 * VERIFICADO — the mapping table itself (WASD + arrow aliases for the stick,
 * `L` for the single action button) is not a number to research, it is
 * product-spec.md §2.1's own table, quoted verbatim.
 */
import type { Axis } from '@arcade/contracts';

export type StickKeyDirection = 'up' | 'down' | 'left' | 'right';

const STICK_KEY_DIRECTIONS: Record<string, StickKeyDirection> = {
  w: 'up',
  arrowup: 'up',
  s: 'down',
  arrowdown: 'down',
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
};

/** `event.key`, lower-cased, mapped to the stick direction it drives — or
 *  `null` for any key this control doesn't own (product-spec.md §2.1 table). */
export function stickDirectionForKey(key: string): StickKeyDirection | null {
  return STICK_KEY_DIRECTIONS[key.toLowerCase()] ?? null;
}

const ACTION_BUTTON_KEY = 'l';

/** `L`, the single action button (product-spec.md §2.1: "ningún juego declara
 *  un segundo botón sin una decisión explícita del propietario" — so every
 *  `Button` instance today IS the one action button; see SUPUESTO in
 *  `Button.ts`). */
export function isActionButtonKey(key: string): boolean {
  return key.toLowerCase() === ACTION_BUTTON_KEY;
}

/**
 * A held-key set -> the digital axis it represents. Opposing keys held at
 * once (e.g. `A` and `D` together) cancel to centred, the same way a real
 * joystick physically cannot point both ways at once. SUPUESTO — no spec
 * covers this exact edge case; cancelling rather than picking
 * first-pressed/last-pressed is the simplest rule that never lies about
 * which single direction is "held."
 */
export function resolveHeldDirections(held: ReadonlySet<StickKeyDirection>): { readonly x: Axis; readonly y: Axis } {
  const left = held.has('left');
  const right = held.has('right');
  const up = held.has('up');
  const down = held.has('down');
  const x: Axis = right && !left ? 1 : left && !right ? -1 : 0;
  const y: Axis = down && !up ? 1 : up && !down ? -1 : 0;
  return { x, y };
}
