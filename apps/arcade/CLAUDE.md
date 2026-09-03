# apps/arcade

**Capa:** la única app desplegable (`docs/repo-structure.md` §1). Ensambla shell, core y
catalog; no define comportamiento propio.

## Qué vive aquí

Punto de entrada, configuración de build y PWA, manifiesto e iconos. Ver
`docs/repo-structure.md` §1 y §5 (configuración de Vercel).

## Qué puede importar

`@arcade/shell`, `@arcade/core`, `@arcade/catalog`, `@arcade/contracts`.

## Qué tiene prohibido, siempre

Lógica de juego, de render de un juego concreto, o de núcleo: eso vive aguas abajo.
Agregar una dependencia (Vite, `vite-plugin-pwa`, Preact) sin haberla pedido: se declara
en M1, no se instala por su cuenta (`docs/execution-plan.md`).

## Por qué importa

Es donde el monorepo se vuelve una sola página desplegada. Un fallo aquí (compilación en
Vercel, PWA que no instala) es el que más cuesta descubrir tarde
(`docs/specs/walking-skeleton.md` §0).

**SUPUESTO:** el nombre de paquete `@arcade/app` no está fijado en
`docs/repo-structure.md` §4 (que solo nombra `packages/*`); se usa por consistencia con
el resto y para no chocar con el `name` `"arcade"` del `package.json` raíz. A confirmar.

**Spec:** `docs/specs/walking-skeleton.md` · **Constitución:** Art. 3.4, 3.7
