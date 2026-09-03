import { TICK_HZ, remaining } from '@arcade/contracts';
import type { DrawSurface } from '@arcade/contracts';
import { SQUARE_RESET_TAG, SQUARE_SIZE } from './constants.js';
import type { TestPatternState } from './state.js';

const BACKGROUND_COLOR = '#000000';
const SQUARE_COLOR = '#39ff14';
const TEXT_COLOR = '#ffffff';
/** El temporizador es la pieza más importante del juego (§3.3): grande y en rojo. */
const TIMER_COLOR = '#ff0000';

/**
 * No decide nada: dos llamadas con el mismo `state` producen la misma imagen
 * (Art. 3, contrato GameModule.draw). `alpha` se ignora a propósito — es válido
 * hacerlo, cambia la apariencia entre ticks, nunca la simulación.
 */
export function draw(state: TestPatternState, surface: DrawSurface): void {
  surface.clear(BACKGROUND_COLOR);
  surface.fillRect(state.square.x, state.square.y, SQUARE_SIZE, SQUARE_SIZE, SQUARE_COLOR);
  surface.drawText(`SCORE ${state.score}`, 4, 4, { color: TEXT_COLOR });

  const ticksLeft = remaining(state.timers, SQUARE_RESET_TAG) ?? 0;
  const secondsLeft = Math.ceil(ticksLeft / TICK_HZ);
  surface.drawText(String(secondsLeft), surface.width / 2, 4, { color: TIMER_COLOR, align: 'center' });

  if (state.status === 'over') {
    surface.drawText('GAME OVER', surface.width / 2, surface.height / 2, {
      color: TEXT_COLOR,
      align: 'center',
    });
  }
}
