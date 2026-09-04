# Plan de ejecución con agentes en paralelo

**Versión:** 1.1
**Estado:** decisiones de integración, paralelismo y modelos tomadas por el propietario (2026-09-03)
**Fecha:** 2026-09-03
**Documentos superiores:** `constitution.md`, `product-spec.md`, `stack-proposal.md`, `repo-structure.md`

---

## 0. Las cinco reglas que gobiernan el paralelismo

**Regla 1 — La investigación paraleliza sin límite; el código no.** El Artículo 4 prohíbe
abrir código de varios juegos a la vez hasta que el segundo juego pruebe el contrato del
núcleo. No prohíbe investigar. Esta es la palanca principal del plan: mientras un solo
agente construye un juego, varios pueden estar investigando los siguientes sin violar nada.

**Regla 2 — Un paquete, un agente, en un momento dado.** El paralelismo se organiza por
carpeta, no por tarea. Dos agentes nunca escriben en el mismo paquete a la vez. Esto elimina
por diseño la mayoría de los conflictos de integración.

**Regla 3 — Máximo 3 agentes activos a la vez.** El límite no es técnico sino de atención:
cada agente activo genera una cola de revisión que termina en ti. La composición estándar es
**uno de código + uno de assets + uno de investigación**. Cuando un cuarto frente esté listo
para arrancar, espera turno en vez de sumarse.

**Regla 4 — Todo agente deja su entrega en un archivo, no en el chat.** Al terminar,
cada agente escribe `docs/handoff/<tarea>.md` con lo que el orquestador necesita para
continuar: qué hizo, qué decidió, sus `SUPUESTO`, sus preguntas abiertas y qué queda
pendiente. El propietario no transcribe resultados entre ventanas: avisa que la tarea
terminó y el orquestador lee el archivo. Un resumen que solo existe en una ventana de chat
se pierde cuando esa ventana se cierra.

**Regla 5 — `contracts/` y `docs/` los toca únicamente el hilo orquestador.**
Excepción: `docs/handoff/` y `docs/research/`, donde cada agente escribe lo suyo. Si cuatro
agentes pueden cambiar las interfaces compartidas, no hay contrato. Un agente que necesita un
cambio en `contracts` **se detiene y lo pide**; no lo hace.

## 1. Dónde vive cada tipo de trabajo

| Superficie | Para qué sirve | Por qué ahí |
|---|---|---|
| **Este hilo (orquestador)** | Decisiones, contratos, specs de arquitectura, integración, revisión cruzada, enmiendas a los documentos | Es el único lugar con la visión completa. Es también el único que escribe en `contracts/` y `docs/`. |
| **Hilos nuevos de Cowork, dentro de este proyecto** | Investigación por juego, comparadores visuales, redacción de specs de juego, reconstrucción de sprites y sonidos, revisión de fidelidad | Heredan las instrucciones y la memoria del proyecto. Tienen web, pueden ver imágenes y pueden conversar contigo, que es lo que la investigación necesita. |
| **Claude Code CLI, abierto en una carpeta concreta** | Implementación dentro de un paquete: código, tests, refactor | Trabaja con el sistema de archivos y ejecuta `pnpm verify`. El `CLAUDE.md` de esa carpeta lo mantiene dentro de su capa. |

## 2. Asignación de modelo

El criterio no es la dificultad aparente sino **cuánto se propaga un error**.

| Trabajo | Modelo | Motivo |
|---|---|---|
| Diseño de contratos e interfaces del núcleo | **Opus** | Un contrato mal diseñado se paga cuatro veces y se descubre tarde |
| Redacción y revisión de specs | **Opus** | La spec es la fuente de verdad; un error aquí se implementa fielmente |
| Bucle, pausa, determinismo, serialización del estado | **Opus** | Errores sutiles que no fallan, solo se sienten raros |
| Decisiones de arquitectura e integración | **Opus** | Se propagan a todo lo demás |
| Revisión de fidelidad contra la investigación | **Opus** | Requiere juicio, no ejecución |
| Investigación: recolectar, comparar y citar fuentes | **Sonnet** | Trabajo de volumen contra fuentes existentes |
| Implementación de un juego contra una spec cerrada | **Sonnet** | El diseño ya está tomado; esto es ejecución disciplinada |
| Shell, pantallas, tabla de récords, mueble | **Sonnet** | UI acotada contra una spec |
| Tests, fixtures de repetición, configuración | **Sonnet** | Mecánico y verificable |
| Reconstrucción de sprites y sonidos | **Sonnet** | Trabajo de detalle contra referencias elegidas |
| Redacción de los `CLAUDE.md` | **Sonnet** | A partir de una plantilla que define Opus |

**Nivel de esfuerzo, además del modelo.** El esfuerzo de razonamiento se pide explícito
al abrir el CLI: **medio por defecto**, **bajo** para trabajo mecánico contra una spec
cerrada (andamiaje, configuración, migraciones), y **alto solo cuando la tarea incluye
diagnosticar o decidir**. No es una economía menor: buena parte de lo que un agente gasta
es razonamiento que la mayoría de las tareas no necesita. Pero los tres hallazgos que más
valieron en M1 —el tick perdido por redondeo, los shims .cmd de Windows, la URL duplicada
de Supabase— salieron de agentes que estaban diagnosticando: ahí el esfuerzo alto se paga.

**Los agentes no abren navegadores.** Los tests automáticos se quedan: corren en
milisegundos, no cuestan nada al ejecutarse, y son lo que atrapa los fallos silenciosos.
La verificación manual, en cambio, es cara y poco fiable en un entorno automatizado —en M1
un agente tuvo que interceptar `requestAnimationFrame` porque su navegador estaba
estrangulado— y el propietario la hace en minutos. Cada encargo termina con una **lista
numerada de qué probar**, sin repetir lo ya probado, y él responde qué funciona y qué no.

Regla práctica: **Opus decide, Sonnet ejecuta, Opus revisa lo que Sonnet decidió sin querer.**
Si un agente Sonnet se topa con una decisión que la spec no cubre, no la resuelve: la marca
como `SUPUESTO` y sigue (Art. 2.7). El hilo orquestador las recoge y las resuelve.

## 3. Momentos

### M0 — Fundación ✔ cerrado

Los cuatro documentos aprobados. Nada más que hacer aquí.

---

### M1 — Esqueleto desplegable

Objetivo: la cadena completa funcionando sin ningún juego real.

| # | Actividad | Dónde | Modelo | Depende de |
|---|---|---|---|---|
| 1.1 | Monorepo, configuración, `pnpm verify`, reglas de dependency-cruiser y ESLint, CI | CLI en raíz | Sonnet | — |
| 1.2 | Plantilla de `CLAUDE.md` + uno por carpeta | Orquestador define, CLI escribe | Opus → Sonnet | 1.1 |
| 1.3 | `contracts`: interfaces, scheduler por ticks, RNG con semilla | **Orquestador** | Opus | 1.1 |
| 1.4 | `core`: bucle a paso fijo, ciclo de vida, pausa, determinismo, tests | CLI en `packages/core` | Opus | 1.3 |
| 1.5 | `core`: entrada táctil, render Canvas 2D, audio, hápticos | CLI en `packages/core` | Sonnet | 1.4 |
| 1.6 | `games/test-pattern` | CLI en su carpeta | Sonnet | 1.3 |
| 1.7 | `shell`: mueble, pantallas, overlays | CLI en `packages/shell` | Sonnet | 1.3 |
| 1.8 | Supabase: tabla, políticas, migración | Hilo Cowork | Sonnet | — |
| 1.9 | `core/records` + cola IndexedDB | CLI en `packages/core` | Sonnet | 1.8 |
| 1.10 | PWA, manifiesto, iconos, despliegue en Vercel | CLI en `apps/arcade` | Sonnet | 1.1 |
| 1.11 | Validación en los tres dispositivos | **Tú** | — | todo |

**Paralelo real en M1 (3 frentes):** tras 1.3, corren a la vez **1.6 (test-pattern)**,
**1.7 (shell)** y **1.8 (Supabase)**. La cadena 1.4 → 1.5 → 1.9 es secuencial porque toda vive en `core`
(Regla 2). 1.10 puede adelantarse en paralelo desde el inicio: un despliegue vacío en Vercel
que solo prueba que el monorepo compila allá.

**Recomendación:** haz 1.10 lo antes posible, aunque despliegue una página en blanco. Es el
punto donde más probablemente falle algo, y falla mejor cuando no hay nada encima.

---

### M2 — Space Invaders (juego piloto)

| # | Actividad | Dónde | Modelo | Depende de |
|---|---|---|---|---|
| 2.1 | Investigación de Space Invaders | Hilo Cowork "Investigación · Space Invaders" | Sonnet | — |
| 2.2 | Comparador visual de variantes a color | Mismo hilo | Sonnet | 2.1 |
| 2.3 | **Eliges la estética** (Art. 1.5) | **Tú** | — | 2.2 |
| 2.4 | Spec del juego, con desviaciones y criterios | Orquestador | Opus | 2.3 |
| 2.5 | Implementación de la lógica pura + tests de repetición | CLI en `packages/games/space-invaders` | Sonnet | 2.4, M1 |
| 2.6 | Sprites y sonidos reconstruidos | Hilo Cowork | Sonnet | 2.3 |
| 2.7 | Render y audio del juego | Mismo CLI | Sonnet | 2.5, 2.6 |
| 2.8 | Revisión de fidelidad contra la investigación | Orquestador | Opus | 2.7 |
| 2.9 | Validación en dispositivos y cierre del Art. 4 | **Tú** | — | 2.8 |
| 2.10 | **Investigación de Pac-Man** | Hilo Cowork aparte | Sonnet | — |

**Paralelo real en M2:** 2.10 corre desde el primer día, junto con todo lo demás. No toca
código, así que no viola el Artículo 4. Y 2.6 (assets) corre en paralelo a 2.5 (lógica) en
cuanto elijas la estética: son dos hilos distintos sobre el mismo juego, sin tocar los mismos
archivos.

---

### M3 — Pac-Man (prueba del contrato)

| # | Actividad | Dónde | Modelo | Depende de |
|---|---|---|---|---|
| 3.1 | Revisión de arquitectura del núcleo (Art. 4.3) | Orquestador | Opus | M2 |
| 3.2 | Generalización del núcleo si hace falta | CLI en `core`/orquestador en `contracts` | Opus | 3.1 |
| 3.3 | Comparador visual + elección | Hilo Cowork → **tú** | Sonnet | 2.10 |
| 3.4 | Spec de Pac-Man | Orquestador | Opus | 3.3 |
| 3.5 | Implementación **sin tocar el núcleo** | CLI en su carpeta | Sonnet | 3.4, 3.2 |
| 3.6 | Assets y sonidos | Hilo Cowork | Sonnet | 3.3 |
| 3.7 | Investigación de Tetris | Hilo Cowork | Sonnet | — |
| 3.8 | Investigación de Arkanoid | Hilo Cowork | Sonnet | — |

**Paralelo real en M3 (3 frentes, con cola):** corren a la vez **3.5 (código de Pac-Man)**,
**3.6 (assets)** y **una** de las dos investigaciones. La otra investigación espera turno: es
la actividad menos urgente de las cuatro, porque su resultado no se necesita hasta M4.
Prioridad: Tetris antes que Arkanoid, porque Arkanoid es el que más desviaciones va a
acumular y conviene investigarlo con el núcleo ya probado tres veces.

**El momento crítico del proyecto es 3.5.** Si Pac-Man obliga a tocar el núcleo, el contrato
estaba mal y se corrige antes de seguir. Es exactamente para eso que existe esta fase.

---

### M4 — Tetris y Arkanoid en paralelo

Se abre solo si 3.5 cerró sin modificar el núcleo.

| # | Actividad | Dónde | Modelo |
|---|---|---|---|
| 4.1 | Specs de Tetris y Arkanoid | Orquestador | Opus |
| 4.2 | Implementación de Tetris | CLI en su carpeta | Sonnet |
| 4.3 | Implementación de Arkanoid | CLI en su carpeta | Sonnet |
| 4.4 | Assets de ambos | Dos hilos Cowork | Sonnet |
| 4.5 | Revisión de fidelidad de ambos | Orquestador | Opus |

**Paralelo real en M4 (3 frentes):** el tope de 3 agentes obliga a elegir. Dos formas de
usarlo, y recomiendo la primera:

- **Tetris completo primero** (código + assets + la investigación pendiente de Arkanoid), y
  Arkanoid después con los tres frentes libres. Cierras un juego a la vez y tu revisión no se
  parte en dos.
- Los dos juegos a la vez con un frente de código cada uno y los assets en cola. Termina antes
  en calendario, pero te deja dos juegos al 80 % y ninguno cerrado.

---

### M5 — Cierre

Turborepo si los builds molestan, nombre y marquesina definitivos (PEND-05), medición final
de 60 fps en los tres dispositivos, y documentación de cómo agregar el quinto juego.

## 4. Cómo se integra el trabajo

**Decidido: rama por paquete, integrada por el hilo orquestador.**

1. **Una rama por paquete**, con el nombre del paquete. Un agente trabaja en su rama y no
   integra su propio trabajo.
2. **`pnpm verify` es la puerta**: tipos, ESLint constitucional, dependency-cruiser y tests.
   Lo que no pasa, no entra. Ningún agente integra su propio trabajo saltándose la puerta.
3. **El hilo orquestador integra.** Es quien ve si dos ramas se contradicen.
4. **Las dependencias se declaran en M1.** Un agente que quiere agregar una librería la pide;
   no la instala. Esto evita el conflicto más molesto del trabajo en paralelo, que es cuatro
   agentes modificando `pnpm-lock.yaml` a la vez.
5. **Si un agente necesita cambiar `contracts`, se detiene.** No lo negocia con otro agente.

## 5. Regla de conducta del orquestador

El hilo orquestador **decide, especifica, integra y revisa**. No implementa, no instala, no
depura: eso es siempre de otro agente.

- **Ante un fallo, su primera acción es nombrar quién lo arregla, nunca cómo se arregla.**
  Autoriza el alcance, fija el criterio de aceptación y dice cómo se verifica.
- **No especifica soluciones que no puede verificar** en la plataforma donde se ejecutan.
  Si el problema es del entorno de otro agente, decide quien puede probarlo.
- La columna "dónde" de cada actividad es **vinculante**. Reasignar se propone antes de
  ejecutar y con aprobación explícita, nunca después.

## 6. Qué le encargas a cada agente

Todo agente arranca con el mismo paquete de encargo, y nada más:

- La ruta de su spec aprobada.
- La ruta de su `CLAUDE.md`.
- Su carpeta, y la frase explícita de que no puede escribir fuera de ella.
- Sus criterios de aceptación.
- La instrucción de marcar `SUPUESTO` y seguir, en vez de decidir en silencio.
- La ruta de su archivo de entrega: `docs/handoff/<tarea>.md` (Regla 4).

Lo que **no** se le da: contexto de otros juegos, decisiones tomadas en otros hilos, ni
"cómo lo hizo el otro agente". Esa información no lo ayuda y sí lo contamina (Art. 2.5).

## 7. Riesgos de este modelo de trabajo

| Riesgo | Mitigación |
|---|---|
| **Tú eres el cuello de botella**, por diseño: eliges estética, apruebas specs y validas en dispositivos. | Tope de 3 agentes activos (Regla 3). Agrupa tus revisiones: es preferible que un agente espere un día a que tú apruebes rápido y mal. |
| **La integración depende de que me la pidas.** Con rama por paquete, el trabajo terminado se queda esperando si nadie lo trae aquí. | Al cerrar cada actividad, tráeme la rama a este hilo. Una rama sin integrar más de un par de días es una señal de que el frente está bloqueado. |
| **Un agente Sonnet decide en silencio** algo que la spec no cubría. | La marca `SUPUESTO` y la revisión de fidelidad por Opus al cierre de cada juego. |
| **Divergencia entre `CLAUDE.md` y la constitución.** | Ningún `CLAUDE.md` repite reglas: las cita y apunta a `constitution.md`. |
| **Conflictos de `pnpm-lock.yaml`** con varios agentes instalando. | Dependencias congeladas en M1; agregar una es una petición, no una acción. |
| **Un juego "casi listo" bloquea la fase siguiente.** | El criterio de cierre está escrito y es binario. No se avanza con un juego al 90 %. |
| **Costo de contexto:** un hilo largo de investigación es caro y se degrada. | Un hilo por juego, que termina cuando entrega su documento. No se reutilizan hilos entre juegos. |
