# Arcade

Compilatorio de juegos arcade de los 80 en web, dentro de un marco tipo maquinita, con tabla
de récords compartida. Uso personal, sin fines comerciales.

## Documentación

La documentación manda sobre el código. En orden de autoridad:

| Documento | Qué define |
|---|---|
| [`docs/constitution.md`](docs/constitution.md) | Principios no negociables. Manda sobre todo. |
| [`docs/product-spec.md`](docs/product-spec.md) | Qué es el producto. |
| [`docs/stack-proposal.md`](docs/stack-proposal.md) | Stack técnico elegido. |
| [`docs/repo-structure.md`](docs/repo-structure.md) | Estructura del repo y fronteras. |
| [`docs/execution-plan.md`](docs/execution-plan.md) | Cómo se ejecuta con agentes en paralelo. |
| [`docs/specs/`](docs/specs) | Specs aprobadas: la fuente de verdad para implementar. |
| [`docs/research/`](docs/research) | Investigación previa por juego. |

## Puesta en marcha

```bash
pnpm install
pnpm verify
```

`pnpm verify` corre tipos, ESLint, dependency-cruiser, tests y la **prueba negativa**: que las
reglas de la constitución efectivamente rompen el build cuando se violan.

## Trabajo en paralelo con worktrees

Para que varios agentes trabajen a la vez sin pisarse, cada rama en paralelo vive en su
propio `git worktree`, y todos van dentro de `.worktrees/` (ignorado por git, ESLint y
vitest — ver `.gitignore`, `eslint.config.js` y `vitest.config.ts`).

```bash
git worktree add .worktrees/<rama> -b <rama> main
cd .worktrees/<rama>
pnpm install   # cada worktree necesita el suyo, node_modules no se comparte
```

Al terminar e integrar la rama en `main`:

```bash
cd ../..                              # volver a la raíz del repo
git worktree remove .worktrees/<rama>
git branch -d <rama>
```

Si `git worktree remove` se niega porque quedan cambios sin committear, no uses `--force`:
son cambios reales, hay que rescatarlos primero.

## Estado

M1 en curso: monorepo, verificación mecánica y `@arcade/contracts`.
