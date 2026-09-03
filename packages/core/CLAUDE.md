# @arcade/core

**Capa:** núcleo compartido — la plataforma (Art. 3.5). Sirve a los juegos a través de
contratos; ellos nunca lo importan directamente (Art. 3.4).

## Qué vive aquí

Bucle a paso fijo, ciclo de vida y pausa por visibilidad, entrada táctil normalizada,
render Canvas 2D con escalado entero, audio y silencio global, hápticos, cliente de
récords con cola offline. Ver `docs/repo-structure.md` §1 para el árbol completo.

## Qué puede importar

Solo `@arcade/contracts` entre paquetes del repo. Dependencias externas se piden, no se
instalan (ver `CLAUDE.md` raíz).

## Qué tiene prohibido, siempre

Importar cualquier cosa de `packages/games/*` o de `packages/shell`. Ningún condicional
por juego (`if (game === 'x')`): si el núcleo necesitara saber de un juego concreto, el
contrato está mal diseñado, no el núcleo (Art. 3.8). Verificado por dependency-cruiser
(`core-to-game`) y por ESLint en las partes que deban seguir siendo puras.

## Por qué importa

Es la plataforma que los cuatro juegos comparten sin saber unos de otros. Un contrato mal
diseñado aquí se paga una vez por cada juego que lo consume.

**Spec:** `docs/specs/core.md` (pendiente) · **Constitución:** Art. 3.4, 3.5, 3.8, Art. 4
(criterio de cierre del piloto)
