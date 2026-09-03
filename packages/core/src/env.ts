/**
 * Thin, typed access to the handful of browser globals the loop and the
 * lifecycle need (`requestAnimationFrame`, `performance.now`, and the
 * `document`/`window` event targets for visibility and focus).
 *
 * The project's shared `tsconfig` intentionally omits the DOM lib, because
 * pure game logic must never see it (Art. 3.1) and that lib is global to
 * every package compiled together. Adding an ambient `declare global` here
 * would leak DOM types into every package in the same `tsc` run, so instead
 * this file casts `globalThis` locally, once, behind narrow interfaces. Only
 * this file (and the thin real-adapters in `loop.ts` / `lifecycle.ts` that
 * use it) touches these casts — the tested logic never does.
 */

export interface FrameClock {
  now(): number;
  requestFrame(callback: (timeMs: number) => void): number;
  cancelFrame(handle: number): void;
}

interface BrowserFrameGlobals {
  performance: { now(): number };
  requestAnimationFrame(callback: (time: number) => void): number;
  cancelAnimationFrame(handle: number): void;
}

function frameGlobals(): BrowserFrameGlobals {
  return globalThis as unknown as BrowserFrameGlobals;
}

/** Real wall clock and `requestAnimationFrame` scheduler. Not used by tests. */
export const realFrameClock: FrameClock = {
  now: () => frameGlobals().performance.now(),
  requestFrame: (callback) => frameGlobals().requestAnimationFrame(callback),
  cancelFrame: (handle) => frameGlobals().cancelAnimationFrame(handle),
};

type Listener = () => void;

export interface EventTarget {
  addEventListener(type: string, listener: Listener): void;
  removeEventListener(type: string, listener: Listener): void;
}

interface BrowserVisibilityGlobals {
  document: EventTarget & { hidden: boolean };
  window: EventTarget;
}

function visibilityGlobals(): BrowserVisibilityGlobals {
  return globalThis as unknown as BrowserVisibilityGlobals;
}

/** The real `document`/`window`, narrowed to what lifecycle wiring needs. Not used by tests. */
export const realVisibilitySource: BrowserVisibilityGlobals = visibilityGlobals();
