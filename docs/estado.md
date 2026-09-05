# Estado del proyecto

**Actualizado:** 2026-09-04 (tarde) · **Propósito:** traspaso entre hilos orquestadores.

Un hilo orquestador dura **un milestone**, no el proyecto: el historial de una
conversación se reenvía completo en cada mensaje, así que un hilo largo se vuelve caro de
forma acelerada. Este documento existe para que un hilo nuevo retome leyendo el repo y no
la conversación anterior. Si no alcanza, es que el conocimiento se quedó en el chat, que
es exactamente lo que la constitución prohíbe.

**Para retomar, lee en este orden:** `constitution.md` → `product-spec.md` → este archivo
→ `execution-plan.md`. Las specs y la investigación se leen cuando la tarea las necesite.

---

## 1. Dónde vamos

**M1 (esqueleto desplegable) está cerrado del lado técnico.** Existe y funciona:

- `@arcade/contracts`, `@arcade/core` (bucle a paso fijo, ciclo de vida y pausa, entrada,
  render Canvas 2D con escalado entero, audio, hápticos, récords con cola offline,
  diagnóstico), `@arcade/shell` (mueble completo en Preact), `@arcade/catalog`,
  `@arcade/game-test-pattern`, y `apps/arcade` cableando todo.
- Publicado en https://github.com/Lucasvelasquezauto/arcade y desplegado en
  **https://arcade-seven-psi.vercel.app/** (Vercel redespliega solo con cada push a `main`).
- Supabase: proyecto "Arcade" (org "LAV Games"), tabla `scores` con RLS, `client_id`
  único para idempotencia, y `get_top_scores` calculado en servidor. Verificado con una
  escritura real desde producción.
- `pnpm verify` y `pnpm build` pasan en limpio. La prueba negativa muerde: si alguien mete
  un `setTimeout` en la lógica pura o un import cruzado entre juegos, el build falla.

## 2. Lo inmediato

1. ~~Integrar la rama `m2-teclado` en `main`.~~ **Hecho.** Merge limpio (`875c692`),
   `pnpm verify`/`pnpm build` en limpio, push aceptado, rama y worktree borrados.
   Handoff: `docs/handoff/2.2-integracion-m2-teclado.md`.
2. ~~Puerta 1 — validación en PC por el propietario~~ (`specs/walking-skeleton.md` §4.1).
   **Cerrada, con dos salvedades registradas por el propietario:**
   - **Estética (criterio 1): diferida a propósito.** Hoy el mueble es un recuadro sin
     arte — el propietario decide resolverlo más adelante, cuando el resto de la
     funcionalidad esté lista. PEND-05 (`product-spec.md` §13) sigue abierto; no se
     cierra aquí.
   - **Controles/funcionamiento (criterios 2 y 3): aprobados**, con la salvedad de que
     el criterio de "disparo/movimiento responde" solo se pudo probar contra
     `test-pattern` (no hay juego real todavía). Es exactamente lo que
     `walking-skeleton.md` §4.1 ya advierte que esta puerta NO certifica: la sensación
     final se juzga con un juego real (Constitución, Art. 4.2 — el segundo criterio de
     cierre del piloto).
   - Criterio 4 (verificación mecánica) ya estaba confirmado por agente antes de esta
     ronda.
3. **Decisión del propietario (2026-09-04): se invierte el orden.** Puerta 2
   (validación en los tres dispositivos) **se pospone** hasta que Space Invaders funcione
   en PC. Prioridad: cerrar M2 en el entorno donde el propietario puede iterar solo
   (teclado, sin depender del teléfono), y recién entonces atender los tres dispositivos
   —posiblemente ya con Space Invaders puesto, no con `test-pattern`.
   **Fricción registrada, no bloqueante:** `walking-skeleton.md` puso la puerta 2 antes de
   M2 a propósito, para que un fallo de plataforma (PWA, Safari, hápticos) se descubra
   solo, no mezclado con un fallo del juego. Invertir el orden implica que si algo del
   esqueleto falla en los teléfonos, se descubre más tarde y con Space Invaders encima —
   el propietario decide asumir ese riesgo a cambio de no ser el cuello de botella de cada
   iteración mientras el juego se construye. El criterio de cierre del piloto
   (Constitución, Art. 4.2) sigue exigiendo, entre otras cosas, que funcione instalado
   como PWA en Android y como web en iPhone — eso no desaparece, solo se verifica después.
4. **Lo que sigue es M2: Space Invaders**, validado en PC. Ver §3 (actualizada) para el
   siguiente paso concreto.

## 3. M2 — Space Invaders (en curso, prioridad actual)

La investigación ya está hecha: `docs/research/space-invaders.md`, 45 constantes
`VERIFICADO`. Variante elegida por el propietario (2026-09-03): **conversión oficial a
color RGB, opción C del comparador** (romset `sicv` en MAME) — el comparador visual
(2.2/2.3 de `execution-plan.md`) **ya está resuelto**, no es un paso pendiente. Vidas
iniciales 3, vida extra a 1000 puntos — también ya decidido.

**Antes de escribir la spec (2.4) hay que cerrar cuatro huecos de investigación**
(`research/space-invaders.md` §11), los que afectan constantes que van directo a la spec
con trazabilidad (Constitución, Art. 1.4):

1. §11.3 — **paleta exacta por fila** de la opción C. El propietario ya pidió esta
   investigación de cierre explícitamente; es la más urgente.
2. §11.1 — coordenadas X exactas de los 4 escudos y offset Y fila-a-pantalla.
3. §11.2 — dimensiones exactas del sprite del OVNI.
4. §11.5 — confirmar en el desensamblado la condición exacta de "game over" (hoy es
   consenso de fuentes secundarias, no la línea del ROM).

No bloquean la spec (quedan como `SUPUESTO`/deuda registrada si no se cierran): §11.4
(placa de la variante D, no se usa), §11.6 (bug "Nagoya shooting"), §11.7 (colisión
OVNI-escudos).

Hallazgo que no se puede perder: en la opción C **la pantalla se pone roja durante la
explosión del jugador**. No existe en las versiones de celofán.

**Cierre de investigación (2026-09-04):** §11.5 (game over) quedó `VERIFICADO`. §11.1
(escudos) y §11.2 (OVNI) avanzaron pero siguen sin precisión de píxel. §11.3 (paleta) sigue
abierta, sin fuente nueva. **Decisión de Lucas: avanzar con `SUPUESTO` documentado en vez
de seguir investigando** — prioridad es ver el juego andando en PC.

**Spec aprobada:** `docs/specs/games/space-invaders.md` (v1.0, aprobada por Lucas
2026-09-04). Contiene los tres `SUPUESTO` (paleta, escudos, OVNI), aislados en
`constants.ts`/`render.ts` del paquete del juego para que cerrarlos después no toque el
núcleo.

**En curso: 2.5/2.6/2.7 — implementación de Space Invaders**, CLI en
`packages/games/space-invaders`, contra la spec cerrada (ahora v1.2, ver
`docs/specs/games/space-invaders.md`). 2.6 reemplazó las constantes inventadas por las
`VERIFICADO` de research §11.9-§11.10. Lucas probó el resultado (2026-09-05) y reportó "se
ve todo mal" — invasores, nave y escudo no se parecen al original.

**Error registrado (orquestador, 2026-09-05):** la spec nunca exigió el bitmap real de
pixel art de nave/invasores como criterio de aceptación. `render.ts` dibuja nave/invasores/
OVNI con `fillRect` de color sólido porque no existe un atlas de sprites — la
infraestructura para dibujar sprites reales SÍ existe (`DrawSurface.drawSprite`,
`packages/core/renderer/canvas-surface.ts`), solo nunca se le dio contenido. Responsabilidad
del orquestador como autor de la spec, no del CLI (que documentó el placeholder
honestamente, Art. 2.7, en vez de inventar pixel art falso). Bitmaps exactos de nave (1),
invasores (3 tipos × 2 cuadros) y explosión de invasor ya extraídos del mismo `Code.html`
local, sin fuente nueva — ver research §11.11. Falta construir el atlas de sprites real y
conectar `drawSprite` en `render.ts` — hecho en encargo 2.7 (docs/handoff/2.7-space-invaders-sprites.md). Encontro un bloqueo real y correcto: `apps/arcade/src/game-session.ts` construye `CanvasDrawSurface` sin `SpriteAtlas` -> `drawSprite` lanza en el primer frame, pantalla en blanco.

**Decision registrada (orquestador, 2026-09-05):** cablear el atlas como caso especial para Space Invaders en `apps/arcade` (encargo 2.8), no cambiar `GameModule` en `@arcade/contracts` todavia -- eso es lo correcto a mediano plazo pero es cambio de contrato (Art. 2, spec propia) y frena mas de lo que resuelve ahora. Deuda tecnica anotada para cuando haya un segundo juego con sprites que la justifique.

Pendientes no bloqueantes, sin prisa: marquesina e icono definitivos
(`handoff/1.10-infra.md`); aviso de "hay versión nueva" para el service worker
(`handoff/1.13-cierre-m1.md` §5); rotación horaria de Tetris con un solo botón
(`product-spec.md` §2.1) — es de otro juego, no bloquea esto.

## 4. Reglas de operación vigentes

- **El hilo orquestador decide, especifica, integra y revisa. No implementa, no instala,
  no depura.** Ante un fallo, su primera acción es nombrar quién lo arregla, no cómo.
- **El orquestador no ejecuta comandos de git en el repositorio.** El acceso remoto deja
  `.git/index.lock` huérfanos que no puede borrar y que rompen las operaciones de los
  agentes. Lee archivos; las operaciones de git las hacen los agentes.
- **Un worktree por agente simultáneo, siempre dentro de `Arcade\.worktrees\`.** Nada del
  proyecto vive fuera de la carpeta `Arcade`.
- **Máximo 3 agentes activos.** El límite es la atención del propietario, no la técnica.
- **Cada agente deja `docs/handoff/<tarea>.md`.** El propietario solo avisa que terminó;
  el orquestador lee el archivo. Nada de transcribir resultados entre ventanas.
- **Modelo y esfuerzo:** Sonnet para ejecutar contra spec cerrada; Opus para contratos,
  specs, arquitectura y revisión. Esfuerzo **medio por defecto**, **bajo** para lo
  mecánico, **alto** solo cuando la tarea incluye diagnosticar o decidir.
- **Los agentes no abren navegadores.** Los tests automáticos se quedan —son lo que atrapa
  los fallos silenciosos y no cuestan nada al correr—, pero la verificación manual la hace
  el propietario: cada encargo termina con una lista numerada de qué probar, sin repetir lo
  ya probado, y él responde qué funciona y qué no.
- **Credenciales en `.env.local`**, ignorado por git. Ningún agente lo lee ni lo imprime.
