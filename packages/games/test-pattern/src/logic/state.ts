import { createTimers, schedule } from '@arcade/contracts';
import type { GameStatus, Timers } from '@arcade/contracts';
import {
  GAME_OVER_TAG,
  GAME_OVER_TICKS,
  RESOLUTION,
  SQUARE_RESET_TAG,
  SQUARE_RESET_TICKS,
  SQUARE_SIZE,
} from './constants.js';

export interface Square {
  readonly x: number;
  readonly y: number;
}

export interface TestPatternState {
  readonly square: Square;
  readonly score: number;
  readonly status: GameStatus;
  readonly timers: Timers;
}

export function centerSquare(): Square {
  return {
    x: Math.floor((RESOLUTION.width - SQUARE_SIZE) / 2),
    y: Math.floor((RESOLUTION.height - SQUARE_SIZE) / 2),
  };
}

/**
 * `seed` llega del núcleo por conformidad con el contrato GameModule. SUPUESTO:
 * test-pattern no ejercita el RNG con semilla porque no necesita azar para
 * probar entrada, panel, puntaje, ticks, pausa, audio ni hápticos — se ignora.
 */
export function createState(): TestPatternState {
  let timers = createTimers();
  timers = schedule(timers, SQUARE_RESET_TAG, SQUARE_RESET_TICKS);
  timers = schedule(timers, GAME_OVER_TAG, GAME_OVER_TICKS);
  return {
    square: centerSquare(),
    score: 0,
    status: 'playing',
    timers,
  };
}
