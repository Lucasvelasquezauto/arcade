import { describe, expect, it } from 'vitest';
import {
  cycleChar,
  initialName,
  moveCursor,
  NAME_ENTRY_ALPHABET,
  NAME_LENGTH,
  setCharAt,
  toSubmittableName,
} from '../src/screens/nameEntry.js';

describe('name entry (product-spec.md §8)', () => {
  it('starts as five blank slots', () => {
    const name = initialName();
    expect(name).toHaveLength(NAME_LENGTH);
    expect(name.every((c) => c === ' ')).toBe(true);
  });

  it('cycles through the whole alphabet and wraps around in both directions', () => {
    expect(cycleChar(' ', 1)).toBe('A');
    expect(cycleChar(' ', -1)).toBe(NAME_ENTRY_ALPHABET[NAME_ENTRY_ALPHABET.length - 1]);
    expect(cycleChar(NAME_ENTRY_ALPHABET[NAME_ENTRY_ALPHABET.length - 1] as string, 1)).toBe(' ');
  });

  it('the alphabet is exactly space, A-Z, 0-9', () => {
    expect(NAME_ENTRY_ALPHABET).toHaveLength(1 + 26 + 10);
    expect(NAME_ENTRY_ALPHABET[0]).toBe(' ');
    expect(NAME_ENTRY_ALPHABET).toContain('A');
    expect(NAME_ENTRY_ALPHABET).toContain('Z');
    expect(NAME_ENTRY_ALPHABET).toContain('0');
    expect(NAME_ENTRY_ALPHABET).toContain('9');
  });

  it('moveCursor clamps at both ends instead of wrapping', () => {
    expect(moveCursor(0, -1)).toBe(0);
    expect(moveCursor(NAME_LENGTH - 1, 1)).toBe(NAME_LENGTH - 1);
    expect(moveCursor(2, 1)).toBe(3);
  });

  it('setCharAt only changes the targeted slot', () => {
    const name = setCharAt(initialName(), 2, 'X');
    expect(name).toEqual([' ', ' ', 'X', ' ', ' ']);
  });

  it('trims trailing spaces on submit', () => {
    expect(toSubmittableName(['A', 'B', ' ', ' ', ' '])).toBe('AB');
  });

  it('an all-blank name is not submittable', () => {
    expect(toSubmittableName(initialName())).toBeNull();
  });
});
