/**
 * Button down/pressed edge tracking (spec §4.2).
 */
import type { ButtonState } from '@arcade/contracts';

/**
 * Tracks the live down/up stream for every button and turns it into
 * `ButtonState` at sample time. `pressed` latches: it stays true for the
 * next sample as soon as a button goes from up to down, even if the finger
 * lifts again before that sample happens — a press-and-release between two
 * ticks is a shot, not a lost event (§4.2).
 */
export class ButtonEdgeTracker {
  private readonly down = new Map<string, boolean>();
  private readonly pressedSinceSample = new Set<string>();

  press(id: string): void {
    if (this.down.get(id) !== true) this.pressedSinceSample.add(id);
    this.down.set(id, true);
  }

  release(id: string): void {
    this.down.set(id, false);
  }

  /** Snapshot for the current tick, then clears every latched edge. */
  sample(): Record<string, ButtonState> {
    const result: Record<string, ButtonState> = {};
    for (const [id, isDown] of this.down) {
      result[id] = { down: isDown, pressed: this.pressedSinceSample.has(id) };
    }
    this.pressedSinceSample.clear();
    return result;
  }

  /** Pause discipline (spec §3: "la entrada se descarta"): forget every button and edge. */
  reset(): void {
    this.down.clear();
    this.pressedSinceSample.clear();
  }
}
