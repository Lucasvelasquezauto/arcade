/**
 * apps/arcade — mounts the real shell with the real catalog and a real
 * `CoreHandle` (M1.11, "cableado"). Wiring only: no game logic, no
 * game-specific render, and no core logic lives here — this package's
 * CLAUDE.md forbids all three.
 *
 * SUPUESTO (resuelto): M1.10 dejó este archivo como `main.ts` porque el
 * tsconfig compartido todavía no declaraba `jsx`. M1.7 ya agregó `jsx`/
 * `jsxImportSource` a `tsconfig.base.json` con autorización explícita, pero
 * el `include` de `tsconfig.json` (raíz) sigue sin listar `**\/*.tsx` — el
 * mismo hueco que `docs/handoff/1.7-shell.md` documentó para `packages/shell`.
 * Tocar ese `include` es un archivo compartido fuera de mi alcance, así que
 * este archivo sigue en `.ts` con `h()`, igual que el resto del shell.
 */
import { h, render } from 'preact';
import { App } from '@arcade/shell';
import { CATALOG } from '@arcade/catalog';
import { createRealCoreHandle } from './core-handle.js';

const root = document.getElementById('app');
if (root) {
  render(h(App, { catalog: CATALOG, core: createRealCoreHandle() }), root);
}
