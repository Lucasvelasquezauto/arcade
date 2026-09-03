import { advanceTimers, button, schedule } from '@arcade/contracts';
import type { Axis, InputState, SoundEvent, TickResult } from '@arcade/contracts';
import {
  FIRE_BUTTON_ID,
  GAME_OVER_TAG,
  RESOLUTION,
  SCORE_PER_SHOT,
  SHOT_SOUND_ID,
  SQUARE_RESET_TAG,
  SQUARE_RESET_TICKS,
  SQUARE_SIZE,
  SQUARE_SPEED,
} from './constants.js';
import { centerSquare } from './state.js';
import type { Square, TestPatternState } from './state.js';

function moveSquare(square: Square, axis: Axis): Square {
  const x = Math.min(Math.max(square.x + axis * SQUARE_SPEED, 0), RESOLUTION.width - SQUARE_SIZE);
  return { x, y: square.y };
}

export function step(state: TestPatternState, input: InputState): TickResult<TestPatternState> {
  if (state.status === 'over') {
    return { state, sounds: [] };
  }

  const { timers: advancedTimers, fired } = advanceTimers(state.timers);
  let timers = advancedTimers;
  let square = moveSquare(state.square, input.x);
  let score = state.score;
  const sounds: SoundEvent[] = [];

  if (fired.includes(SQUARE_RESET_TAG)) {
    square = centerSquare();
    timers = schedule(timers, SQUARE_RESET_TAG, SQUARE_RESET_TICKS);
  }

  if (button(input, FIRE_BUTTON_ID).pressed) {
    score += SCORE_PER_SHOT;
    sounds.push({ kind: 'play', id: SHOT_SOUND_ID });
  }

  const status = fired.includes(GAME_OVER_TAG) ? 'over' : state.status;

  return { state: { square, score, status, timers }, sounds };
}
