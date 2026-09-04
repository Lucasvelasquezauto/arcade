/**
 * Pure logic behind the arcade-style character selector (product-spec.md §8,
 * shell.md §4): no system keyboard, five slots, each cycled independently.
 * Kept separate from `NameEntryScreen.ts` so it is testable without the DOM.
 */

/** product-spec.md §4 — "Alfabeto: A–Z, 0–9 y espacio." Space first so the
 *  character selector starts on a harmless value. */
export const NAME_ENTRY_ALPHABET: readonly string[] = [
  ' ',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  ...Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i)),
];

/** product-spec.md §8 — "Nombre (máx. 5 caracteres)." */
export const NAME_LENGTH = 5;

export type NameChars = readonly string[];

export function initialName(): NameChars {
  return Array.from({ length: NAME_LENGTH }, () => ' ');
}

export function cycleChar(current: string, direction: 1 | -1): string {
  const index = NAME_ENTRY_ALPHABET.indexOf(current);
  const base = index === -1 ? 0 : index;
  const length = NAME_ENTRY_ALPHABET.length;
  const next = (((base + direction) % length) + length) % length;
  const char = NAME_ENTRY_ALPHABET[next];
  return char ?? ' ';
}

export function setCharAt(name: NameChars, position: number, char: string): NameChars {
  return name.map((c, i) => (i === position ? char : c));
}

export function moveCursor(position: number, direction: 1 | -1): number {
  return Math.min(NAME_LENGTH - 1, Math.max(0, position + direction));
}

/**
 * Trailing spaces are trimmed on submit; a name of all spaces submits as
 * null (nothing to confirm). SUPUESTO — walking-skeleton.md §5 requires
 * 1–5 characters server-side; the spec does not say what an all-blank entry
 * should do, so the confirm action stays disabled instead of guessing a
 * fallback name.
 */
export function toSubmittableName(name: NameChars): string | null {
  const trimmed = name.join('').replace(/ +$/, '');
  return trimmed.length > 0 ? trimmed : null;
}
