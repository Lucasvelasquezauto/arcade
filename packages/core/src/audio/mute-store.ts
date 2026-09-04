/**
 * Global mute flag (spec §6.5): "estado único, persistido localmente en el
 * dispositivo". Pure state machine with an injected storage — the real
 * adapter (`realLocalStorage` in `../env.js`) is the only thing that touches
 * `localStorage`, and even that can throw (private browsing, quota, a
 * storage-blocking setting), so every access here is guarded: a mute
 * preference is a convenience, never something worth crashing audio over.
 */
export interface MuteStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'arcade:muted';

export class MuteStore {
  private muted: boolean;

  constructor(private readonly storage: MuteStorage | null) {
    this.muted = readStoredMuted(storage);
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Toggleable mid-game without pausing (§6.5) — this never touches the loop or lifecycle. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      this.storage?.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // Persistence is best-effort; the in-memory flag above still governs playback this session.
    }
  }

  toggle(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

function readStoredMuted(storage: MuteStorage | null): boolean {
  if (storage === null) return false;
  try {
    return storage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
