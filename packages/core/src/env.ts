/**
 * Thin, typed access to the handful of browser globals the loop, the
 * lifecycle, the audio player and the haptics module need
 * (`requestAnimationFrame`, `performance.now`, the `document`/`window` event
 * targets for visibility and focus, `AudioContext`, `localStorage` and
 * `navigator.vibrate`).
 *
 * The project's shared `tsconfig` intentionally omits the DOM lib, because
 * pure game logic must never see it (Art. 3.1) and that lib is global to
 * every package compiled together. Adding an ambient `declare global` here
 * would leak DOM types into every package in the same `tsc` run, so instead
 * this file casts `globalThis` locally, once, behind narrow interfaces. Only
 * this file (and the thin real-adapters in `loop.ts` / `lifecycle.ts` /
 * `audio/audio-player.ts` / `haptics.ts` that use it) touches these casts —
 * the tested logic never does.
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

/** Narrow view of the Web Audio nodes the audio player needs (spec §6.1). */
export interface AudioParamLike {
  value: number;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): void;
}

export interface GainNodeLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface AudioBufferLike {
  getChannelData(channel: number): Float32Array;
}

export interface AudioBufferSourceNodeLike extends AudioNodeLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
  readonly playbackRate: AudioParamLike;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: AudioNodeLike;
  readonly state: 'suspended' | 'running' | 'closed';
  resume(): Promise<void>;
  createGain(): GainNodeLike;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBufferLike;
  createBufferSource(): AudioBufferSourceNodeLike;
}

interface AudioGlobals {
  AudioContext: new () => AudioContextLike;
}

function audioGlobals(): AudioGlobals {
  return globalThis as unknown as AudioGlobals;
}

/**
 * Constructs the single real `AudioContext` the app uses (spec §6.1: "un
 * contexto único para toda la app"). A factory, not a shared constant,
 * because constructing one is a side effect (some browsers start it
 * suspended, counted against a per-page limit) that only the audio player's
 * own singleton should trigger — tests never call this.
 */
export function realAudioContextFactory(): AudioContextLike {
  return new (audioGlobals().AudioContext)();
}

/** Narrow view of `Storage` (`localStorage`), as used by `MuteStore`. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StorageGlobals {
  localStorage?: StorageLike;
}

/**
 * The real `localStorage`, or `null` when unavailable. Reading the global
 * itself can throw (private browsing in some engines, storage disabled by a
 * site setting), which is exactly the kind of platform quirk `MuteStore` is
 * written to tolerate (spec §6.5) — this returns `null` rather than letting
 * that exception surface, so a missing mute preference never breaks audio.
 */
export function realLocalStorage(): StorageLike | null {
  try {
    return (globalThis as unknown as StorageGlobals).localStorage ?? null;
  } catch {
    return null;
  }
}

interface NavigatorGlobals {
  navigator?: { vibrate?(pattern: number | readonly number[]): boolean };
}

/**
 * The real `navigator.vibrate`, bound, or `null` when the capability does
 * not exist (spec §7.4: "se detecta la capacidad, no la plataforma" — this
 * is that detection; iPhone simply has no `vibrate` and this reflects that
 * as `null` exactly like a Android browser with the API disabled would).
 */
export function realVibrate(): ((pattern: number | readonly number[]) => boolean) | null {
  try {
    const nav = (globalThis as unknown as NavigatorGlobals).navigator;
    return nav?.vibrate ? nav.vibrate.bind(nav) : null;
  } catch {
    return null;
  }
}
