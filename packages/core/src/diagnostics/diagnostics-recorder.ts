/**
 * Composes the pieces above into the one object the app feeds real frame/
 * pause/queue/connectivity events into, and pulls a `DiagnosticsSnapshot`
 * out of (spec §9). Fully deterministic given the injected clocks — no
 * `performance.now()`/`Date` read directly — so it is unit-tested like
 * `LifecycleController`, not left untested like `attachBrowserLifecycle`.
 */
import { LoopStatsRecorder } from './loop-stats.js';
import { PauseLogRecorder } from './pause-log.js';
import { RollingRateCounter } from './rolling-rate-counter.js';
import type { DiagnosticsSnapshot } from './types.js';

export interface DiagnosticsRecorderDeps {
  /** Monotonic clock, e.g. `FrameClock.now` — used for fps/tps windows and pause durations. */
  readonly now: () => number;
  /** Wall clock, e.g. `realNowIso` — used only for the displayed pause timestamp. */
  readonly nowIso: () => string;
}

export class DiagnosticsRecorder {
  private readonly fps = new RollingRateCounter();
  private readonly loopStats = new LoopStatsRecorder();
  private readonly pauseLog = new PauseLogRecorder();
  private recordsQueueSize = 0;
  private online = true;

  constructor(private readonly deps: DiagnosticsRecorderDeps) {}

  /** Call once per displayed frame, alongside `GameLoop.onFrame(elapsedMs)`, with the same `elapsedMs`. */
  recordFrame(elapsedMs: number): void {
    const nowMs = this.deps.now();
    this.fps.record(nowMs);
    this.loopStats.recordFrame(nowMs, elapsedMs);
  }

  /** Call alongside the real `LifecycleCallbacks.onPause`. */
  recordPause(): void {
    this.loopStats.pause();
    this.pauseLog.recordPauseStart(this.deps.now(), this.deps.nowIso());
  }

  /** Call alongside the real `LifecycleCallbacks.onResume`. */
  recordResume(): void {
    this.loopStats.resume();
    this.pauseLog.recordResume(this.deps.now());
  }

  /** Feed from `RecordsService.subscribeQueueSize` (spec §9). */
  setRecordsQueueSize(size: number): void {
    this.recordsQueueSize = size;
  }

  /** Feed from `attachConnectivity` (spec §9). */
  setOnline(online: boolean): void {
    this.online = online;
  }

  snapshot(): DiagnosticsSnapshot {
    const nowMs = this.deps.now();
    return {
      fps: Math.round(this.fps.ratePerSecond(nowMs)),
      ticksPerSecond: Math.round(this.loopStats.ticksPerSecond(nowMs)),
      droppedTicks: this.loopStats.droppedTicksTotal(),
      recordsQueueSize: this.recordsQueueSize,
      online: this.online,
      pauseLog: this.pauseLog.log(),
    };
  }
}
