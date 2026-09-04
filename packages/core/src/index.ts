/**
 * @arcade/core — la plataforma (Art. 3.5).
 *
 * M1.4: bucle a paso fijo, ciclo de vida y pausa, entrada táctil
 * (docs/specs/core.md §2–§4). M1.5 (este cambio): render Canvas 2D con
 * escalado entero, audio y hápticos (§5–§7). Récords y diagnóstico llegan en
 * agentes posteriores (docs/execution-plan.md).
 */
export * from './loop.js';
export * from './lifecycle.js';
export * from './input/index.js';
export * from './renderer/index.js';
export * from './audio/index.js';
export * from './haptics.js';
