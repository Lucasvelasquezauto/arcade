import { describe, expect, it } from 'vitest';
import { MuteStore, type MuteStorage } from '../src/audio/mute-store.js';

function fakeStorage(initial: Record<string, string> = {}): MuteStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function throwingStorage(): MuteStorage {
  return {
    getItem: () => {
      throw new Error('storage disabled');
    },
    setItem: () => {
      throw new Error('storage disabled');
    },
  };
}

describe('MuteStore (spec §6.5 — persisted, toggleable mid-game)', () => {
  it('defaults to unmuted with no storage', () => {
    expect(new MuteStore(null).isMuted()).toBe(false);
  });

  it('defaults to unmuted with empty storage', () => {
    expect(new MuteStore(fakeStorage()).isMuted()).toBe(false);
  });

  it('reads a previously persisted muted state on construction', () => {
    const store = new MuteStore(fakeStorage({ 'arcade:muted': '1' }));
    expect(store.isMuted()).toBe(true);
  });

  it('setMuted updates the in-memory flag immediately', () => {
    const store = new MuteStore(null);
    store.setMuted(true);
    expect(store.isMuted()).toBe(true);
    store.setMuted(false);
    expect(store.isMuted()).toBe(false);
  });

  it('setMuted persists the choice for a fresh store to pick up', () => {
    const storage = fakeStorage();
    new MuteStore(storage).setMuted(true);
    expect(new MuteStore(storage).isMuted()).toBe(true);
  });

  it('toggle flips and returns the new state', () => {
    const store = new MuteStore(null);
    expect(store.toggle()).toBe(true);
    expect(store.toggle()).toBe(false);
  });

  it('a storage that throws on read never breaks construction — falls back to unmuted', () => {
    expect(() => new MuteStore(throwingStorage())).not.toThrow();
    expect(new MuteStore(throwingStorage()).isMuted()).toBe(false);
  });

  it('a storage that throws on write never breaks setMuted — the in-memory flag still updates', () => {
    const store = new MuteStore(throwingStorage());
    expect(() => store.setMuted(true)).not.toThrow();
    expect(store.isMuted()).toBe(true);
  });
});
