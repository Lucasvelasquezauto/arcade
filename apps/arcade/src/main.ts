/**
 * apps/arcade — punto de entrada de Vite (M1.10, andamiaje desplegable).
 * Monta una página mínima ("ARCADE") sin consumir el shell ni el catálogo:
 * esos llegan en una tarea posterior, sobre otra rama.
 *
 * SUPUESTO: se nombra `main.ts` y no `main.tsx` porque todavía no hay JSX
 * que compilar aquí (el shell en Preact llega después) y el tsconfig
 * compartido no declara la opción `jsx`, que es de alcance de todo el
 * monorepo y no de este paquete. Al integrar el shell, este archivo pasa a
 * `.tsx` junto con el cambio de tsconfig, pedido al hilo orquestador.
 *
 * SUPUESTO: se accede a `document` mediante un cast local a `globalThis`,
 * como hace `packages/core/src/env.ts`, en vez de agregar la lib `dom` al
 * tsconfig compartido — esa lib es global a todo el `tsc` del monorepo y
 * filtraría tipos del DOM hacia la lógica pura de juego (Art. 3.1).
 */

interface MountTarget {
  textContent: string | null;
}

interface DocumentLike {
  getElementById(id: string): MountTarget | null;
}

interface BrowserDocumentGlobal {
  document: DocumentLike;
}

function documentGlobal(): DocumentLike {
  return (globalThis as unknown as BrowserDocumentGlobal).document;
}

const root = documentGlobal().getElementById('app');
if (root) {
  root.textContent = 'ARCADE';
}
