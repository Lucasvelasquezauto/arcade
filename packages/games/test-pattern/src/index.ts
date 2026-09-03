/**
 * @arcade/game-test-pattern — banco de pruebas del núcleo (M1.6). Feo a propósito:
 * su único trabajo es ejercitar todos los contratos de @arcade/contracts
 * (docs/specs/walking-skeleton.md §3). No entra al catálogo de producción.
 */
import type { GameModule } from '@arcade/contracts';
import { FIRE_BUTTON_ID, RESOLUTION } from './logic/constants.js';
import { createState } from './logic/state.js';
import { step } from './logic/step.js';
import { draw } from './logic/draw.js';
import { snapshot, restore } from './logic/snapshot.js';
import type { TestPatternState } from './logic/state.js';

export type { TestPatternState } from './logic/state.js';

/** SUPUESTO: acento de cabina arbitrario, sin versión de referencia que fijarlo. */
const ACCENT_COLOR = '#39ff14';

export const testPattern: GameModule<TestPatternState> = {
  id: 'test-pattern',
  title: 'TEST PATTERN',
  accentColor: ACCENT_COLOR,
  resolution: RESOLUTION,
  panel: {
    stick: 'horizontal',
    buttons: [{ id: FIRE_BUTTON_ID, label: 'FIRE', color: 'red' }],
  },
  createState,
  step,
  draw,
  readScore: (state) => state.score,
  readStatus: (state) => state.status,
  snapshot,
  restore,
};
