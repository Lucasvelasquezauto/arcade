/**
 * test-pattern no reproduce ningún juego real (CLAUDE.md de este paquete: "sin la
 * presión de la fidelidad histórica"), así que no tiene documento de investigación
 * bajo el Art. 1.4. Las constantes puramente de implementación quedan marcadas
 * SUPUESTO; las que vienen directas de la spec quedan marcadas DERIVADO con su
 * referencia.
 */
import { ticksFromSeconds } from '@arcade/contracts';

/** Resolución lógica del banco de pruebas. SUPUESTO: arbitraria, sin referencia. */
export const RESOLUTION = { width: 200, height: 150 } as const;

/** Lado del cuadrado en píxeles lógicos. SUPUESTO. */
export const SQUARE_SIZE = 16;

/** Velocidad del cuadrado en píxeles lógicos por tick. SUPUESTO. */
export const SQUARE_SPEED = 2;

/** Puntos otorgados por disparo. SUPUESTO: la spec no fija un valor. */
export const SCORE_PER_SHOT = 10;

/** Id del botón de disparo, compartido entre el panel declarado y la lógica. */
export const FIRE_BUTTON_ID = 'fire';

/** Id del sonido de disparo devuelto como SoundEvent. */
export const SHOT_SOUND_ID = 'shot';

/** Etiquetas de los dos temporizadores que este juego existe para ejercitar. */
export const SQUARE_RESET_TAG = 'square-reset';
export const GAME_OVER_TAG = 'game-over';

/**
 * DERIVADO de docs/specs/walking-skeleton.md §3.3: "Un temporizador visible de 10
 * segundos que reinicia el cuadrado al llegar a cero".
 */
export const SQUARE_RESET_TICKS = ticksFromSeconds(10);

/**
 * DERIVADO de docs/specs/walking-skeleton.md §3.6: "Fin de partida a los 60
 * segundos".
 */
export const GAME_OVER_TICKS = ticksFromSeconds(60);
