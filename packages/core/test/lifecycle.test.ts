import { describe, expect, it, vi } from 'vitest';
import { LifecycleController, RESUME_COUNTDOWN_MS } from '../src/lifecycle.js';

describe('LifecycleController (spec §3 — lifecycle and pause)', () => {
  it('pause fires onPause once and is idempotent', () => {
    const onPause = vi.fn();
    const controller = new LifecycleController({ onPause, onResume: vi.fn() });

    controller.pause();
    controller.pause();

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(controller.getPhase()).toBe('paused');
  });

  it('resume waits the full 3-second countdown, measured on the real clock', () => {
    const onResume = vi.fn();
    const controller = new LifecycleController({ onPause: vi.fn(), onResume });

    controller.pause();
    controller.beginResume(0);
    expect(controller.getPhase()).toBe('resuming');

    controller.advance(RESUME_COUNTDOWN_MS - 1);
    expect(onResume).not.toHaveBeenCalled();
    expect(controller.getPhase()).toBe('resuming');

    controller.advance(RESUME_COUNTDOWN_MS);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(controller.getPhase()).toBe('running');
  });

  it('beginResume before ever pausing is a no-op: nothing to resume from', () => {
    const onResume = vi.fn();
    const controller = new LifecycleController({ onPause: vi.fn(), onResume });

    controller.beginResume(0);

    expect(controller.getPhase()).toBe('running');
    controller.advance(RESUME_COUNTDOWN_MS);
    expect(onResume).not.toHaveBeenCalled();
  });

  it('losing visibility again mid-countdown restarts it at a full 3 seconds on the next resume (§3 rule 4)', () => {
    const onPause = vi.fn();
    const controller = new LifecycleController({ onPause, onResume: vi.fn() });

    controller.pause();
    controller.beginResume(0);
    controller.advance(2000); // 1s left on the countdown...
    controller.pause(); // ...but visibility is lost again.

    expect(controller.getPhase()).toBe('paused');
    expect(onPause).toHaveBeenCalledTimes(2);

    controller.beginResume(5000);
    expect(controller.secondsRemaining(5000)).toBe(3);
    controller.advance(5000 + RESUME_COUNTDOWN_MS - 1);
    expect(controller.getPhase()).toBe('resuming');
  });

  it('secondsRemaining counts down and reads 0 outside a countdown', () => {
    const controller = new LifecycleController({ onPause: vi.fn(), onResume: vi.fn() });

    expect(controller.secondsRemaining(0)).toBe(0);

    controller.pause();
    controller.beginResume(0);
    expect(controller.secondsRemaining(0)).toBe(3);
    expect(controller.secondsRemaining(2500)).toBe(1);
  });
});
