import { describe, expect, it } from 'vitest';
import { createState } from '../src/logic/state.js';
import { step } from '../src/logic/step.js';
import { inputAt } from './helpers.js';

/**
 * docs/specs/walking-skeleton.md §3.3: "hace visible si la pausa congela o no
 * los temporizadores internos". El requisito de negocio es que el temporizador
 * de 10 s dispare exactamente en el tick 600 y no antes.
 */
describe('temporizador de reinicio del cuadrado (10 s = 600 ticks)', () => {
  it('no reinicia el cuadrado antes del tick 600', () => {
    let state = createState();
    const center = state.square;

    // Aleja el cuadrado del centro para poder detectar el reinicio.
    for (let i = 0; i < 5; i++) {
      state = step(state, inputAt(1, false)).state;
    }
    expect(state.square).not.toEqual(center);
    const displaced = state.square;

    // Neutral hasta completar 599 ticks totales; el cuadrado no debe moverse
    // por sí solo ni reiniciarse.
    for (let i = 6; i <= 599; i++) {
      state = step(state, inputAt(0, false)).state;
    }
    expect(state.square).toEqual(displaced);
  });

  it('reinicia el cuadrado exactamente en el tick 600', () => {
    let state = createState();
    const center = state.square;

    for (let i = 0; i < 5; i++) {
      state = step(state, inputAt(1, false)).state;
    }
    for (let i = 6; i < 600; i++) {
      state = step(state, inputAt(0, false)).state;
    }
    // Este es el tick número 600.
    state = step(state, inputAt(0, false)).state;
    expect(state.square).toEqual(center);
  });
});
