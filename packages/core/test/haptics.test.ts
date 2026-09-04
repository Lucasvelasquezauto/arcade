import { describe, expect, it, vi } from 'vitest';
import { createHapticFeedback } from '../src/haptics.js';

describe('createHapticFeedback (spec §7 — capability detected, never platform)', () => {
  it('reports unavailable and never calls anything when no vibrate function is given', () => {
    const haptics = createHapticFeedback(null);
    expect(haptics.isAvailable()).toBe(false);
    expect(() => haptics.trigger()).not.toThrow();
  });

  it('reports available and calls vibrate when a function is given, like iPhone-absent vs Android-present', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    const haptics = createHapticFeedback(vibrate);
    expect(haptics.isAvailable()).toBe(true);
    haptics.trigger();
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it('passes a custom duration through unchanged', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    createHapticFeedback(vibrate).trigger(50);
    expect(vibrate).toHaveBeenCalledWith(50);
  });

  it('uses a default duration when none is given', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    createHapticFeedback(vibrate).trigger();
    expect(vibrate).toHaveBeenCalledWith(expect.any(Number));
  });

  it('a vibrate call that throws is swallowed silently (§7.4: "si ... falla, se ignora en silencio")', () => {
    const vibrate = vi.fn(() => {
      throw new Error('device denied vibration permission');
    });
    const haptics = createHapticFeedback(vibrate);
    expect(() => haptics.trigger()).not.toThrow();
  });
});
