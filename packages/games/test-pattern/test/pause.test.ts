import { describe, expect, it } from 'vitest';
import { createState } from '../src/logic/state.js';
import { step } from '../src/logic/step.js';
import { snapshot, restore } from '../src/logic/snapshot.js';
import { inputAt } from './helpers.js';

describe('ida y vuelta de pausa (snapshot/restore)', () => {
  it('restore(snapshot(estado)) produce un estado idéntico al original', () => {
    let state = createState();
    for (let tick = 0; tick < 50; tick++) {
      state = step(state, inputAt(tick % 2 === 0 ? 1 : -1, tick % 3 === 0)).state;
    }

    const restored = restore(snapshot(state));
    expect(restored).toEqual(state);
  });

  it('el estado restaurado sigue avanzando igual que uno que nunca se pausó', () => {
    let live = createState();
    for (let tick = 0; tick < 50; tick++) {
      live = step(live, inputAt(1, false)).state;
    }
    let restored = restore(snapshot(live));

    for (let tick = 0; tick < 20; tick++) {
      const input = inputAt(0, tick === 0);
      live = step(live, input).state;
      restored = step(restored, input).state;
    }
    expect(restored).toEqual(live);
  });
});
