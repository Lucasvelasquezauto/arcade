/**
 * @arcade/core — la plataforma (Art. 3.5).
 *
 * M1.4: bucle a paso fijo, ciclo de vida y pausa, entrada táctil
 * (docs/specs/core.md §2–§4). M1.5: render Canvas 2D con escalado entero,
 * audio y hápticos (§5–§7). M1.9 (este cambio): récords con cola offline y
 * diagnóstico (§8–§9) — con eso packages/core queda completo.
 */
export * from './loop.js';
export * from './lifecycle.js';
export * from './input/index.js';
export * from './renderer/index.js';
export * from './audio/index.js';
export * from './haptics.js';
export * from './connectivity.js';
export * from './records/index.js';
export * from './diagnostics/index.js';
