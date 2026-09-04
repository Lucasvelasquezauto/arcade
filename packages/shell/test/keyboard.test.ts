import { describe, expect, it } from 'vitest';
import { isActionButtonKey, resolveHeldDirections, stickDirectionForKey } from '../src/controls/keyboard.js';

describe('stickDirectionForKey (product-spec.md §2.1 — WASD + arrow aliases)', () => {
  it('maps WASD to the four directions', () => {
    expect(stickDirectionForKey('w')).toBe('up');
    expect(stickDirectionForKey('a')).toBe('left');
    expect(stickDirectionForKey('s')).toBe('down');
    expect(stickDirectionForKey('d')).toBe('right');
  });

  it('maps the arrow keys to the same four directions', () => {
    expect(stickDirectionForKey('ArrowUp')).toBe('up');
    expect(stickDirectionForKey('ArrowLeft')).toBe('left');
    expect(stickDirectionForKey('ArrowDown')).toBe('down');
    expect(stickDirectionForKey('ArrowRight')).toBe('right');
  });

  it('is case-insensitive', () => {
    expect(stickDirectionForKey('W')).toBe('up');
    expect(stickDirectionForKey('D')).toBe('right');
  });

  it('returns null for a key it does not own', () => {
    expect(stickDirectionForKey('l')).toBeNull();
    expect(stickDirectionForKey('Shift')).toBeNull();
  });
});

describe('isActionButtonKey (product-spec.md §2.1 — L is the single action button)', () => {
  it('recognises L, case-insensitively', () => {
    expect(isActionButtonKey('l')).toBe(true);
    expect(isActionButtonKey('L')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isActionButtonKey('k')).toBe(false);
    expect(isActionButtonKey(' ')).toBe(false);
  });
});

describe('resolveHeldDirections', () => {
  it('centres when nothing is held', () => {
    expect(resolveHeldDirections(new Set())).toEqual({ x: 0, y: 0 });
  });

  it('reports a single held direction', () => {
    expect(resolveHeldDirections(new Set(['left']))).toEqual({ x: -1, y: 0 });
    expect(resolveHeldDirections(new Set(['right']))).toEqual({ x: 1, y: 0 });
    expect(resolveHeldDirections(new Set(['up']))).toEqual({ x: 0, y: -1 });
    expect(resolveHeldDirections(new Set(['down']))).toEqual({ x: 0, y: 1 });
  });

  it('combines a horizontal and a vertical key held together', () => {
    expect(resolveHeldDirections(new Set(['up', 'right']))).toEqual({ x: 1, y: -1 });
  });

  it('cancels opposing keys held at once', () => {
    expect(resolveHeldDirections(new Set(['left', 'right']))).toEqual({ x: 0, y: 0 });
    expect(resolveHeldDirections(new Set(['up', 'down']))).toEqual({ x: 0, y: 0 });
  });
});
