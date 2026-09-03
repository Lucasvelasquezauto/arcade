import { NEUTRAL_INPUT } from '@arcade/contracts';
import type { Axis, InputState } from '@arcade/contracts';
import { FIRE_BUTTON_ID } from '../src/logic/constants.js';

export function inputAt(x: Axis, fire: boolean): InputState {
  return {
    ...NEUTRAL_INPUT,
    x,
    buttons: { [FIRE_BUTTON_ID]: { down: fire, pressed: fire } },
  };
}
