import { describe, expect, it } from 'vitest';
import { ButtonEdgeTracker } from '../src/input/edge.js';

describe('ButtonEdgeTracker (spec §4.2 — the pressed edge cannot be lost)', () => {
  it('a press and release between two ticks reports pressed:true exactly once', () => {
    const tracker = new ButtonEdgeTracker();

    tracker.press('fire');
    tracker.release('fire'); // both happen before the tick samples anything

    expect(tracker.sample()).toEqual({ fire: { down: false, pressed: true } });
    expect(tracker.sample()).toEqual({ fire: { down: false, pressed: false } });
  });

  it('holding a button down reports pressed only on the tick where it first went down', () => {
    const tracker = new ButtonEdgeTracker();

    tracker.press('fire');
    expect(tracker.sample()).toEqual({ fire: { down: true, pressed: true } });
    expect(tracker.sample()).toEqual({ fire: { down: true, pressed: false } });
  });

  it('an unpressed button never appears in the sample', () => {
    const tracker = new ButtonEdgeTracker();
    expect(tracker.sample()).toEqual({});
  });

  it('reset forgets held buttons and pending edges (pause discipline, spec §3)', () => {
    const tracker = new ButtonEdgeTracker();
    tracker.press('fire');

    tracker.reset();

    expect(tracker.sample()).toEqual({});
  });
});
