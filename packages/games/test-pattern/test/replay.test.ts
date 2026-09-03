import { describe, expect, it } from 'vitest';
import type { Axis, InputState } from '@arcade/contracts';
import { createState } from '../src/logic/state.js';
import { step } from '../src/logic/step.js';
import { inputAt } from './helpers.js';

const TICKS = 700; // cruza el reinicio de 600 y deja margen tras él.

function recordedSequence(): InputState[] {
  const sequence: InputState[] = [];
  for (let tick = 0; tick < TICKS; tick++) {
    const axis: Axis = tick % 5 === 0 ? 1 : tick % 7 === 0 ? -1 : 0;
    const fire = tick % 11 === 0;
    sequence.push(inputAt(axis, fire));
  }
  return sequence;
}

function run(sequence: readonly InputState[]) {
  let state = createState();
  for (const input of sequence) {
    state = step(state, input).state;
  }
  return state;
}

describe('repetición determinista', () => {
  it('la misma secuencia grabada produce siempre el mismo estado final', () => {
    const sequence = recordedSequence();
    const first = run(sequence);
    const second = run(sequence);
    expect(second).toEqual(first);
  });

  it('produce un puntaje mayor que cero, prueba de que la secuencia sí dispara', () => {
    const final = run(recordedSequence());
    expect(final.score).toBeGreaterThan(0);
  });
});
