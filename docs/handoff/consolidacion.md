# Handoff — Consolidación del repositorio Arcade

**Fecha:** 2026-09-03 · **Rama:** `main` · **Estado:** completado, sin pendientes bloqueantes.

Consolidación de los tres worktrees de M1 (`m1-shell`, `m1-core-render`, `m1-infra`) en
`main`, publicación en GitHub y reducción del proyecto a una sola carpeta
(`Arcade`), con los worktrees futuros viviendo dentro de ella.

---

## Paso 1 — Trabajo sin committear en cada worktree

Se confirmaron las rutas reales con `git worktree list` antes de tocar nada: los tres
worktrees (`Arcade-m1-shell`, `Arcade-m1-core-render`, `Arcade-m1-infra`) apuntaban
exactamente a las ramas y commits descritos en la tarea.

`git status` en cada uno:

| Worktree | Resultado |
|---|---|
| `Arcade-m1-shell` | `nothing to commit, working tree clean` |
| `Arcade-m1-core-render` | `nothing to commit, working tree clean` |
| `Arcade-m1-infra` | `nothing to commit, working tree clean` |

**No había nada sin committear en ninguno de los tres.** No hizo falta rescatar ni
committear nada en este paso.

---

## Paso 2 — Integración en `main`

Fusionados en el orden pedido, con `--no-ff` para conservar la trazabilidad de cada
milestone:

1. `m1-shell` (mueble del shell en Preact + habilitación de DOM/JSX en
   `tsconfig.base.json`)
2. `m1-core-render` (render Canvas 2D, audio, hápticos)
3. `m1-infra` (`apps/arcade` como PWA)

### Conflictos

**Ninguna de las tres fusiones tuvo conflictos de contenido.** `pnpm-lock.yaml` se
auto-fusionó limpio en las dos fusiones que lo tocaban (`m1-shell` y `m1-infra`) — git
resolvió el merge por sí solo sin marcar conflicto, así que no hizo falta la resolución
manual "toma cualquiera de las dos versiones" prevista en la tarea. `tsconfig.base.json`
no tuvo conflicto porque solo `m1-shell` lo tocaba, tal como se esperaba.

Después de cada fusión se corrió `pnpm install` y `pnpm verify` antes de continuar con
la siguiente rama. Los tres pasaron limpio en cada punto:

- Tras `m1-shell`: 15 archivos de test, 68 tests, 52 módulos en depcruise.
- Tras `m1-core-render`: 19 archivos de test, 102 tests, 61 módulos en depcruise.
- Tras `m1-infra`: 19 archivos de test, 102 tests, 64 módulos en depcruise.

---

## Paso 3 — Verificación del conjunto

`pnpm install` y `pnpm verify` pasaron limpio con las tres ramas integradas.

**`pnpm build` no existía en la raíz.** El `package.json` raíz nunca tuvo un script
`"build"` — solo `apps/arcade/package.json` (agregado por `m1-infra`) tenía uno propio.
Esto no era un conflicto de fusión sino un hueco de orquestación del monorepo, así que
se detuvo el trabajo y se preguntó al propietario cómo resolverlo (no estaba autorizado
a decidirlo por mi cuenta). Se eligió agregar:

```json
"build": "pnpm -r --if-present build"
```

Confirmado que `apps/arcade` compila igual de limpio con y sin el script raíz —el
script solo agrega la orquestación que faltaba, no cambia el resultado del build de
`apps/arcade` en sí. Commit propio: `93a0816`.

### Prueba negativa constitucional

Se insertó temporalmente `setTimeout(() => {}, 0);` dentro de
`packages/contracts/src/time.ts` (`ticksFromFrames`). `pnpm verify` **falló** como se
esperaba:

```
packages\contracts\src\time.ts
  22:3  error  Unexpected use of 'setTimeout'. Art. 3.3 — usa el scheduler por ticks de @arcade/contracts  no-restricted-globals
```

El archivo se restauró exactamente a su estado original (confirmado con `git diff` —
sin cambios pendientes en `time.ts`). La regla constitucional sigue mordiendo después de
integrar las tres ramas; no hay problema de arquitectura que reportar aquí.

---

## Paso 4 — Publicación en GitHub

`origin/main` no tenía commits que `main` local no tuviera (`git fetch` + comparación),
así que el push fue directo, sin necesidad de rebase:

```
b39a6b6..93a0816  main -> main
```

### Verificación de secretos

```
git ls-files | grep -i "env.local\|claude-local"       → sin resultados
git ls-tree -r origin/main --name-only | grep -i "env.local\|claude-local"  → sin resultados
```

**Ningún archivo con credenciales de Supabase o Vercel viajó al remoto.**

---

## Paso 5 — Una sola carpeta

Los tres worktrees se eliminaron con `git worktree remove`, sin necesidad de `--force`
(no hubo modificaciones pendientes que lo impidieran). Las carpetas
`Arcade-m1-shell`, `Arcade-m1-core-render` y `Arcade-m1-infra` ya no existen —
`projects\` contiene únicamente `Arcade`.

Las ramas `m1-shell`, `m1-core-render` y `m1-infra` se borraron con `git branch -d`
(delete seguro: git confirmó que las tres estaban completamente fusionadas en `main`
antes de borrarlas).

---

## Paso 6 — Worktrees futuros dentro de `Arcade\.worktrees\`

- **`.gitignore`**: se agregó `.worktrees/`.
- **`eslint.config.js`**: se agregó `'.worktrees/**'` a `ignores`.
- **Comprobación real, no supuesta**: se creó un worktree de prueba en
  `.worktrees/prueba` (rama `prueba-worktree`, sin `pnpm install` propio) y se corrió
  `pnpm verify` y `pnpm build` desde la raíz:
  - `tsc` y `dependency-cruiser` **no** escanearon `.worktrees/` — sus globs de
    include/scope (`tsconfig.json` → `packages/*/src/**/*.ts` sin `**` inicial;
    `depcruise packages apps` con rutas literales) ya lo excluían implícitamente. No
    hizo falta tocarlos.
  - **`vitest` sí lo escaneó** y falló: recogió los archivos `*.test.ts` dentro de
    `.worktrees/prueba/packages/**` y fallaron porque ese worktree no tenía su propio
    `node_modules` (`Cannot find package '@arcade/contracts'`, etc.). No existía
    `vitest.config.ts` en la raíz — corría con los excludes por defecto de Vitest, que
    cubren `node_modules`, `dist`, `.git`, `.cache`, `.output`, `.temp`, pero no una
    carpeta punteada arbitraria como `.worktrees`.
  - **Ajuste hecho**: se creó `vitest.config.ts` en la raíz con
    `test.exclude` extendiendo los defaults de Vitest más `'.worktrees/**'`.
  - Re-verificado: `pnpm verify` volvió a los mismos 19 archivos / 102 tests / 64
    módulos de antes de crear el worktree de prueba — sin duplicados, sin errores
    nuevos. `pnpm build` también volvió a "Scope: 6 of 7 workspace projects", igual que
    antes.
  - El worktree y la rama de prueba se eliminaron al terminar
    (`git worktree remove .worktrees/prueba` + `git branch -d prueba-worktree`).
- **README.md**: se agregó una sección corta "Trabajo en paralelo con worktrees" con el
  comando de creación (`git worktree add .worktrees/<rama> -b <rama> main`), la nota de
  que cada worktree necesita su propio `pnpm install`, y cómo eliminarlo al integrar.
- Commit propio (`16a1ebd`) y push.

---

## Confirmación final

- `pnpm verify` y `pnpm build` pasan en limpio desde `Arcade\` en el estado final del
  repo.
- La prueba negativa constitucional sigue mordiendo.
- No viajaron credenciales al remoto.
- `projects\` contiene únicamente la carpeta `Arcade`.
- Ramas locales restantes: solo `main`.

## Pendientes / observaciones

- Ninguno de los pasos 1–5 dejó nada a medias.
- El único punto donde se salió del guion original fue el script `build` faltante en
  la raíz (Paso 3): no era un conflicto de fusión previsto por la tarea, así que se
  detuvo el trabajo y se preguntó al propietario en vez de decidirlo por mi cuenta. La
  opción elegida (`pnpm -r --if-present build`) escala sola si en el futuro otro
  paquete del workspace agrega su propio script `build`.
- `vitest.config.ts` es un archivo nuevo, no un ajuste a uno existente — el repo no
  tenía configuración explícita de Vitest antes de este trabajo. Vale la pena que el
  propietario lo revise brevemente por si prefiere una forma distinta de excluir
  `.worktrees/` (por ejemplo, si en el futuro se agrega más configuración de test).
