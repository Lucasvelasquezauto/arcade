/**
 * @arcade/contracts — the base of the dependency graph.
 *
 * Contains the interfaces every layer agrees on, plus the pure utilities that
 * game logic is allowed to use: tick timers and seeded randomness. Nothing here
 * touches the DOM, the network, the clock or storage, and this package depends
 * on no other package in the repo (verified by dependency-cruiser).
 *
 * Games depend on THIS AND NOTHING ELSE (Constitution Art. 3.4).
 */
export * from './time.js';
export * from './rng.js';
export * from './scheduler.js';
export * from './input.js';
export * from './control-panel.js';
export * from './render.js';
export * from './audio.js';
export * from './game-module.js';
