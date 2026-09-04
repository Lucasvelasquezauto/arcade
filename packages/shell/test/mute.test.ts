import { describe, expect, it } from 'vitest';
import { createMuteState, type KeyValueStore } from '../src/mute.js';

function fakeStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('mute state (product-spec.md §7.4)', () => {
  it('defaults to unmuted with no store', () => {
    expect(createMuteState(null).muted.value).toBe(false);
  });

  it('reads a persisted preference on creation', () => {
    const store = fakeStore({ 'arcade:muted': '1' });
    expect(createMuteState(store).muted.value).toBe(true);
  });

  it('toggling updates the signal and persists it', () => {
    const store = fakeStore();
    const state = createMuteState(store);
    state.setMuted(true);
    expect(state.muted.value).toBe(true);
    expect(store.getItem('arcade:muted')).toBe('1');
    state.setMuted(false);
    expect(store.getItem('arcade:muted')).toBe('0');
  });

  it('a store that throws never blocks the live toggle', () => {
    const throwingStore: KeyValueStore = {
      getItem: () => {
        throw new Error('quota');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const state = createMuteState(throwingStore);
    expect(state.muted.value).toBe(false);
    expect(() => state.setMuted(true)).not.toThrow();
    expect(state.muted.value).toBe(true);
  });
});
