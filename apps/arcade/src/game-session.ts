/**
 * apps/arcade — one played session of a game, from `attachCanvas` to
 * `detachCanvas` (docs/specs/shell.md §2). This is the composition root that
 * turns the pieces `@arcade/core` exports into the one thing the shell asked
 * for (`CoreHandle`, see `packages/shell/src/types.ts`): the shell never sees
 * any of this, it only calls the handful of methods this class backs.
 */
import type { AnyGameModule, Axis, InputState } from '@arcade/contracts';
import type { SessionStatus, SessionView } from '@arcade/shell';
import type { CatalogEntry } from '@arcade/catalog';
import {
  ButtonEdgeTracker,
  CanvasDrawSurface,
  GameLoop,
  LifecycleController,
  MAX_TICKS_PER_FRAME,
  attachBrowserLifecycle,
  haptics,
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
 */
function centerCanvas(canvas: HTMLCanvasElement): void {
  canvas.style.position = 'absolute';
  canvas.style.top = '50%';
  canvas.style.left = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';
}

export class GameSession {
  private readonly buttons = new ButtonEdgeTracker();
  private stickX: Axis = 0;
  private stickY: Axis = 0;
  private stickActuated = false;

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
    centerCanvas(canvas);

    const resizeTarget = canvas.parentElement ?? canvas;
    const applyResize = (): void => {
      const rect = resizeTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.surface.resize({ width: rect.width, height: rect.height }, window.devicePixelRatio || 1);
      }
    };
    applyResize();
    this.resizeObserver = new ResizeObserver(applyResize);
    this.resizeObserver.observe(resizeTarget);

    this.lifecycle = new LifecycleController({
      onPause: () => {
        this.loop?.pause();
        this.audioPlayer.stopAll();
        // spec §3 rule 4: pause discards input — nothing the finger does while hidden reaches the game.
        this.buttons.reset();
        this.stickX = 0;
        this.stickY = 0;
        this.stickActuated = false;
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
    return { x: this.stickX, y: this.stickY, buttons: this.buttons.sample() };
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
   * SUPUESTO — division of labour confirmed by shell.md §5/core.md §4.0: the
   * shell already resolves the drag into a digital -1/0/1 axis with its own
   * dead zone (`packages/shell/src/controls/touch.ts`), so this stores that
   * value directly instead of running it back through `@arcade/core`'s
   * `resolveStick`/`TouchInput` — doing both would either be a no-op (since
   * |±1| always clears any dead zone below 1) or silently apply a SECOND,
   * differently-owned dead zone with no clear reason to. `ButtonEdgeTracker`
   * is still used directly for the flanco-safe `pressed` edge (§4.2), which
   * is genuinely the core's job.
   */
  setStick(x: Axis, y: Axis): void {
    const actuated = x !== 0 || y !== 0;
    // core.md §7.2: haptics fire only on actuating a control, never on a game event.
    if (actuated && !this.stickActuated) haptics.trigger();
    this.stickActuated = actuated;
    this.stickX = x;
    this.stickY = y;
  }

  setButton(id: string, down: boolean): void {
    if (down) {
      this.buttons.press(id);
      haptics.trigger();
    } else {
      this.buttons.release(id);
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
