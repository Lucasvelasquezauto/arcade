/**
 * Lifecycle and pause (spec §3).
 *
 * `LifecycleController` is a small, injected-clock state machine — pure
 * enough to test without a browser. `attachBrowserLifecycle` is the thin
 * real adapter that feeds it real visibility/focus events; it is not
 * exercised by tests.
 */
import { realFrameClock, realVisibilitySource, type EventTarget, type FrameClock } from './env.js';

export type LifecyclePhase = 'running' | 'paused' | 'resuming';

/** Spec §3: "cuenta regresiva visible de 3 segundos". */
export const RESUME_COUNTDOWN_MS = 3000;

export interface LifecycleCallbacks {
  /** Fired the moment the app is paused: stop the loop, stop all audio, discard input. */
  onPause(): void;
  /** Fired once the resume countdown reaches zero: the game resumes exactly where it left off. */
  onResume(): void;
}

/**
 * Tracks whether the game is running, paused, or counting down to resume,
 * and drives the 3-second countdown with the real clock — the countdown is
 * not part of the simulation, so it is measured in milliseconds, not ticks
 * (§3: "se mide con el reloj del entorno, no en ticks").
 */
export class LifecycleController {
  private phase: LifecyclePhase = 'running';
  private countdownEndMs = 0;

  constructor(private readonly callbacks: LifecycleCallbacks) {}

  getPhase(): LifecyclePhase {
    return this.phase;
  }

  /**
   * A pause trigger fired: visibility lost, `pagehide`, loss of window
   * focus, or a manual pause request (§3: "pausa manual, mismo
   * comportamiento"). Idempotent, and also the correct response to losing
   * visibility again mid-countdown: it re-pauses and drops the countdown,
   * so the next `beginResume` starts fresh at 3 seconds rather than
   * resuming a partially-elapsed one (§3 rule 4).
   */
  pause(): void {
    if (this.phase === 'paused') return;
    this.phase = 'paused';
    this.callbacks.onPause();
  }

  /**
   * A "visibility regained" signal fired: visibility restored, focus
   * regained, or a manual resume request. Starts the 3-second countdown; a
   * no-op if the game was already running.
   */
  beginResume(nowMs: number): void {
    if (this.phase === 'running') return;
    this.phase = 'resuming';
    this.countdownEndMs = nowMs + RESUME_COUNTDOWN_MS;
  }

  /**
   * Call every frame with the current real-clock time while a resume
   * countdown may be in progress. A no-op otherwise.
   */
  advance(nowMs: number): void {
    if (this.phase !== 'resuming') return;
    if (nowMs >= this.countdownEndMs) {
      this.phase = 'running';
      this.callbacks.onResume();
    }
  }

  /** Whole seconds left to show on the countdown overlay; 0 outside a countdown. */
  secondsRemaining(nowMs: number): number {
    if (this.phase !== 'resuming') return 0;
    return Math.max(0, Math.ceil((this.countdownEndMs - nowMs) / 1000));
  }
}

/**
 * Wires a `LifecycleController` to the three real pause triggers (spec §3:
 * "se escuchan los tres porque ninguno cubre solo todos los casos entre
 * Android y iOS") and to visibility/focus regained. Returns an unsubscribe
 * function. Untested — thin DOM wiring around the tested state machine above.
 */
export function attachBrowserLifecycle(
  controller: LifecycleController,
  clock: FrameClock = realFrameClock,
  { document, window }: { document: EventTarget & { hidden: boolean }; window: EventTarget } = realVisibilitySource,
): () => void {
  const onVisibilityChange = (): void => {
    if (document.hidden) controller.pause();
    else controller.beginResume(clock.now());
  };
  const onPageHide = (): void => controller.pause();
  const onBlur = (): void => controller.pause();
  const onFocus = (): void => controller.beginResume(clock.now());

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
  };
}
