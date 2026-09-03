# @arcade/game-test-pattern

**Capa:** lógica de juego (Art. 3, capa base) — pero este juego no reproduce nada real.
Es el banco de pruebas del núcleo, y se queda en el repo permanentemente
(`docs/specs/walking-skeleton.md` §3).

## Qué vive aquí

Un `GameModule` deliberadamente feo que ejercita entrada, panel, puntaje, ticks y pausa,
audio y hápticos. Nunca entra al catálogo de producción.

## Qué puede importar

Únicamente `@arcade/contracts`. Nada de `core`, `shell`, ni de otro juego (Art. 3.4, 3.6).

## Qué tiene prohibido, siempre

DOM, red, `Math.random()`, relojes del entorno (`Date.now`, `setTimeout`,
`performance.now`), e importar cualquier cosa de `packages/games/*` distinto de sí mismo
(Art. 3.1–3.3, 3.6). `src/logic/**` lo verifica ESLint; el resto, dependency-cruiser.

## Por qué importa

Prueba los contratos sin la presión de la fidelidad histórica: si algo aquí se rompe, el
defecto es del núcleo o del contrato, nunca de la regla de un juego de los 80.

**Spec:** `docs/specs/walking-skeleton.md` §3 · **Constitución:** Art. 2.1, 3.1–3.4, 3.6
