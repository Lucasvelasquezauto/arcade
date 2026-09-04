# Estado del proyecto

**Actualizado:** 2026-09-04 · **Propósito:** traspaso entre hilos orquestadores.

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

1. **Integrar la rama `m2-teclado`** en `main`. Está terminada y sin integrar: modo
   teclado en PC, ampliación del mueble a la ventana, y dos correcciones de contrato (la
   política de entrada vuelve al núcleo; el háptico se dispara desde el control del
   shell). Su handoff vive en esa rama, en `docs/handoff/2.1-teclado.md`.
2. **Puerta 1 — validación en PC por el propietario** (`specs/walking-skeleton.md` §4.1).
   Aprueba por separado estética, controles y funcionamiento. **El desarrollo se detiene
   hasta que apruebe.**
3. **Puerta 2 — validación en los tres dispositivos** (§4.2), solo después de la puerta 1.
4. Recién entonces empieza **M2: Space Invaders**.

## 3. M2, cuando llegue

La investigación ya está hecha: `docs/research/space-invaders.md`, 45 constantes
`VERIFICADO`. Variante elegida por el propietario: **conversión oficial a color RGB**
(romset `sicv` en MAME). Vidas iniciales 3, vida extra a 1000 puntos.

**Antes de escribir su spec hay que cerrar la paleta exacta por fila** (§11.3 de la
investigación): se confirmó el hardware RGB de 3 bits pero no qué color lleva cada fila.
El propietario pidió una investigación corta de cierre en vez de aproximarla.

Hallazgo que no se puede perder: en esa variante **la pantalla se pone roja durante la
explosión del jugador**. No existe en las versiones de celofán.

Otros pendientes conocidos, con su fuente: coordenadas X de los escudos y tamaño del
sprite del OVNI (research §11); marquesina e icono definitivos, hoy provisionales
(`handoff/1.10-infra.md`); aviso de "hay versión nueva" para el service worker
(`handoff/1.13-cierre-m1.md` §5); y la decisión de rotación horaria de Tetris con un solo
botón (`product-spec.md` §2.1).

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
