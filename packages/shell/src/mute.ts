/**
 * The silence toggle (product-spec.md §7.4, shell.md §7): one global state,
 * conmutable in vivo from the cabinet, persisted locally on the device.
 *
 * SUPUESTO — the shell owns this persistence rather than the core, because
 * it is a UI preference, not game state, and keeping it here lets the shell
 * be exercised (and tested) with a fake `CoreHandle` and no real audio
 * pipeline. The store is injected so the logic is testable without a DOM.
 */
import { signal, type Signal } from '@preact/signals';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** SUPUESTO — clave de almacenamiento local, sin research previa. */
const MUTE_STORAGE_KEY = 'arcade:muted';

export interface MuteState {
  readonly muted: Signal<boolean>;
  setMuted(value: boolean): void;
}

function readInitialMuted(store: KeyValueStore | null): boolean {
  if (!store) return false;
  try {
    return store.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function createMuteState(store: KeyValueStore | null): MuteState {
  const muted = signal(readInitialMuted(store));
  return {
    muted,
    setMuted(value: boolean): void {
      muted.value = value;
      if (!store) return;
      try {
        store.setItem(MUTE_STORAGE_KEY, value ? '1' : '0');
      } catch {
        // A quota error or private-mode storage failure must never block the
        // live toggle (product-spec.md Art. 6.4 spirit) — ignored on purpose.
      }
    },
  };
}

/** Real browser storage when available, null otherwise (SSR, private mode
 *  that throws on access). Never touched by unit tests, which inject their
 *  own `KeyValueStore`. */
export function browserKeyValueStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
