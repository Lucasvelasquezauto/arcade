import { describe, expect, it } from 'vitest';
import { PauseLogRecorder } from '../src/diagnostics/pause-log.js';

describe('PauseLogRecorder (spec §9 — últimas pausas con su duración)', () => {
  it('is empty before any pause', () => {
    expect(new PauseLogRecorder().log()).toEqual([]);
  });

  it('logs a completed pause with its duration and the ISO timestamp it started at', () => {
    const recorder = new PauseLogRecorder();
    recorder.recordPauseStart(1000, '2026-09-03T00:00:01.000Z');
    recorder.recordResume(3500);
    expect(recorder.log()).toEqual([{ startedAt: '2026-09-03T00:00:01.000Z', durationMs: 2500 }]);
  });

  it('an unmatched resume (no pause in progress) is ignored', () => {
    const recorder = new PauseLogRecorder();
    recorder.recordResume(1000);
    expect(recorder.log()).toEqual([]);
  });

  it('a second pauseStart while one is already tracked does not restart the clock', () => {
    const recorder = new PauseLogRecorder();
    recorder.recordPauseStart(1000, '2026-09-03T00:00:01.000Z');
    recorder.recordPauseStart(2000, '2026-09-03T00:00:02.000Z'); // ignored — one already in progress
    recorder.recordResume(3000);
    expect(recorder.log()).toEqual([{ startedAt: '2026-09-03T00:00:01.000Z', durationMs: 2000 }]);
  });

  it('keeps only the most recent entries, capped', () => {
    const recorder = new PauseLogRecorder();
    for (let i = 0; i < 15; i++) {
      recorder.recordPauseStart(i * 1000, `2026-09-03T00:00:${String(i).padStart(2, '0')}.000Z`);
      recorder.recordResume(i * 1000 + 100);
    }
    const log = recorder.log();
    expect(log.length).toBeLessThanOrEqual(10);
    expect(log.at(-1)?.startedAt).toBe('2026-09-03T00:00:14.000Z'); // the most recent pause is kept
  });

  it('appends multiple sequential pauses in order', () => {
    const recorder = new PauseLogRecorder();
    recorder.recordPauseStart(0, 'a');
    recorder.recordResume(100);
    recorder.recordPauseStart(200, 'b');
    recorder.recordResume(500);
    expect(recorder.log()).toEqual([
      { startedAt: 'a', durationMs: 100 },
      { startedAt: 'b', durationMs: 300 },
    ]);
  });
});
