# Propuesta de stack técnico

**Versión:** 1.1
**Fecha:** 2026-09-03
**Estado:** **APROBADO** por el propietario (2026-09-03). Las recomendaciones de §7 son ahora
decisiones vinculantes.
**Documentos superiores:** `constitution.md`, `product-spec.md`

---

## 0. Premisa que condiciona todo lo demás

**El framework no toca el juego.**

La constitución obliga a que la lógica de juego sea TypeScript puro, sin DOM, sin relojes,
sin dependencias (Art. 3.1–3.3). El dibujo ocurre sobre un `<canvas>` conducido por el
bucle a paso fijo del núcleo, fuera del ciclo de render de cualquier framework. Lo que un
framework construye en este proyecto es únicamente:

- el mueble (marquesina, bisel, panel de control),
- los menús y la pantalla de selección,
- la tabla de récords y el ingreso de nombre de 5 caracteres,
- los overlays de pausa y cuenta regresiva,
- el control de silencio.

Es decir: **pantallas estáticas y listas**. Ninguna de ellas está en la ruta crítica de los
60 fps. La consecuencia es incómoda pero importante: la elección de framework **casi no
afecta el rendimiento del producto**. Elegir por rendimiento aquí sería optimizar la parte
que no cuesta.

Lo que sí está en juego es otra cosa: **la probabilidad de que agentes trabajando en
paralelo escriban código correcto sin supervisión línea por línea.** Ese es el criterio
dominante de esta propuesta, y es el que sostiene mi recomendación.

**El riesgo real del framework** no es la velocidad: es que un agente meta el estado del
juego dentro del estado del framework. Ahí sí se rompe todo —determinismo, pausa,
serialización— y se rompe silenciosamente. Se previene con una regla explícita en la spec
del shell y con verificación mecánica (§4), no con la elección de la herramienta.

---

## 1. Framework del shell

| Opción | Runtime | Fiabilidad del código generado por agentes | Ajuste al proyecto |
|---|---|---|---|
| **React 19 + Vite** | ~45 KB gz | **La más alta.** Es, por amplio margen, el framework mejor representado en el entrenamiento de los modelos. Menos API inventada, menos corrección manual. | Sobrado para lo que hay que construir, pero el exceso lo pagas en KB, no en fps. |
| **Preact + Signals** | ~5 KB gz | Alta. Los agentes escriben React y funciona casi siempre; los bordes raros aparecen en librerías de terceros, que aquí casi no hay. | Misma ergonomía a 1/9 del tamaño. |
| **Svelte 5 (runes)** | ~2 KB gz | Media. Los runes son relativamente recientes y los agentes todavía mezclan sintaxis de Svelte 4. | Técnicamente el más elegante para esto: compila a DOM directo, sin runtime que compita con el canvas. |
| **TypeScript puro, sin framework** | 0 KB | Alta en lo simple, baja en lo acumulado: sin un modelo común, cuatro agentes producen cuatro maneras distintas de construir una lista. | Máximo control, máxima disciplina requerida. |

**Recomendación: Preact + Signals.** Da la ergonomía de React —que es lo que los agentes
escriben bien— con un runtime de 5 KB, que en una PWA que debe arrancar sin conexión sí
importa. React 19 es la opción defendible si prefieres eliminar por completo el riesgo de
un borde raro de compatibilidad; el costo son 40 KB que no aportan nada en este producto.

Descartaría Svelte no por calidad —es probablemente la mejor herramienta técnica para el
caso— sino porque el proyecto se ejecuta con agentes en paralelo y la fiabilidad de lo
generado pesa más que la elegancia del resultado.

## 2. Gestor de paquetes

| Opción | Aislamiento entre paquetes | Riesgo |
|---|---|---|
| **pnpm** | **Estricto.** Un paquete solo puede importar lo que declaró. Si el juego A intenta importar el juego B sin declararlo, **falla al instalar o al compilar**. | Ninguno relevante. Maduro y estándar en monorepos. |
| **npm workspaces** | Débil. Todo se aplana en un `node_modules` raíz: cualquier paquete puede importar cualquier cosa que alguien más haya instalado, sin declararla ("dependencias fantasma"). | Las fronteras del Art. 3 quedan como convención, no como hecho. |
| **Bun** | Estricto y muy rápido. | Menos rodaje en la combinación concreta monorepo + PWA + Vercel. Introduce una variable de riesgo donde no hace falta. |

**Recomendación: pnpm.** El argumento no es velocidad: es que **pnpm convierte el Artículo
3 de la constitución en una restricción física**. Con npm, "ningún juego importa código de
otro juego" es una promesa que hay que vigilar; con pnpm, es un error de compilación. En un
proyecto donde escriben varios agentes sin supervisión continua, esa diferencia es la
diferencia.

## 3. Estrategia de monorepo

Una sola app desplegable y varios paquetes internos:

```
núcleo (plataforma)  ─┐
shell (mueble/UI)    ─┼─►  app (única app desplegada en Vercel)
juegos (uno c/u)     ─┘
```

| Opción | Qué agrega | Cuándo vale la pena |
|---|---|---|
| **pnpm workspaces, sin orquestador** | Nada más. Unos pocos scripts en la raíz. | Con 6–8 paquetes y **una** app desplegable, alcanza de sobra. |
| **pnpm workspaces + Turborepo** | Grafo de tareas y caché de builds y tests por paquete. Integración nativa con Vercel (misma empresa). | Cuando los cuatro juegos ya tienen build y suite de tests y esperar la reconstrucción completa molesta. |
| **Nx** | Generadores, grafo, plugins, reglas de dependencia integradas. | Proyectos grandes con muchos equipos. Aquí es peso muerto y una superficie más para que un agente se equivoque. |

**Recomendación: empezar con pnpm workspaces solo, y añadir Turborepo cuando exista el
tercer juego.** Cada herramienta adicional es una forma más de que un agente configure algo
mal. Turborepo se agrega después en ~15 líneas y sin migración; Nx no se quita después.

## 4. Verificación mecánica de la arquitectura

Esta es la parte de la propuesta que más recomiendo y la que menos se suele incluir.

La constitución declara fronteras: la lógica no conoce el DOM, el núcleo no conoce los
juegos, ningún juego importa a otro, nada de relojes del entorno en la lógica. Hoy eso son
frases. Se pueden volver **verificaciones automáticas que fallan el build**:

| Regla constitucional | Cómo se verifica |
|---|---|
| Ningún juego importa a otro juego | `dependency-cruiser` con regla explícita |
| El núcleo no importa ningún juego | `dependency-cruiser` |
| La lógica de juego no toca el DOM | regla de ESLint sobre globales prohibidos (`document`, `window`, `navigator`) |
| Sin relojes ni azar del entorno en la lógica | ESLint: prohibidos `setTimeout`, `setInterval`, `Date.now`, `performance.now`, `Math.random` |
| Determinismo | test de repetición: la misma secuencia de entradas produce el mismo estado final, byte a byte |
| La pausa conserva todo | test: serializar → pausar → restaurar → comparar con la simulación continua |

Sin esto, la constitución depende de que cada agente la recuerde y de que tú revises. Con
esto, un agente que la viole **no puede integrar su código**. Para un proyecto ejecutado por
agentes en paralelo, esto no es un lujo: es el mecanismo de cumplimiento.

## 5. Resto del stack (sin alternativas relevantes)

| Pieza | Elección | Motivo |
|---|---|---|
| Build | **Vite 8** | Estándar actual; estable desde marzo de 2026, con Rolldown (Rust) como bundler unificado. |
| Lenguaje | **TypeScript en modo estricto** | La lógica de juego pura es donde los tipos más rinden. |
| Render | **Canvas 2D** detrás de un contrato del núcleo | Suficiente para cuatro juegos de sprites a 60 fps en móvil. El contrato permite sustituirlo por WebGL si algún juego lo exigiera, sin tocar la lógica. |
| Tests | **Vitest** | La lógica pura se testea con repetición de entradas grabadas, sin navegador. |
| PWA | **vite-plugin-pwa** (Workbox) | Mantenido y estándar para Vite. Genera manifiesto y service worker de caché. |
| Base de datos | **Supabase** (ya en uso) | Una tabla de récords y políticas de acceso. Cliente oficial JS. |
| Despliegue | **Vercel** (ya en uso) | Despliegue directo desde el repo. |
| Cola de récords | **IndexedDB** + reintento propio | Ver §6. |

## 6. Hallazgo técnico que afecta al product-spec

El product-spec (§8) exige que un récord generado sin conexión **se reintente en segundo
plano hasta lograr la escritura**. La API que hace exactamente eso —Background Sync— **no
existe en Safari de iOS, en ninguna versión**; sí está en Chrome de Android. Cobertura
global ~77 %, con Safari fuera en todas sus plataformas.

Consecuencia: el reintento no puede depender de esa API. La implementación debe ser propia:

1. El récord se escribe primero en una cola local en **IndexedDB**, y solo después se
   intenta enviar. La cola es la fuente de verdad hasta que el servidor confirma.
2. La cola se vacía en cada oportunidad real: al abrir la app, al recuperar el foco, al
   volver la conexión (`online`), y tras cada partida.
3. En Android se puede **añadir** Background Sync como mejora oportunista.
4. En iPhone, un récord conseguido sin conexión se sube **la próxima vez que abras la app**.
   No hay forma de que suba con la app cerrada. Esto es una limitación de la plataforma, no
   una decisión de diseño, y debe quedar registrada como tal.

**Propongo enmendar `product-spec.md` §8** para reflejar esto con precisión, en vez de
prometer un comportamiento que iOS no permite.

## 7. Resumen de la propuesta

| Decisión | Elegido | Descartado |
|---|---|---|
| Framework del shell | **Preact + Signals** | React 19, Svelte 5, TS puro |
| Gestor de paquetes | **pnpm** | npm workspaces, Bun |
| Monorepo | **pnpm workspaces**; Turborepo al llegar el tercer juego | Turborepo desde el inicio, Nx |
| Verificación de fronteras | **dependency-cruiser + reglas ESLint + tests de determinismo y de pausa** | Solo TS project references, solo revisión humana |
| Build | **Vite 8** (Rolldown) | — |
| Lenguaje | **TypeScript estricto** | — |
| Render | **Canvas 2D** detrás de contrato del núcleo | WebGL |
| Tests | **Vitest** | — |
| PWA | **vite-plugin-pwa** (Workbox) | — |
| Datos / despliegue | **Supabase + Vercel** (cuentas existentes) | — |
| Cola de récords | **IndexedDB** con reintento propio | Background Sync como única vía (no existe en iOS) |
