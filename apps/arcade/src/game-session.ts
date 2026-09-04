/**
 * apps/arcade — one played session of a game, from `attachCanvas` to
 * `detachCanvas` (docs/specs/shell.md §2). This is the composition root that
 * turns the pieces `@arcade/core` exports into the one thing the shell asked
 * for (`CoreHandle`, see `packages/shell/src/types.ts`): the shell never sees
 * any of this, it only calls the handful of methods this class backs.
 */
import type { AnyGameModule, InputState } from '@arcade/contracts';
import type { SessionStatus, SessionView } from '@arcade/shell';
import { STICK_DEAD_ZONE_RATIO, prefersFinePointer } from '@arcade/shell';
import type { CatalogEntry } from '@arcade/catalog';
import {
  CanvasDrawSurface,
  GameLoop,
  LifecycleController,
  MAX_TICKS_PER_FRAME,
  TouchInput,
  attachBrowserLifecycle,
  type AudioPlayer,
  type CanvasLike,
} from '@arcade/core';
import { FrameMetrics } from './diagnostics.js';

export interface PauseLogEntry {
  readonly startedAt: string;
  readonly durationMs: number;
}

export interface DiagnosticsSnapshot {
  readonly fps: number;
  readonly ticksPerSecond: number;
  readonly droppedTicks: number;
  readonly pauseLog: readonly PauseLogEntry[];
}

/**
 * SUPUESTO — centres the letterboxed canvas inside its container by setting
 * inline styles directly on the DOM node the shell handed us, instead of
 * editing `packages/shell`: `CanvasDrawSurface.resize()` (core.md §5) sets
 * `canvas.style.width/height` to the exact letterboxed size but never a
 * position, and `CanvasMount` (shell) never centres its child either — no
 * spec says who does. Positioning the node imperatively from here, once, is
 * composition (this package's job, per its CLAUDE.md), not a change to
 * either package's source.
 *
 * `extraScale` is M2.1's PC magnification (core.md §5.4b, product-spec.md
 * §2.1 regla 1): `CanvasDrawSurface.resize()` already drew the game at the
 * best INTEGER multiple that fits (the "superficie interna" the spec
 * describes) — this composes an additional uniform CSS scale on top, on a
 * fine pointer only, to fill whatever the integer step left unused. The
 * browser's default (bilinear) resampling of the canvas element is exactly
 * the "suavizado uniforme" the spec asks for; nothing here sets
 * `image-rendering: pixelated`, unlike the crisp default. 1 is a no-op —
 * `transform: scale(1)` changes nothing, so this is safe to always apply.
 */
function positionCanvas(canvas: HTMLCanvasElement, extraScale: number): void {
  canvas.style.position = 'absolute';
  canvas.style.top = '50%';
  canvas.style.left = '50%';
  canvas.style.transform = `translate(-50%, -50%) scale(${extraScale})`;
}

export class GameSession {
  /**
   * M2.1 correction (core.md §4.0): the shell now hands over the stick's
   * CONTINUOUS displacement instead of a pre-resolved digital axis, so this
   * is the core's own `TouchInput` — dead-zone-to-digital resolution and
   * button-edge tracking both live here now, not hand-rolled in this file
   * (docs/handoff/1.11-cableado.md §4/§8 flagged `TouchInput`/`resolveStick`
   * as dead code with no consumer; this wiring is that consumer).
   */
  private readonly touchInput: TouchInput;

  private readonly surface: CanvasDrawSurface;
  private readonly resizeObserver: ResizeObserver;
  private readonly lifecycle: LifecycleController;
  private readonly detachLifecycle: () => void;
  private readonly metrics = new FrameMetrics();
  private readonly pauseLog: PauseLogEntry[] = [];

  private loop: GameLoop<unknown> | null = null;
  private module: AnyGameModule | null = null;
  private score = 0;
  private gameStatus: 'playing' | 'over' = 'playing';

  private rafHandle: number | null = null;
  private lastFrameMs: number | null = null;
  private ticksThisFrame = 0;
  private pauseStartedAtPerfMs: number | null = null;
  private pauseStartedAtIso: string | null = null;
  private destroyed = false;

  constructor(
    canvas: HTMLCanvasElement,
    entry: CatalogEntry,
    private readonly audioPlayer: AudioPlayer,
    private readonly onChange: () => void,
  ) {
    this.touchInput = new TouchInput({ stick: entry.panel.stick, deadZone: STICK_DEAD_ZONE_RATIO });

    /**
     * SUPUESTO / rough edge: `CanvasLike.getContext('2d')` is typed to return
     * `Context2DLike | null`, whose `fillStyle` is a plain `string`. The real
     * DOM's `CanvasRenderingContext2D.fillStyle` is `string | CanvasGradient
     * | CanvasPattern` — a WIDER type on a MUTABLE property, which TypeScript
     * correctly refuses to narrow implicitly (property variance, unlike the
     * method-parameter bivariance `docs/handoff/1.6-test-pattern.md` notes
     * elsewhere). `canvas-surface.ts`'s own comment ("any real
     * HTMLCanvasElement ... satisfies these structurally") undersells this:
     * it is structurally compatible in the sense that matters (every read
     * this class does only ever assigns a `string`), but not assignable
     * without a cast. This is the one place in the whole wiring that needs
     * one, and it is narrow and local to this composition boundary.
     */
    this.surface = new CanvasDrawSurface(canvas as unknown as CanvasLike, entry.resolution);
    positionCanvas(canvas, 1);

    // core.md §5.4b / product-spec.md §2.1 regla 1 — computed once: this
    // session's canvas either takes the PC magnification path for its whole
    // life or it doesn't, same as `Cabinet.ts`'s own one-shot read.
    const finePointer = prefersFinePointer();
    const resizeTarget = canvas.parentElement ?? canvas;
    const applyResize = (): void => {
      const rect = resizeTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const layout = this.surface.resize({ width: rect.width, height: rect.height }, window.devicePixelRatio || 1);
      // Never deform (shell.md §5.2): a single uniform factor, bound by
      // whichever axis is tighter, so any leftover letterbox stays only in
      // the other axis instead of stretching the image off-ratio.
      const extraScale = finePointer
        ? Math.min(rect.width / layout.cssWidthPx, rect.height / layout.cssHeightPx)
        : 1;
      positionCanvas(canvas, extraScale);
    };
    applyResize();
    this.resizeObserver = new ResizeObserver(applyResize);
    this.resizeObserver.observe(resizeTarget);

    this.lifecycle = new LifecycleController({
      onPause: () => {
        this.loop?.pause();
        this.audioPlayer.stopAll();
        // spec §3 rule 4: pause discards input — nothing the finger does while hidden reaches the game.
        this.touchInput.reset();
        this.pauseStartedAtPerfMs = performance.now();
        this.pauseStartedAtIso = new Date().toISOString();
      },
      onResume: () => {
        this.loop?.resume();
        if (this.pauseStartedAtPerfMs !== null && this.pauseStartedAtIso !== null) {
          this.pauseLog.push({
            startedAt: this.pauseStartedAtIso,
            durationMs: Math.round(performance.now() - this.pauseStartedAtPerfMs),
          });
          this.pauseStartedAtPerfMs = null;
          this.pauseStartedAtIso = null;
        }
      },
    });
    this.detachLifecycle = attachBrowserLifecycle(this.lifecycle);

    // A fresh session always starts behind the same 3-second countdown as regaining visibility (spec §3).
    this.lifecycle.beginResume(performance.now());

    entry.load().then((module) => {
      if (this.destroyed) return;
      this.module = module;
      // SUPUESTO: seed source. core.md §2 says "seed comes from the core, the
      // game never invents one" but never fixes how the core itself picks it;
      // apps/arcade is the composition root standing in for that today.
      const seed = Math.floor(Math.random() * 0x7fffffff);
      this.loop = new GameLoop({
        game: module,
        seed,
        surface: this.surface,
        sampleInput: () => this.sampleInput(),
        onSounds: (sounds) => this.audioPlayer.play(sounds),
      });
      // `GameLoop` starts unpaused by construction (packages/core/src/loop.ts)
      // regardless of lifecycle phase. A session always starts mid-countdown
      // (see `beginResume` above), and core.md §3 requires the simulation
      // frozen for its whole duration — without this, the very first 3s
      // countdown would tick the game for real behind the frozen overlay.
      if (this.lifecycle.getPhase() !== 'running') this.loop.pause();
      this.score = module.readScore(this.loop.getState());
      this.gameStatus = module.readStatus(this.loop.getState());
      this.onChange();
    });

    this.rafHandle = requestAnimationFrame(this.frame);
  }

  private sampleInput(): InputState {
    this.ticksThisFrame += 1;
    return this.touchInput.sample();
  }

  private readonly frame = (nowMs: number): void => {
    this.lifecycle.advance(nowMs);
    const elapsedMs = this.lastFrameMs === null ? 0 : nowMs - this.lastFrameMs;
    this.lastFrameMs = nowMs;

    this.ticksThisFrame = 0;
    this.loop?.onFrame(elapsedMs);
    this.metrics.recordFrame(nowMs, this.ticksThisFrame, this.ticksThisFrame >= MAX_TICKS_PER_FRAME);

    if (this.loop !== null && this.module !== null) {
      this.score = this.module.readScore(this.loop.getState());
      this.gameStatus = this.module.readStatus(this.loop.getState());
    }

    this.onChange();
    this.rafHandle = requestAnimationFrame(this.frame);
  };

  /**
   * M2.1 correction (core.md §4.0): `x`/`y` are now the CONTINUOUS
   * displacement the shell measured against its own drawn radius, not a
   * pre-resolved digital axis — `TouchInput.moveStick`/`resolveStick`
   * (constructed above) apply the dead zone and produce the digital axis a
   * game receives, exactly as core.md §4 always specified. Haptics moved out
   * of this class entirely: `packages/shell/src/controls/{Stick,Button}.ts`
   * now trigger them directly, since the control that receives the gesture
   * is the one that actually knows "this is an actuation" (core.md §7.2).
   */
  setStick(x: number, y: number): void {
    this.touchInput.moveStick(x, y);
  }

  setButton(id: string, down: boolean): void {
    if (down) {
      this.touchInput.press(id);
    } else {
      this.touchInput.release(id);
    }
  }

  pauseManually(): void {
    this.lifecycle.pause();
    this.onChange();
  }

  resumeManually(): void {
    this.lifecycle.beginResume(performance.now());
    this.onChange();
  }

  view(): SessionView {
    const phase = this.lifecycle.getPhase();
    const status: SessionStatus = phase === 'paused' ? 'paused' : phase === 'resuming' ? 'countdown' : 'running';
    return {
      score: this.score,
      status,
      countdown: phase === 'resuming' ? this.lifecycle.secondsRemaining(performance.now()) : null,
      gameStatus: this.gameStatus,
    };
  }

  diagnosticsSnapshot(): DiagnosticsSnapshot {
    return { ...this.metrics.snapshot(), pauseLog: this.pauseLog };
  }

  destroy(): void {
    this.destroyed = true;
    if (this.rafHandle !== null) cancelAnimationFrame(this.rafHandle);
    this.resizeObserver.disconnect();
    this.detachLifecycle();
    this.audioPlayer.stopAll();
  }
}
