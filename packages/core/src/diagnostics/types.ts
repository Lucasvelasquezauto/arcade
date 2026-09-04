/** Data model for the diagnostics screen (spec §9). The shell only presents this; it never computes any of it. */

export interface PauseLogEntry {
  readonly startedAt: string;
  readonly durationMs: number;
}

export interface DiagnosticsSnapshot {
  readonly fps: number;
  readonly ticksPerSecond: number;
  readonly droppedTicks: number;
  readonly recordsQueueSize: number;
  readonly online: boolean;
  readonly pauseLog: readonly PauseLogEntry[];
}
