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

## Estado

M1 en curso: monorepo, verificación mecánica y `@arcade/contracts`.
