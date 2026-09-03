# Estructura del repositorio

**Versión:** 1.0 (propuesta)
**Fecha:** 2026-09-03
**Estado:** pendiente de aprobación
**Documentos superiores:** `constitution.md`, `product-spec.md`, `stack-proposal.md`

---

## 0. Criterio de diseño

La estructura no organiza archivos: **materializa el Artículo 3 de la constitución**. Cada
frontera de la constitución es un límite de paquete, y cada límite de paquete es una regla
que `pnpm` y `dependency-cruiser` pueden hacer cumplir. Además, cada carpeta está pensada
para ser **el ámbito completo de un agente**: un agente trabaja dentro de un paquete, lee su
spec y su `CLAUDE.md`, y no necesita —ni puede— mirar el código de los demás.

## 1. Árbol

```
arcade/
├── docs/
│   ├── constitution.md
│   ├── product-spec.md
│   ├── stack-proposal.md
│   ├── repo-structure.md
│   ├── decisions/                  # registro de decisiones fechadas (ADR ligeros)
│   ├── reference/
│   │   └── consola1.jpg            # referencia visual del mueble
│   ├── research/                   # Art. 1 — investigación previa, una por juego
│   │   ├── space-invaders.md
│   │   ├── pac-man.md
│   │   ├── tetris.md
│   │   └── arkanoid.md
│   └── specs/                      # Art. 2 — specs aprobadas, fuente de verdad
│       ├── core.md
│       ├── shell.md
│       ├── records.md
│       └── games/
│           ├── space-invaders.md
│           ├── pac-man.md
│           ├── tetris.md
│           └── arkanoid.md
│
├── apps/
│   └── arcade/                     # única app desplegable (Vercel)
│       ├── index.html
│       ├── vite.config.ts          # Vite 8 + vite-plugin-pwa
│       ├── public/
│       │   ├── manifest.webmanifest
│       │   └── icons/
│       ├── src/
│       │   └── main.tsx            # monta el shell y le entrega el catálogo
│       ├── CLAUDE.md
│       └── package.json
│
├── packages/
│   ├── contracts/                  # @arcade/contracts — tipos + utilidades PURAS
│   │   ├── src/
│   │   │   ├── game-module.ts      # interfaz que todo juego implementa
│   │   │   ├── input.ts            # estado de entrada normalizado
│   │   │   ├── render.ts           # superficie de dibujo abstracta
│   │   │   ├── audio.ts            # eventos de sonido declarativos
│   │   │   ├── control-panel.ts    # declaración del panel de un juego
│   │   │   ├── scheduler.ts        # temporización por ticks (Art. 3.3)
│   │   │   └── rng.ts              # azar con semilla (Art. 3.2)
│   │   ├── CLAUDE.md
│   │   └── package.json
│   │
│   ├── core/                       # @arcade/core — la plataforma (Art. 3.5)
│   │   ├── src/
│   │   │   ├── loop.ts             # bucle a paso fijo, 60 Hz normalizados
│   │   │   ├── lifecycle.ts        # visibilidad, pausa, cuenta regresiva
│   │   │   ├── input/              # táctil → estado de entrada normalizado
│   │   │   ├── renderer/           # implementación Canvas 2D + escalado entero
│   │   │   ├── audio/              # reproducción, silencio global
│   │   │   ├── records/            # cliente Supabase + cola IndexedDB + reintento
│   │   │   └── haptics.ts          # solo Android, solo controles
│   │   ├── CLAUDE.md
│   │   └── package.json
│   │
│   ├── shell/                      # @arcade/shell — el mueble (Preact)
│   │   ├── src/
│   │   │   ├── cabinet/            # marquesina, bisel, laterales, acento por juego
│   │   │   ├── controls/           # palanca, botón, feedback visual
│   │   │   ├── screens/            # selección, game over, ingreso de nombre, récords
│   │   │   ├── overlays/           # pausa, cuenta regresiva de 3 s
│   │   │   └── theme/              # tokens del mueble (no de los juegos)
│   │   ├── CLAUDE.md
│   │   └── package.json
│   │
│   ├── catalog/                    # @arcade/catalog — registro declarativo de juegos
│   │   ├── src/index.ts            # metadatos + import dinámico de cada juego
│   │   ├── CLAUDE.md
│   │   └── package.json
│   │
│   └── games/
│       ├── space-invaders/         # @arcade/game-space-invaders
│       │   ├── src/
│       │   │   ├── logic/          # PURO: estado, reglas, IA, puntaje
│       │   │   ├── render.ts       # dibuja el estado sobre la superficie
│       │   │   ├── audio.ts        # qué suena y cuándo, en ticks
│       │   │   ├── panel.ts        # declaración de su panel de control
│       │   │   ├── constants.ts    # constantes trazables (VERIFICADO / DERIVADO)
│       │   │   └── index.ts        # implementa GameModule
│       │   ├── assets/             # sprites y sonidos reconstruidos
│       │   ├── test/
│       │   │   ├── replay/         # entradas grabadas + estados esperados
│       │   │   └── *.test.ts
│       │   ├── CLAUDE.md
│       │   └── package.json
│       ├── pac-man/
│       ├── tetris/
│       └── arkanoid/
│
├── tools/
│   ├── eslint-config/              # reglas compartidas + reglas constitucionales
│   └── tsconfig/                   # bases de TypeScript
│
├── supabase/
│   └── migrations/                 # tabla de récords y políticas de acceso
│
├── .dependency-cruiser.cjs         # fronteras del Art. 3, verificadas en CI
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── CLAUDE.md                       # reglas globales para cualquier agente
└── README.md
```

## 2. Grafo de dependencias permitido

```
                        ┌─────────────────┐
                        │  apps/arcade    │
                        └────────┬────────┘
                     ┌───────────┼───────────┐
                     ▼           ▼           ▼
                ┌─────────┐ ┌────────┐ ┌──────────┐
                │  shell  │ │  core  │ │ catalog  │
                └────┬────┘ └───┬────┘ └────┬─────┘
                     │          │           │
                     └──────────┼───────────┘
                                ▼
                        ┌───────────────┐
                        │   contracts   │ ◄──── games/*
                        └───────────────┘
```

**Regla central: los juegos dependen únicamente de `contracts`.** No dependen del núcleo, ni
del shell, ni entre sí. Esto no es estilo: es lo que hace imposible que un juego alcance el
DOM, el reloj o la red, porque no tiene por dónde. `contracts` contiene solo tipos y
utilidades puras (temporizador por ticks, azar con semilla), sin una sola llamada al
entorno.

El núcleo tampoco importa juegos: recibe un `GameModule` ya construido. Quien conecta ambos
mundos es `catalog`, que solo conoce metadatos e imports dinámicos.

| Regla constitucional | Verificación |
|---|---|
| Art. 3.4 · dependencias en una sola dirección | `dependency-cruiser`: prohibido `contracts → *`, `core → games/*`, `games/* → core\|shell` |
| Art. 3.6 · ningún juego importa a otro | `dependency-cruiser`: prohibido `games/A → games/B` |
| Art. 3.1 · lógica sin DOM | ESLint en `games/*/src/logic/**` y `contracts`: prohibidos `window`, `document`, `navigator`, `fetch` |
| Art. 3.2–3.3 · sin azar ni relojes del entorno | ESLint: prohibidos `Math.random`, `Date.now`, `performance.now`, `setTimeout`, `setInterval` |
| Art. 3.8 · el núcleo no conoce juegos | ESLint: prohibidas cadenas de identificador de juego en `core/**` |
| Determinismo | Vitest: `test/replay/` — misma entrada, mismo estado final |
| Pausa completa | Vitest: serializar → restaurar → comparar contra simulación continua |

## 3. Ámbito de cada agente

| Agente | Carpeta | Puede escribir | Nunca toca |
|---|---|---|---|
| Núcleo | `packages/core` + `packages/contracts` | plataforma y contratos | juegos, shell |
| Shell | `packages/shell` + `apps/arcade` | mueble, pantallas, overlays | núcleo, juegos |
| Juego *N* | `packages/games/<juego>` | su lógica, render, audio, panel, tests | todo lo demás |
| Investigación | `docs/research/` | documentos e investigación | **ningún** código |

Cada carpeta lleva su propio `CLAUDE.md` con: qué capa es, qué puede importar, qué tiene
prohibido, dónde está su spec y cuáles son sus criterios de aceptación. Es el mecanismo por
el que un agente con contexto limitado sigue operando dentro de la constitución.

## 4. Convenciones

- **Nombres de paquete:** `@arcade/contracts`, `@arcade/core`, `@arcade/shell`,
  `@arcade/catalog`, `@arcade/game-<juego>`.
- **Idioma:** documentación en español; código, identificadores y comentarios en inglés.
- **Un juego = un paquete.** Agregar el quinto juego es crear una carpeta más y una entrada
  en `catalog`, sin tocar nada más (Art. 3.8).
- **Todo paquete que importe `@arcade/contracts` debe declararlo** en su `package.json`
  como `"dependencies": { "@arcade/contracts": "workspace:*" }`, y correr `pnpm install`.
  TypeScript lo resuelve por `paths` aunque falte, pero **Vitest en tiempo de ejecución
  no**: sin la declaración, los tests fallan al importar. Descubierto por el primer
  consumidor real de los contratos (M1.6); los cuatro juegos tropezarían con lo mismo.
- **Cada agente CLI simultáneo trabaja en su propio worktree de git**, no en la carpeta
  principal: `git worktree add ..\Arcade-<rama> -b <rama> master`, y su propio
  `pnpm install` ahí. Un solo working tree no puede estar en tres ramas a la vez; si dos
  agentes comparten carpeta, sus commits se mezclan entre ramas. Al integrar,
  `git worktree remove`.
- **Los assets viven con su juego.** No hay carpeta global de sprites ni de sonidos.
- **Las constantes van en `constants.ts`**, cada una con su marca `VERIFICADO` o `DERIVADO`
  y su referencia al documento de investigación (Art. 1.4).

## 5. Configuración de despliegue

| Ajuste en Vercel | Valor |
|---|---|
| Root directory | `apps/arcade` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output | `dist` |
| Variables de entorno | URL y clave anónima de Supabase (nunca versionadas) |

## 6. Qué NO existe a propósito

- **Sin carpeta `utils/` global.** Es donde se acumula lo que nadie sabe dónde poner y por
  donde se filtran las dependencias cruzadas.
- **Sin paquete `ui` compartido entre juegos.** Los juegos no comparten presentación: cada
  uno dibuja lo suyo (Art. 3.6).
- **Sin backend propio.** Supabase es el único servidor.
- **Sin carpeta por juego dentro del shell.** Si el shell necesitara saber de un juego
  concreto, el contrato está mal (Art. 3.8).
