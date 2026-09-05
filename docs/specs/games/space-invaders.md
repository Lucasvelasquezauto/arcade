# Spec — `@arcade/game-space-invaders`

**Versión:** 1.2 (revisión 1.1 + cierra velocidad de OVNI en §3.5, tabla literal de
columnas en §5.1.5, duración de explosión de invasor en §6/§8)
**Fecha:** 2026-09-05
**Estado:** aprobada por Lucas (2026-09-04); revisiones 1.1 y 1.2 son correcciones que
hacen la spec MÁS fiel, no cambios de alcance — pendiente de que Lucas confirme que no
hace falta re-aprobar desde cero
**Documentos superiores:** `constitution.md`, `product-spec.md`, `docs/research/space-invaders.md`,
`packages/contracts` (interfaces obligatorias)

---

## 0. Deuda de investigación declarada por adelantado

El propietario decidió (2026-09-04) escribir esta spec y empezar a codificar **antes** de
cerrar todos los huecos de `docs/research/space-invaders.md` §11, priorizando tener el
juego jugable en PC. La primera implementación (M2.5) inventó, además de los tres huecos ya
conocidos, otros que ni la spec ni la investigación cubrían (velocidad del jugador, cadencia
de disparo de invasores, cadencia del OVNI, forma de escudo y OVNI, duraciones de
explosión) — ver `docs/handoff/2.5-space-invaders.md`. El 2026-09-05, con la página completa
de `Code.html` (research §11.9), se cerraron varios de esos huecos con cita exacta. Una
segunda pasada dirigida sobre el mismo archivo (research §11.10) cerró tres más sin gastar
fuente nueva: velocidad del OVNI, tabla literal de columnas de disparo, duración de
explosión de invasor. Estado actual, solo dos huecos "grandes" (puramente visuales, no de
mecánica) siguen `SUPUESTO`, más uno menor (duración de una animación):

- **§10 — paleta exacta por fila** (research §11.3, §11.10.6). Sigue abierta: se
  confirmó que la genera una tarjeta de hardware de color separada ("color board"), no un
  ROM ni el driver principal de MAME — se necesitaría localizar el archivo de video
  específico del árbol de MAME, no intentado a fondo por ser puramente cosmético.
- **§3.4 — coordenada X en pantalla de los 4 escudos** (research §11.1, §11.10.6). Sigue
  abierta por el mismo motivo: requiere la función de rotación VRAM→pantalla del hardware
  de video, no localizada. También puramente posicional/cosmético, no afecta la mecánica.

Ambos puntos son visuales, no de mecánica de juego — no bloquean que el juego funcione ni
se sienta fiel en PC. El tercer `SUPUESTO` menor es la duración del temporizador de
explosión de un disparo de invasor al chocar (§6.4) — mecanismo confirmado, valor de
arranque no localizado.

Resueltos en esta revisión, con cita textual del desensamblado (research §11.9-§11.10):
velocidad del jugador (§3.3), mecanismo y tabla literal de disparo de los invasores (§5.1),
cadencia y velocidad del OVNI (§3.5), bitmap exacto del escudo (§3.4), bitmap exacto del
OVNI (§3.5), duración de explosión de invasor y de OVNI (§6.4).

Cada uno lleva su propio SUPUESTO explícito en la sección correspondiente, con el criterio
usado para elegir un valor de trabajo. Ninguno bloquea empezar a implementar. **Todos
bloquean el cierre del juego piloto** (Constitución, Art. 4.2: sus constantes deben tener
origen documentado antes de darlo por validado) — quedan anotados también en
`docs/estado.md` §3.

---

## 1. Alcance

Este paquete (`packages/games/space-invaders`) implementa `GameModule<SpaceInvadersState>`
completo: lógica pura, dibujo, audio declarativo y panel de control. Depende únicamente de
`@arcade/contracts` (repo-structure.md §2) — nunca de `core`, `shell`, ni de otro juego.

**Versión de referencia canónica:** Taito, 1978, mueble vertical, variante a color
**opción C** — conversión oficial a color RGB (romset `sicv`, mismo hardware de color que
Space Invaders Part II). Decisión vinculante de Lucas, 2026-09-03 (research §1).

**Dentro de alcance:** un jugador, rondas ilimitadas con dificultad creciente hasta el
techo documentado en research §7, escudos persistentes entre rondas, sistema de puntaje
completo incluido el bug del OVNI, sonido reconstruido dirigido por ticks.

**Fuera de alcance, con motivo:**
- **Dos jugadores por turnos** (botones "1 Player"/"2 Player" del original). `product-spec.md`
  §14 excluye multijugador "en cualquier forma"; el original tampoco tenía dos jugadores
  simultáneos, así que esto no es ni siquiera una desviación — el modo de un jugador ES el
  modo original para una partida dada.
- **Ranura de moneda / créditos.** `product-spec.md` §4: al tocar el juego, arranca.
- **Easter egg "TAITO COP"** (research §10, bug 7). Omitido a propósito: solo se activa en
  modo demo con timing frágil incluso en MAME, no afecta la jugabilidad de nadie que jugó
  normalmente.
- **"Nagoya shooting"** (research §10, bug 6). No confirmado contra el desensamblado, solo
  fuente secundaria (`DERIVADO`). Se difiere: no se implementa en esta versión. Si research
  lo cierra como `VERIFICADO` más adelante, se agrega en una revisión de esta spec — no se
  improvisa en código (Art. 2.4).

---

## 2. Resolución y orientación

- **Resolución lógica:** `{ width: 224, height: 256 }` — el `Resolution` que expone el
  `GameModule`. `VERIFICADO` (research §2): VRAM de 256×224 rotada 90° antihorario en el
  mueble, produciendo 224 de ancho × 256 de alto tal como lo ve el jugador. El eje vertical
  ya es el nativo del hardware, no una rotación CSS.
- El núcleo dibuja este lienzo escalado a múltiplos enteros (`core.md` §5); este paquete no
  decide escala ni posición en pantalla, solo dibuja en sus 224×256 lógicos.

---

## 3. Geometría del campo de juego

### 3.1 Formación de invasores

- 5 filas × 11 columnas = 55 invasores, celda de 16×16 px. `VERIFICADO` (research §3).
- Tipo por fila (de arriba hacia abajo) y puntaje asociado — ver tabla completa en §6.1.
- El "invasor de referencia" (el vivo más abajo-a-la-izquierda) ancla la formación; el
  resto se posiciona en relación a él. `VERIFICADO` (research §3). Es la pieza central del
  mecanismo de §4 — no es un detalle cosmético, es lo que hace emerger la aceleración.

### 3.2 Movimiento horizontal

- Paso normal: 2 px por movimiento del invasor de referencia. `VERIFICADO`.
- **Caso especial con 1 solo invasor vivo:** 2 px hacia la izquierda, **3 px hacia la
  derecha**. `VERIFICADO` (research §3). No se codifica como caso especial explícito: debe
  **emerger** de una regla de paso que sea función del estado (ver §4) — si el código
  necesita un `if (aliensAlive === 1)`, la regla real no se entendió.
- Al llegar al borde, la formación desciende **16 px** (un alto de celda) antes de invertir
  el sentido horizontal. `VERIFICADO`.

### 3.3 Límite y velocidad de movimiento del jugador

- El cañón se mueve solo en X, entre `X=48` y `X=217` en coordenadas de pantalla no
  rotada — es decir, en las coordenadas lógicas de este `GameModule` (224 de ancho).
  `VERIFICADO` (research §3).
- **Velocidad: 1 px por tick (60 px/s). `VERIFICADO`** (research §11.9.1: rutinas
  `MovePlayerRight`/`MovePlayerLeft` incrementan/decrementan la coordenada en 1, llamadas
  una vez por tick desde el ISR de mitad de pantalla). Reemplaza el `PLAYER_SPEED` que el
  CLI de M2.5 tuvo que inventar sin fuente — no había ningún valor en la v1.0 de esta spec.

### 3.4 Escudos — forma `VERIFICADO`, posición X ⚠️ SUPUESTO

- 4 escudos, cada uno de 16×22 px. **Bitmap exacto `VERIFICADO`** (research §11.9.4,
  `Code.html` sección "Shield Image", dirección `$1D20`): patrón de bits real, no una
  silueta inventada. `constants.ts` debe usar esta máscara literal (16 columnas × 22 filas)
  como estado inicial de cada escudo, no la forma que `createShieldMask` construyó a mano en
  M2.5.
- **Coordenada X exacta de cada escudo en la pantalla: sigue sin resolver** (research
  §11.9.6 — se confirmó la dirección VRAM `$2806` y el paso de `$02E0`/23 filas entre
  escudos, y que 32 bytes por fila es la cifra consistente [256 px ÷ 8], pero falta la
  convención de rotación fila↔columna del hardware de video para convertir esa dirección en
  un píxel X de la pantalla que usa este `GameModule`).
- **Valor de trabajo, `SUPUESTO`, sin cambios respecto a la v1.0:** distribuir los 4 escudos
  simétricamente en el ancho de 224 px:
  ```
  margen = (224 − 4×16) / 5 = 32
  X[i] = margen × (i + 1) + 16 × i,  para i = 0..3
  X = [32, 80, 128, 176]
  ```
  Y de la fila superior del escudo: `Y = 192`. Se reemplaza en cuanto se resuelva la
  conversión VRAM→píxel, sin tocar el núcleo.

### 3.5 OVNI — tamaño `VERIFICADO`, resuelto

- Aparece en una fila Y fija cerca de arriba, rango de movimiento en X entre `$28` y `$E1`
  (40–225). `VERIFICADO` (research §3).
- **Bitmap exacto `VERIFICADO`** (research §11.9.5, `Code.html` sección "Flying Saucer
  Sprite", dirección `$1D64`): sprite de **8 px de ancho × 24 filas**, con la forma visible
  del platillo ocupando las filas centrales (≈ filas 4–19, 16 de alto) y padding
  transparente arriba/abajo — usar el bitmap completo de 8×24, no solo el recorte visible,
  para que la animación de explosión (`SpriteSaucerExp`, misma dimensión, dirección
  `$1D7C`, también capturada) calce con el mismo marco. Reemplaza el `SUPUESTO` 16×8 de la
  v1.0.
- **Cadencia de aparición: `VERIFICADO`** (research §11.9.3): cada **1536 ticks** (25.6 s a
  60 Hz) desde que el invasor de referencia desciende por debajo de la Y inicial de la
  ronda 1 — el OVNI no puede aparecer antes de que la horda haya bajado al menos una vez.
  Antes de esta revisión no había ningún valor en la spec para esto; el CLI de M2.5 lo tuvo
  que inventar (`UFO_SPAWN_TICKS`).
- **Velocidad horizontal: `VERIFICADO`** (research §11.10.1): **2 px/tick (120 px/s)**.
  La dirección alterna cada reaparición según la paridad de un contador de disparos —
  arranca en X=41 moviéndose a la derecha, o en X=224 moviéndose a la izquierda. Reemplaza
  cualquier valor `SUPUESTO` que el CLI de M2.5 haya inventado.

### 3.6 Regla de fin de vida instantáneo

- Si cualquier invasor alcanza la fila Y del jugador, se pierde la vida de inmediato — no
  espera a que termine la ronda ni a un choque de sprites en el sentido estricto.
  `VERIFICADO` (research §3, §7).

---

## 4. Mecanismo de aceleración de la horda — obligatorio implementarlo así

**No existe una tabla de velocidades ni una curva.** La velocidad aparente de la horda es
un efecto secundario de cuántos invasores se puede redibujar por tick, y hay que
reproducir la causa, no el resultado observado (research §5 — es el punto que Lucas pidió
entender a fondo).

Algoritmo obligatorio, uno por tick de simulación:

1. Mantener el conjunto de invasores vivos en un orden fijo: izquierda→derecha,
   abajo→arriba.
2. Un puntero avanza una posición en ese orden **cada tick**, ciclando.
3. Cuando el puntero cae sobre el "invasor de referencia" (§3.1), ese invasor se mueve
   (§3.2) antes de que el tick termine. El resto de invasores no tiene movimiento propio:
   se redibujan en la posición relativa a la referencia.
4. Con N invasores vivos, una vuelta completa del puntero = N ticks. La velocidad aparente
   es, por construcción, inversamente proporcional a N — sin que el código declare esa
   relación en ningún sitio.

**Explícitamente prohibido:** una tabla `velocidad(nivel)`, una curva interpolada, o
cualquier atajo que produzca el mismo resultado visual sin el mismo mecanismo. Si dos
implementaciones distintas "se ven igual" pero una usa el puntero y la otra una curva
ajustada a ojo, solo la del puntero es válida (Constitución, Art. 1 — fidelidad sobre
conveniencia). La asimetría 2px/3px de §3.2 y el criterio de aceptación de §17.3 existen
para probar que el mecanismo real está implementado, no una aproximación.

La tabla de sonido de pasos (research §4) usa umbrales de invasores vivos distintos y
**no** debe usarse para mover la horda — es un artefacto de diseño de sonido
deliberadamente desincronizado (§9).

---

## 5. Disparos

- **Jugador:** 4 px por tick (240 px/s a 60 Hz). Un solo disparo del jugador activo a la
  vez — un segundo disparo no sale hasta que el primero termina (impacta o sale de
  pantalla). `VERIFICADO` (research §4).
- **Invasores** (tres tipos visuales — rolling, plunger, squiggly, sin diferencia de
  velocidad entre ellos): 4 px cada 3 ticks (80 px/s) en condiciones normales. **Cuando
  quedan 8 invasores vivos o menos, sube a 5 px por tick (100 px/s).** `VERIFICADO`
  (research §4).

### 5.1 Cuándo y cuál invasor dispara — obligatorio implementarlo así

**No es una probabilidad por tick.** La v1.0 de esta spec no cubría esto y el CLI de M2.5
inventó una probabilidad con `Rng` — reemplazar por el mecanismo real, `VERIFICADO`
(research §11.9.2):

1. Los tres disparos de invasor (rolling, plunger, squiggly) comparten un **puntero
   determinista a una tabla de columnas**: cada vez que uno de los tres necesita un
   disparo nuevo, toma la siguiente columna de la tabla (no al azar) y busca el invasor
   vivo más bajo de esa columna. Si esa columna no tiene invasores vivos, ese turno no
   dispara.
2. Antes de iniciar un disparo nuevo, se compara cuántos ticks llevan corriendo LOS OTROS
   DOS disparos activos contra una **tasa de recarga** — si alguno de los otros dos lleva
   menos ticks que esa tasa, no se dispara todavía (evita que los tres disparos avancen
   pegados unos a otros).
3. La tasa de recarga depende del puntaje del jugador activo (tabla exacta):

   | Puntaje ≤ | Tasa de recarga (ticks) |
   |---|---|
   | 512 (`0x0200`) | 48 |
   | 4096 (`0x1000`) | 16 |
   | 8192 (`0x2000`) | 11 |
   | 12288 (`0x3000`) | 8 |
   | mayor | 7 |

4. Tras morir el jugador, el disparo de invasores queda deshabilitado **48 ticks** antes de
   reactivarse (ya cubierto indirectamente por la mecánica de reaparición, pero era un
   número que la v1.0 no daba).
5. **Tabla literal de columnas: `VERIFICADO`** (research §11.10.2, `Code.html`
   `ColFireTable`, dirección `$1D00`). Bytes exactos (índice → columna 1-11):
   ```
   índice: 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F 10 11 12 13 14
   valor:  01 07 01 01 01 04 0B 01 06 03 01 01 0B 09 02 08 02 0B 04 07 0A
   ```
   El disparo "plunger" usa un puntero cíclico e independiente sobre los índices
   0x00–0x0F; el "squiggly" usa un puntero cíclico e independiente sobre 0x06–0x14 (se
   superponen en índices 0x06–0x0F, cada uno con su propio puntero). El "rolling" no usa
   esta tabla — apunta directo a la columna del jugador. Reemplaza el orden inventado de la
   v1.1.

---

## 6. Puntaje

### 6.1 Por tipo de invasor

| Fila (arriba→abajo) | Tipo | Puntos | Confianza |
|---|---|---|---|
| 1 (superior) | pequeño ("squid") | 30 | `VERIFICADO` |
| 2–3 | mediano ("crab") | 20 | `VERIFICADO` |
| 4–5 (inferior) | grande ("octopus") | 10 | `VERIFICADO` |

### 6.2 OVNI — incluye un bug real, replicar tal cual

- Tabla interna de 16 valores (×10 para el puntaje real): `100, 50, 50, 100, 150, 100, 100,
  50, 300, 100, 100, 100, 50, 150, 100, 50`. `VERIFICADO` (research §6).
- El puntero de esta tabla avanza **con cada disparo del jugador**, no con cada OVNI.
- **Bug a replicar:** el puntero da la vuelta cada **15** valores, no cada 16, aunque la
  tabla tiene 16 entradas — el índice 15 (el 300) nunca se vuelve a alcanzar por el camino
  "natural" de 16 en 16. Efecto medible: el valor de 300 aparece en el disparo **8** (ciclo
  inicial) y luego cada **15** disparos. `VERIFICADO` (research §6). **No "corregir" el
  bounds-check** — implementar el avance de índice módulo 15, no módulo 16, es el
  comportamiento correcto de esta spec, no un error a arreglar. Criterio de aceptación en
  §17.4.

### 6.3 Vidas y vida extra — decisión de producto, ya tomada

- Vidas iniciales: **3**. Vida extra a **1000 puntos**. Ambos eran DIP switches del
  hardware original (research §7, §6) — Lucas ya decidió el default (`docs/estado.md` §3);
  se codifican como constantes fijas, no como opción expuesta en la UI (fuera de alcance:
  no hay pantalla de configuración).

### 6.4 Duración de animaciones de explosión

- **Invasor destruido: `VERIFICADO`** (research §11.10.3). El sprite de explosión se
  muestra **16 ticks (0.267 s)** antes de remover el invasor definitivamente.
- **OVNI destruido: `VERIFICADO` en duración total, `DERIVADO` en el desglose interno**
  (research §11.10.4). La secuencia completa (explosión → cambio a puntaje → remoción) dura
  **32 ticks (0.53 s)** desde el impacto.
- **Disparo de invasor al chocar con jugador/escudo: sigue `SUPUESTO`, sin resolver**
  (research §11.10.5). Se confirmó el mecanismo (dibuja el sprite de explosión en un tick
  concreto del temporizador) pero no el valor de arranque del temporizador. Usar un valor
  de trabajo corto (4-6 ticks) hasta que se localice el dato exacto — no bloquea implementar.

---

## 7. Progresión de rondas

- **Posición Y inicial de la horda por ronda** (research §7, `VERIFICADO`):

  | Ronda | Y inicial |
  |---|---|
  | 1 | 120 (`$78`) |
  | 2 | 80 (`$50`) |
  | 3–5 | 72 (`$48`) |
  | 6–8+ | 64 (`$40`) |

  A partir de la ronda 7 la horda arranca justo encima de los escudos y la cadencia de
  disparo alcanza su máximo (ya cubierto por la regla de §5 de "≤8 invasores" y por el
  propio Y inicial) — no hay una ronda 9+ más difícil todavía: el juego original toca techo
  aquí.
- **Los escudos NO se regeneran entre rondas.** El daño se conserva de una ronda a la
  siguiente. `VERIFICADO` (research §7). Es fácil de implementar mal "por conveniencia"
  redibujando escudos intactos en cada ronda nueva — eso sería una desviación silenciosa
  prohibida por el Art. 1.6. Criterio de aceptación en §17.5.
- **El puntaje no se reinicia entre rondas.** Acumulación continua. `VERIFICADO`.

---

## 8. Escudos — daño

- **Mecanismo:** superposición de sprites, no un patrón de daño precomputado. Cuando un
  disparo impacta algo, se dibuja una explosión breve; donde esa explosión se superpone al
  escudo, ese punto del escudo se borra. Aplica igual a disparos que suben (jugador) y que
  bajan (invasores) — mismo mecanismo, sin lógica separada por dirección. `VERIFICADO`
  (research §8). Representarlo en el estado como una máscara de píxeles/bits por escudo
  (16×22), no como "niveles de daño" discretos.
- **Colisión OVNI↔escudos:** se asume que no interactúan (el OVNI vuela por encima de la
  formación, fuera del alcance Y de los escudos). No confirmado explícitamente por ninguna
  fuente — research §11.7, pregunta abierta de baja prioridad, no bloqueante. No
  implementar colisión OVNI-escudo.

---

## 9. Fin de partida

- Condición exacta, `VERIFICADO` (research §7, cierre §11.5): vidas del jugador activo = 0.
  Se llega ahí por "fin de vida instantáneo" (§3.6) o por ser alcanzado por un disparo
  enemigo. `readStatus(state)` devuelve `'over'` en ese momento, nunca antes.
- No hay pantalla de "game over" propia del juego — eso es del shell (`product-spec.md`
  §4); este módulo solo expone el estado.

---

## 10. Paleta — ⚠️ SUPUESTO, variante C

- **Confirmado (`VERIFICADO`, research §1.1):** hardware RGB de 3 bits (máximo 8 colores),
  generado electrónicamente — no una imagen a color libre. Durante la animación de
  explosión del jugador, **toda la pantalla que no es negro se pone roja** — efecto
  exclusivo de esta variante (no existe en las de celofán). **Obligatorio replicarlo**: es
  un detalle de fidelidad fácil de omitir por no ser obvio en una comparación estática.
- **No confirmado:** asignación exacta de color por fila de invasores.
- **Valor de trabajo, `SUPUESTO`** (research §1, recomendación explícita): bandas de borde
  duro (no degradado, a diferencia del celofán físico), replicando la misma distribución
  documentada para la variante A:

  | Elemento | Color | Estado |
  |---|---|---|
  | OVNI, texto superior | rojo | `SUPUESTO` |
  | Fila 1 de invasores (squid) | rojo | `SUPUESTO` |
  | Filas 2–3 (crab) | blanco | `SUPUESTO` |
  | Filas 4–5 (octopus) | blanco | `SUPUESTO` |
  | Escudos | verde | `SUPUESTO` |
  | Cañón del jugador, puntaje inferior | blanco | `SUPUESTO` |
  | Pantalla completa durante explosión del jugador | rojo | `VERIFICADO` |

  Esta tabla vive aislada en `render.ts`/`constants.ts` de este paquete — reemplazarla por
  la paleta real (cuando research cierre §11.3, vía código de MAME o una captura de `sicv`)
  es un cambio de un solo archivo, no de arquitectura.

---

## 11. Audio (reconstruido, dirigido por ticks — `core.md` §6)

- **Marcha de 4 tonos que acelera** con la horda. Tabla de cadencia por invasores vivos
  (research §4, `VERIFICADO`) — usar como *velocidad del sonido*, nunca como velocidad de
  movimiento (§4 de esta spec ya lo advierte: son artefactos independientes y
  deliberadamente desincronizados en el original).
- Disparo del jugador: sonido corto al disparar.
- Explosión: invasor, jugador, OVNI — tres sonidos distintos.
- OVNI: sonido en bucle (`SoundEvent` de tipo `loop`) mientras está en pantalla.
- Todo emitido como `SoundEvent[]` devuelto por `step()` — nunca reproducido directamente
  desde la lógica (Art. 3.3; `contracts/audio.ts`).

---

## 12. Panel de control

`product-spec.md` §3.1 y §6 ya fijan el panel — sin desviación:

```ts
panel: {
  stick: 'horizontal',
  buttons: [{ id: 'fire', label: '', color: 'red' }],
}
```

- El original es una palanca de 2 posiciones sin resorte, todo-o-nada — coincide
  exactamente con `Axis` (-1/0/1) del contrato, sin necesidad de umbral analógico
  (research §9: "no hay velocidad analógica que preservar, el original es binario").
- Modo teclado (`product-spec.md` §2.1): `A`/`D`/flechas ↔ palanca, `L` ↔ `fire`. Ya
  resuelto por el núcleo y el shell (M2.1) — este paquete no hace nada especial para
  soportarlo, solo lee `InputState` normalizado.
- Un disparo del jugador activo a la vez ya lo impone la lógica del juego (§5); el panel no
  necesita imponer un límite propio de toques.

---

## 13. Bugs y comportamientos a replicar — tabla de decisión

| # | Comportamiento | Decisión | Motivo |
|---|---|---|---|
| Aceleración de la horda | Mecanismo de §4 | **Implementar tal cual** | Es el corazón del juego; sin él no es fiel. |
| Asimetría 2px/3px con 1 invasor | §3.2 | **Debe emerger** del mecanismo de §4 | No es un caso especial, es consecuencia directa. |
| Bug de colisión escudo↔invasor en el giro | research §10.2 | **Replicar** — calcular el índice fila×11+columna sin acotar límites, igual que el original | Bug real del original, `VERIFICADO`; omitirlo es desviación silenciosa. |
| Bug del puntaje OVNI (ciclo 15) | §6.2 | **Replicar** | Comportamiento buscado activamente por jugadores expertos. |
| Desfase sonido de pasos / movimiento real | §11 | **Replicar** (emerge de no acoplar ambas tablas) | Parte de cómo sonaba el original. |
| "Nagoya shooting" | research §10.6 | **Diferir** — no implementar en esta versión | Solo `DERIVADO`, no confirmado contra el desensamblado (Art. 1.3). |
| Easter egg "TAITO COP" | research §10.7 | **Omitir** | Curiosidad de depuración de fábrica, no parte de jugar normalmente. |

---

## 14. Constantes trazables

Cada constante numérica en `constants.ts` debe citar su sección de este documento (que a su
vez cita `research/space-invaders.md`) y su marca de confianza — `VERIFICADO`, `DERIVADO` o
`SUPUESTO` — igual que exige Constitución Art. 1.4. No se aceptan números "mágicos" sin esa
trazabilidad, incluidos los `SUPUESTO` de esta spec (§3.4 posición X de escudos, §10
paleta, §6.4 duración de explosión de disparo de invasor): están documentados, no son
deuda oculta.

---

## 15. Desviaciones registradas (Constitución, Art. 1.6)

1. **Paleta por fila (§10), coordenadas de escudos (§3.4) y tamaño del OVNI (§3.5):**
   `SUPUESTO`, no verificados contra el hardware — deuda declarada en §0, no bloquea
   codificar, sí bloquea el criterio de cierre del juego piloto (Art. 4.2).
2. **"Nagoya shooting" no implementado** (§13) — no confirmado con fuente primaria.
3. **Easter egg "TAITO COP" omitido** (§13) — deliberado, no afecta jugabilidad.
4. **Sin dos jugadores por turnos** (§1) — coherente con `product-spec.md` §14, no es una
   pérdida de fidelidad del juego en sí.
5. **Simulación normalizada a 60 Hz** — ya registrada como desviación global en
   `product-spec.md` §10, no se repite el análisis aquí; el original corría a ~59.5 Hz.

---

## 16. Criterios de aceptación verificables (Art. 2.3)

Automatizados (Vitest, `test/replay/` y `test/*.test.ts`), salvo el punto 9:

1. **Determinismo:** una secuencia de entradas grabada + semilla fija produce siempre el
   mismo estado final tras N ticks (test de repetición).
2. **Pureza:** `packages/games/space-invaders/src/logic/**` no importa `window`,
   `document`, `navigator`, `fetch`, y no usa `Math.random`, `Date.now`,
   `performance.now`, `setTimeout`, `setInterval` — verificado por el ESLint constitucional
   ya vigente en el repo (`repo-structure.md` §2), no requiere test propio adicional.
3. **Mecanismo de aceleración:** con N invasores vivos, una vuelta completa del puntero de
   §4 tarda exactamente N ticks — verificado con N = 55, 27, 8, 1.
4. **Asimetría del último invasor:** con exactamente 1 invasor vivo, se mueve 2 px hacia la
   izquierda y 3 px hacia la derecha, sin código de caso especial dedicado (se verifica que
   la regla general produce esto, no que exista un `if`).
5. **Bug del puntaje del OVNI:** tras 8 disparos del jugador el valor es 300; tras 23 (8 +
   15) vuelve a ser 300; tras 16 (el ciclo "natural" de 16) NO es 300.
6. **Persistencia de daño de escudos entre rondas:** dañar un escudo, limpiar la ronda
   (matar los 55 invasores), y verificar que el daño sigue presente al iniciar la ronda 2.
7. **Fin de vida instantáneo:** un invasor que alcanza la fila del jugador reduce las vidas
   de inmediato, sin depender de que termine la ronda.
8. **Fin de partida:** `readStatus(state) === 'over'` si y solo si vidas del jugador = 0.
9. **Snapshot/restore:** `snapshot()` → `restore()` reproduce un estado idéntico,
   incluidos todos los temporizadores pendientes (marcha del sonido, cooldowns, animación
   de explosión) — mismo test genérico que exige `core.md` para la pausa, corrido contra
   este juego.
10. **Manual, por Lucas, no automatizable (Art. 1.5):** el juego es reconocible como Space
    Invaders. No es un criterio de este documento — es parte del cierre del juego piloto
    (Constitución, Art. 4.2) y de las puertas de `walking-skeleton.md` aplicadas a este
    juego. No se marca aquí como aceptado hasta que Lucas lo confirme jugándolo.

---

## 17. Prohibiciones

- No importar nada de `@arcade/core` ni `@arcade/shell` — solo `@arcade/contracts`
  (`repo-structure.md` §2, verificado por `dependency-cruiser`).
- No importar código de otro juego, nunca (Constitución, Art. 3.6).
- Sin `Math.random()` en la lógica — todo azar (si lo hay; esta spec no identificó ninguno
  necesario más allá del propio hardware, que tampoco lo usa) pasa por `Rng` de
  `@arcade/contracts`.
- Sin relojes del entorno en la lógica — toda temporización vía `Timers`/`schedule` de
  `@arcade/contracts`.
- `draw()` no muta el estado ni decide nada — dos llamadas con el mismo estado producen el
  mismo dibujo.
- `step()` no tiene efectos secundarios fuera de lo que retorna en `TickResult` (estado +
  sonidos).
