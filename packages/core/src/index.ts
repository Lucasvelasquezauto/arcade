/**
 * @arcade/core — la plataforma (Art. 3.5).
 *
 * M1.4 (este cambio): bucle a paso fijo, ciclo de vida y pausa, entrada
 * táctil (docs/specs/core.md §2–§4). Render Canvas 2D, audio, hápticos y
 * récords llegan en agentes posteriores (docs/execution-plan.md).
 */
export * from './loop.js';
export * from './lifecycle.js';
export * from './input/index.js';
