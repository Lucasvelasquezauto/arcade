import { TICK_MS } from '@arcade/contracts';
import { describe, expect, it } from 'vitest';
import { DiagnosticsRecorder } from '../src/diagnostics/diagnostics-recorder.js';

function fakeDeps(): { now: () => number; nowIso: () => string; advance: (ms: number) => void; setIso: (iso: string) => void } {
  let nowMs = 0;
  let iso = '2026-09-03T00:00:00.000Z';
  return {
    now: () => nowMs,
    nowIso: () => iso,
    advance: (ms: number) => {
      nowMs += ms;
    },
    setIso: (value: string) => {
      iso = value;
    },
  };
}

describe('DiagnosticsRecorder (spec §9)', () => {
  it('starts at a sensible default snapshot', () => {
    const deps = fakeDeps();
    const recorder = new DiagnosticsRecorder(deps);
    expect(recorder.snapshot()).toEqual({
      fps: 0,
      ticksPerSecond: 0,
      droppedTicks: 0,
      recordsQueueSize: 0,
      online: true,
      pauseLog: [],
    });
  });

  it('recordFrame feeds both fps and ticks/s', () => {
    const deps = fakeDeps();
    const recorder = new DiagnosticsRecorder(deps);
    for (let i = 0; i < 60; i++) {
      recorder.recordFrame(TICK_MS);
      deps.advance(TICK_MS);
    }
    const snapshot = recorder.snapshot();
    expect(snapshot.fps).toBeGreaterThan(0);
    expect(snapshot.ticksPerSecond).toBeGreaterThan(0);
  });

  it('recordPause/recordResume append to the pause log', () => {
    const deps = fakeDeps();
    const recorder = new DiagnosticsRecorder(deps);
    deps.setIso('2026-09-03T00:00:05.000Z');
    recorder.recordPause();
    deps.advance(1200);
    recorder.recordResume();
    expect(recorder.snapshot().pauseLog).toEqual([{ startedAt: '2026-09-03T00:00:05.000Z', durationMs: 1200 }]);
  });

  it('setRecordsQueueSize and setOnline are reflected verbatim in the snapshot', () => {
    const recorder = new DiagnosticsRecorder(fakeDeps());
    recorder.setRecordsQueueSize(3);
    recorder.setOnline(false);
    const snapshot = recorder.snapshot();
    expect(snapshot.recordsQueueSize).toBe(3);
    expect(snapshot.online).toBe(false);
  });

  it('a frame beyond the tick cap increases droppedTicks', () => {
    const deps = fakeDeps();
    const recorder = new DiagnosticsRecorder(deps);
    recorder.recordFrame(TICK_MS * 20); // way over MAX_TICKS_PER_FRAME
    expect(recorder.snapshot().droppedTicks).toBeGreaterThan(0);
  });
});
