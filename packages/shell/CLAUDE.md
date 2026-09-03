# @arcade/shell

**Capa:** presentación — el mueble (Art. 3, capa superior). Usa el núcleo; no es el
núcleo, y no reproduce comportamiento de ningún juego.

## Qué vive aquí

Marquesina, bisel, controles táctiles, pantallas de selección/récords/ingreso de nombre,
overlays de pausa y cuenta regresiva, tokens visuales del mueble. Ver
`docs/repo-structure.md` §1.

## Qué puede importar

`@arcade/core` y `@arcade/contracts`. Nada de `packages/games/*`.

## Qué tiene prohibido, siempre

Importar cualquier cosa de `packages/games/*` (Art. 3.8, regla `shell-to-game` de
dependency-cruiser). Contener código específico de un juego: la paleta, los sprites y la
tipografía *dentro* de la pantalla del juego son del juego, no del shell (Art. 3.7).

## Por qué importa

Es igual para los cuatro juegos. Si el shell necesitara saber de un juego concreto, el
contrato entre capas está mal diseñado, no el shell (Art. 3.8).

**Spec:** `docs/specs/shell.md` (pendiente) · **Constitución:** Art. 3.4, 3.7, 3.8
