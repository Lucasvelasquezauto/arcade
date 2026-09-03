# @arcade/catalog

**Capa:** registro declarativo — conecta al núcleo con los juegos sin que ninguno de los
dos sepa del otro (`docs/repo-structure.md` §2).

## Qué vive aquí

Metadatos por juego e import dinámico de su `GameModule`. Nada más: ni lógica, ni render,
ni estado propio.

## Qué puede importar

`@arcade/contracts`, y el punto de entrada (`index.ts`) de cada `packages/games/*` —
solo para registrarlo, nunca su carpeta `logic/` ni sus internos.

## Qué tiene prohibido, siempre

Contener lógica de juego, de render o de audio: eso vive en cada juego, nunca aquí. Un
`if` que distinga comportamiento por juego más allá de qué módulo cargar es la lógica de
un juego filtrándose a esta capa.

## Por qué importa

Es el único lugar del repo que conoce a la vez al núcleo y a los juegos, y solo los
conoce como datos: nombre, acento, módulo. Agregar el quinto juego es una entrada más
aquí, nada más (Art. 3.8, `docs/repo-structure.md` §4).

**Spec:** `docs/specs/core.md` (pendiente, cubre el contrato de catálogo) ·
**Constitución:** Art. 3.4, 3.8
