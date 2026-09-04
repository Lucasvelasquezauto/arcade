/**
 * Haptic feedback (spec §7). ONLY ever called when the shell detects a
 * control being actuated (a button pressed, a stick engaged) — never from a
 * game event. The core does not enforce that rule by itself: it has no way
 * to know "this call came from a control tap" versus anything else, because
 * it never sees game state (Art. 3.8). Enforcing it is on whoever calls
 * `trigger` — this module only provides the capability-detected primitive.
 *
 * SUPUESTO: no game or shell spec fixes a vibration duration, so
 * `DEFAULT_DURATION_MS` is a short, arbitrary tap-like buzz, overridable by
 * the caller.
 */
import { realVibrate } from './env.js';

const DEFAULT_DURATION_MS = 15;

export interface HapticFeedback {
  /** Whether this device/browser exposes vibration at all (spec §7.4). */
  isAvailable(): boolean;
  /**
   * Fires a single vibration pulse. A no-op, silently, when the capability
   * is absent (iPhone, always) or the call itself fails — spec §7.4:
   * "se detecta la capacidad ... si no existe o falla, se ignora en silencio."
   */
  trigger(durationMs?: number): void;
}

type Vibrate = (pattern: number | readonly number[]) => boolean;

export function createHapticFeedback(vibrate: Vibrate | null = realVibrate()): HapticFeedback {
  return {
    isAvailable(): boolean {
      return vibrate !== null;
    },
    trigger(durationMs: number = DEFAULT_DURATION_MS): void {
      if (vibrate === null) return;
      try {
        vibrate(durationMs);
      } catch {
        // Detected support can still fail at call time on some devices; ignore (§7.4).
      }
    },
  };
}

/** Real singleton for the shell to call directly. */
export const haptics: HapticFeedback = createHapticFeedback();
