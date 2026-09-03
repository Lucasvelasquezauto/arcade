// Reglas que hacen cumplir la constitución del proyecto.
// Fuente de verdad: docs/constitution.md, Artículo 3 (modularidad).
// Este archivo NO explica las reglas: las aplica. Si algo aquí contradice
// la constitución, la constitución manda y este archivo está mal.

/** Globales del entorno prohibidos en código que debe ser puro (Art. 3.1). */
export const FORBIDDEN_GLOBALS = [
  { name: 'window', message: 'Art. 3.1 — la lógica de juego no conoce el DOM.' },
  { name: 'document', message: 'Art. 3.1 — la lógica de juego no conoce el DOM.' },
  { name: 'navigator', message: 'Art. 3.1 — la lógica de juego no conoce el dispositivo.' },
  { name: 'localStorage', message: 'Art. 3.1 — la lógica de juego no persiste nada.' },
  { name: 'sessionStorage', message: 'Art. 3.1 — la lógica de juego no persiste nada.' },
  { name: 'indexedDB', message: 'Art. 3.1 — la lógica de juego no persiste nada.' },
  { name: 'fetch', message: 'Art. 3.1 — la lógica de juego no conoce la red.' },
  { name: 'XMLHttpRequest', message: 'Art. 3.1 — la lógica de juego no conoce la red.' },
  { name: 'setTimeout', message: 'Art. 3.3 — usa el scheduler por ticks de @arcade/contracts.' },
  { name: 'setInterval', message: 'Art. 3.3 — usa el scheduler por ticks de @arcade/contracts.' },
  { name: 'requestAnimationFrame', message: 'Art. 3.3 — el bucle es del núcleo, no del juego.' },
  { name: 'performance', message: 'Art. 3.3 — sin relojes del entorno; el tiempo entra como ticks.' },
];

/** Propiedades prohibidas: relojes y azar del entorno (Art. 3.2 y 3.3). */
export const FORBIDDEN_PROPERTIES = [
  { object: 'Math', property: 'random', message: 'Art. 3.2 — usa el RNG con semilla de @arcade/contracts.' },
  { object: 'Date', property: 'now', message: 'Art. 3.3 — sin relojes del entorno; el tiempo entra como ticks.' },
  { object: 'performance', property: 'now', message: 'Art. 3.3 — sin relojes del entorno; el tiempo entra como ticks.' },
];

/** Sintaxis prohibida: `new Date()` sin argumentos es un reloj del entorno. */
export const FORBIDDEN_SYNTAX = [
  {
    selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
    message: 'Art. 3.3 — sin relojes del entorno; el tiempo entra como ticks.',
  },
];

/** Bloque de reglas para todo código que debe ser puro y determinista. */
export const pureLogicRules = {
  'no-restricted-globals': ['error', ...FORBIDDEN_GLOBALS],
  'no-restricted-properties': ['error', ...FORBIDDEN_PROPERTIES],
  'no-restricted-syntax': ['error', ...FORBIDDEN_SYNTAX],
};
