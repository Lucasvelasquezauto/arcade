# Investigación — Space Invaders

**Estado:** paso 1 y paso 2 completos. Lucas eligió la **opción C** del comparador
(2026-09-03) — ver §1. Cierre de las preguntas abiertas de §11 (2026-09-04): **§11.5
(condición de game over) resuelta y VERIFICADA**. **Cierre ampliado (2026-09-05, ver §11.9):**
Lucas descargó la página completa de `Code.html` (bloqueada para el fetch automático de este
hilo) y con ella se resolvieron, con cita exacta: **velocidad del cañón del jugador**,
**mecanismo real de disparo de los invasores** (tabla determinista, no probabilidad),
**bitmap exacto del escudo** (§11.1, ya no `SUPUESTO` — la FORMA; la posición X en pantalla
sigue abierta), **bitmap exacto del sprite del OVNI** (§11.2, resuelto por completo), y
**cadencia de aparición del OVNI**. **§11.3 (paleta exacta por fila) sigue abierta** — no
está en `Code.html`, vive en el driver de video de MAME, no revisado en esta pasada.
**Versión de referencia canónica:** Taito, 1978, mueble vertical (decisión ya tomada,
`product-spec.md` §3.1). Variante a color: **elegida — opción C, conversión oficial a
color RGB** (Taito "Space Invaders Color" / mismo generador de color que Space Invaders
Part II). Comportamiento VERIFICADO del Taito 1978; paleta DERIVADO con confianza media
(existencia y parentesco del hardware confirmados, asignación exacta de color por fila aún
sin fuente primaria — ver §1 y §11.3).
**Implementación de referencia elegida:** ninguna reimplementación completa se usó como
fuente principal en esta pasada — la fuente (a) (desensamblado comentado) cubrió todo lo
necesario. Si una fase posterior necesita rellenar un hueco, la implementación de
referencia recomendada es el driver `invaders` de **MAME** (mamedev/mame,
`src/mame/misc/8080bw.cpp`), por ser la reimplementación completa, versionada y más citada
del hardware Taito 8080bw. Queda declarada aquí para que quien complete huecos la use y la
cite, no otra.
**Fuente primaria principal:** computerarcheology.com — desensamblado público comentado del
ROM original de Taito (fuente (a), la de mayor peso según Constitución Art. 1.3).

---

## 1. Comparador visual de variantes a color — PASO 1, resuelto

Publicado como artifact: cuatro opciones (A, B, C, D), cada una con paleta, procedencia y
nivel de confianza. Resumen de las opciones (el detalle completo, con fuentes, vive en el
artifact — no se duplica aquí para no desincronizarse):

| Opción | Qué es | Paleta | Confianza |
|---|---|---|---|
| A | Taito Japón 1978, monitor B/N + celofán | magenta arriba, blanco medio, verde abajo (con corte de una línea) | Comportamiento VERIFICADO, celofán DERIVADO |
| B | Midway EE.UU. 1978, mismo tablero + celofán distinto | naranja arriba, verde abajo más corto (solo 3 vidas) | Comportamiento VERIFICADO, celofán DERIVADO |
| **C ← elegida** | Conversión oficial a color RGB (Taito Color / Part II) | ver detalle abajo | DERIVADO, confianza media — existencia y parentesco de hardware VERIFICADO, paleta exacta por fila aún abierta |
| D | Bootleg/clon sin identificar — la foto `consola1.jpg` de Lucas | azul uniforme en invasores, verde en cañón y línea base, texto azul/cian | DERIVADO por observación directa — sin PCB identificado |

**Decisión de Lucas (2026-09-03):** opción **C**, por ser la más cercana a su recuerdo en
cuanto a paleta de color. Registrado como vinculante (Constitución, Art. 1.5). Aclaración
hecha y confirmada con Lucas: las siluetas del comparador son una reconstrucción genérica
de 8×8 píxeles hecha para esta comparación, **no el bitmap real de los invasores** — la
fidelidad del sprite es un problema de investigación aparte, pendiente de los datos de ROM
(no bloquea esta decisión de paleta).

### 1.1 Lo que se confirmó después de elegir C

Después de que Lucas eligiera, se encontró una fuente mejor que el hilo de foro usado para
construir la opción del comparador:

- El propio **MAME** documenta esta variante como el conjunto de ROM `sicv`
  ("**S**pace **I**nvaders **C**olor **V**ersion"), fabricante Taito, y describe que **usa
  el mismo monitor de color y la misma placa generadora de color que Space Invaders Part
  II** — es decir, C y "Space Invaders Part II" comparten hardware de color, no son dos
  variantes distintas sino la misma solución de color aplicada a dos juegos del mismo
  fabricante. `VERIFICADO` — [MAME driver database, arcadeitalia.net, ficha `sicv`](https://adb.arcadeitalia.net/dettaglio_mame.php?game_name=sicv&lang=en) (mirror de la base de datos de MAME, que a su vez es la implementación de referencia declarada en el encabezado de este documento).
- Configuración de paleta en el driver: `PALETTE(config, m_palette, palette_device::RBG_3BIT)`
  — RGB de 3 bits, es decir, **8 colores posibles como máximo**, generados electrónicamente
  por la placa, no una traducción software de una imagen a color libre. `VERIFICADO` —
  código fuente de MAME (`src/mame/midw8080/8080bw.cpp`, mamedev/mame, rama `master`).
- **Detalle de comportamiento confirmado, no solo estético:** durante la animación de
  explosión del cañón del jugador al morir, **toda la pantalla que no es negro se pone
  roja** — un efecto que no existe en las variantes de celofán (A/B) porque ahí el color es
  físico y no puede reaccionar al estado del juego. `VERIFICADO` — misma fuente MAME/
  arcadeitalia. **Recomendación: replicar este efecto** — es un detalle de fidelidad
  exclusivo de la variante elegida, fácil de omitir por no ser obvio a simple vista en el
  comparador.
- **Lo que sigue sin confirmarse con fuente primaria:** la asignación exacta de color por
  fila de invasores (¿reproduce las mismas bandas rojo/blanco/verde del celofán pero con
  bordes duros en vez de degradado, o usa una paleta distinta por fila?). No se localizó la
  función de paleta ni una captura de pantalla real accesible en esta pasada — ver §11.3.

**Recomendación para la spec:** fijar la paleta de C usando, como aproximación de trabajo,
las mismas bandas documentadas para el overlay de celofán (magenta/rojo arriba, blanco en
medio, verde abajo — como en la opción A, que sí tiene banda documentada con fuente),
pero con bordes duros en vez de degradado de celofán, **marcada explícitamente como
`SUPUESTO`** hasta confirmar contra una captura real de `sicv` o el código de paleta
completo de MAME. No inventar una paleta distinta sin dejarlo igual de trazable.

---

## 2. Resolución, orientación y refresco

- **Resolución nativa:** 256×224 píxeles. `VERIFICADO` — computerarcheology.com, *Hardware*
  (RAM de video 2400–3FFF = 256×224÷8 = 7168 bytes, coincide con el cálculo).
- **Orientación del monitor:** el tablero genera la imagen en horizontal pero el monitor
  físico está **rotado 90° en sentido antihorario dentro del mueble**, produciendo una
  pantalla vertical de facto (224 de ancho × 256 de alto en la orientación que ve el
  jugador). `VERIFICADO` — computerarcheology.com, *Hardware* y *Code* ("rotated in the
  cabinet 90 degrees counter-clockwise").
- **Refresco:** 60 Hz, con dos interrupciones de video por frame: una a mitad de pantalla
  (línea de barrido ≈96, `RST 1`) y otra al final de pantalla (`RST 2`). `VERIFICADO` —
  computerarcheology.com, *Code*.
- **Profundidad de color del tablero:** 1 bit (blanco/negro puro). El color es
  responsabilidad del overlay o del hardware adicional, nunca del tablero de video en sí
  salvo en la variante C. `VERIFICADO` — computerarcheology.com, *Hardware*.
- **Reloj de CPU:** Intel 8080 a 1.9968 MHz. `VERIFICADO` — arcade-history.com, ficha
  técnica.

**Implicación para el núcleo:** el canvas del juego debe tratarse como 224×256 lógicos
(alto > ancho, vertical nativo), no como un juego horizontal rotado por CSS — coincide con
la orientación vertical fija que exige `product-spec.md` §2.

---

## 3. Geometría del campo de juego (en píxeles del original)

- **Formación de invasores:** 5 filas × 11 columnas = 55 invasores. Cada invasor ocupa una
  celda de **16×16 píxeles**. `VERIFICADO` — computerarcheology.com, *Code*.
- **Tipos de invasor por fila** (de arriba hacia abajo): fila superior = tipo pequeño
  ("squid"), dos filas intermedias = tipo mediano ("crab"), dos filas inferiores = tipo
  grande ("octopus"). `VERIFICADO` — computerarcheology.com, *Code* (referencia a los tres
  tipos de sprite) + arcade-history.com (asociación tipo↔puntaje, ver §6.
- **Alien de referencia:** el sistema de movimiento usa un "alien de referencia" (el de
  abajo a la izquierda de los que siguen vivos) como ancla; el resto de la formación se
  dibuja en relación a él. `VERIFICADO` — computerarcheology.com, *Code*.
- **Paso de movimiento horizontal:** 2 píxeles por paso en la mayoría de los casos.
  **Caso especial:** cuando queda un solo invasor, se mueve 2 píxeles hacia la izquierda
  pero **3 píxeles hacia la derecha** — asimetría documentada, no un error de
  transcripción. `VERIFICADO` — computerarcheology.com, *Code*.
- **Descenso al invertir dirección:** al llegar al borde, la formación baja antes de
  invertir el sentido horizontal. La caída es de **16 píxeles** (un alto de celda) por
  inversión. `VERIFICADO` — computerarcheology.com, *Code* (suma de `$10` a la coordenada Y
  en el cálculo de columnas al invertir).
- **Posición Y inicial por ronda:** ver progresión en §7 (varía ronda a ronda, no es fija).
- **Escudos:** 4 escudos, cada uno de **16 píxeles de ancho × 22 filas de alto** (44 bytes
  = 22 filas × 2 bytes/fila = 22×16 bits). `VERIFICADO` — computerarcheology.com, *Code*
  (rutina de copiado de escudo). **Cierre §11.1 (2026-09-04) — progreso parcial, sigue sin
  poder cerrarse con precisión de píxel.** Se localizó la rutina exacta que posiciona los
  escudos en pantalla, `CopyShields` (dirección `$021E`), con su propio comentario en la
  fuente: *"A is 1 for screen-to-buffer, 0 for to buffer-to-screen; HL is screen coordinates
  of first shield. There are 23 rows between shields; DE is sprite buffer in memory."*
  El primer escudo usa `HL=$2806` como coordenada de pantalla inicial, y la rutina avanza
  `$02E0` por cada uno de los 4 escudos (`LD A,$04` cuenta los escudos, `LD BC,$1602` = 22
  filas × 2 bytes/fila para el patrón de un escudo). `VERIFICADO` — computerarcheology.com,
  *Code* (rutina `CopyShields`, `$021E`–`$0227`). **Lo que sigue sin cerrarse:** la página no
  publica una fórmula explícita ni una tabla de conversión de estas direcciones de VRAM a
  coordenadas X en píxeles, y `Hardware.html` da una descripción del mapeo de VRAM
  internamente inconsistente entre sí (mezcla bytes-por-columna de 28 y de 32) como para
  derivar un valor de píxel con la confianza que exige el Art. 1.4. Convertir `$2806` y el
  paso `$02E0` a coordenadas X reales requiere que un agente con acceso al desensamblado
  completo (no solo fragmentos vía fetch) haga la conversión y la deje `VERIFICADO`, o que
  se corra el ROM en MAME (implementación de referencia declarada) y se lea la posición en
  pantalla directamente. Sigue como **pregunta abierta**, ver §11.1.
- **Límites de movimiento del jugador:** el cañón se mueve solo en X, entre **X=0x30
  (48)** y **X=0xD9 (217)** en coordenadas de pantalla no rotada. `VERIFICADO` —
  computerarcheology.com, *Code*.
- **Límite que dispara "fin de vida":** si un invasor alcanza la fila del jugador (chequeo
  de coordenada en la rutina de movimiento), se mata al jugador de inmediato,
  independientemente de las vidas restantes — no espera a que termine la ronda.
  `VERIFICADO` — computerarcheology.com, *Code* (rutina en 016A–016D, salto a "kill the
  player" en `$1971`).
- **OVNI:** aparece en una fila Y fija cerca de la parte superior de la pantalla, dentro de
  un rango de movimiento acotado (`$28`–`$E1` en la coordenada usada por el juego).
  `VERIFICADO` — computerarcheology.com, *Code*. **Cierre §11.2 (2026-09-04) — sigue
  abierto.** Se confirmó que el objeto OVNI usa una estructura de 10 bytes (`LD B,$0A` con
  comentario *"10 bytes in saucer structure"*, `$0704`) y que se dibuja con la rutina
  genérica de sprites `DrawSimpSprite` (llamada en `$073C`–`$073F`, vía un descriptor de
  esprite, no un tamaño fijo hardcodeado en esa rutina), con datos de sprite de la
  explosión en `$1D7C`. `VERIFICADO` — computerarcheology.com, *Code*. **Lo que sigue sin
  confirmarse:** el ancho/alto exacto en píxeles del gráfico del OVNI no está expresado en
  ningún comentario de esa página — la estructura de 10 bytes describe el objeto de juego
  (posición, estado, temporizador), no el tamaño de su bitmap. Extraerlo exige leer el
  bitmap real de la ROM (tabla de sprites referenciada por el descriptor que usa
  `DrawSimpSprite`) o medirlo directamente sobre el ROM cargado en MAME (implementación de
  referencia declarada) — ninguna de las dos vías estuvo disponible en esta pasada. Sigue
  como **pregunta abierta**, ver §11.2.

---

## 4. Velocidades y temporizaciones (en frames, no milisegundos)

Todo lo siguiente es a 60 Hz — 1 frame = 1/60 s ≈ 16.67 ms. Se documenta en frames porque
así vive en el hardware original (Constitución, Art. 1.2).

- **Disparo del jugador:** delta constante de 4 píxeles por interrupción (por frame) → 240
  px/s. Solo puede haber un disparo del jugador activo a la vez. `VERIFICADO` —
  computerarcheology.com, *Code*.
- **Disparos de los invasores (3 tipos — rolling, plunger, squiggly):** delta normal de 4
  píxeles cada 3 frames → 80 px/s. **Cuando quedan 8 invasores o menos, el delta sube a 5
  píxeles por paso → 100 px/s.** `VERIFICADO` — computerarcheology.com, *Code*.
- **Jugador:** se mueve tan rápido como el hardware permite — el desplazamiento ocurre en
  cada refresco de pantalla (60 Hz), sin limitador adicional de velocidad en el código.
  `VERIFICADO` — computerarcheology.com, *Code*.
- **Movimiento de la horda:** no existe una tabla de "frames entre pasos" independiente —
  la velocidad de movimiento es un efecto secundario del ciclo de redibujado. Ver
  mecanismo completo en §5.
- **Sonido de pasos de la horda (NO es la velocidad real del movimiento — están
  desincronizados a propósito por el propio hardware):**

  | Invasores vivos ≥ | 50 | 43 | 35 | 28 | 20 | 16 | 13 | 11 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
  | Retardo entre tonos (frames) | 52 | 46 | 39 | 34 | 28 | 24 | 21 | 19 | 16 | 14 | 13 | 12 | 11 | 9 | 7 | 5 |

  `VERIFICADO` — computerarcheology.com, *Code*. **Nota de fidelidad:** el propio documento
  fuente aclara que el sonido va más rápido que la horda real al inicio (55 invasores) y
  más lento después (50 invasores) — es decir, el desfase entre sonido y movimiento es
  parte del original, no un error a corregir.

---

## 5. Mecanismo de aceleración de la horda — cómo replicarlo explícitamente

Este es el punto que Lucas pidió entender a fondo. **No hay una tabla de velocidades**: la
aceleración es un efecto secundario de cuántos invasores puede redibujar el hardware por
frame, y hay que reproducir esa causa, no solo el resultado observado.

**Mecanismo verificado** (computerarcheology.com, *Code*):

1. Cada interrupción de fin de pantalla (una por frame, 60 Hz) redibuja **exactamente un
   invasor** de los que siguen vivos — nunca más de uno por frame.
2. El orden de redibujado recorre la formación de **izquierda a derecha y de abajo hacia
   arriba**.
3. Cuando le toca el turno al "invasor de referencia" (el de más abajo a la izquierda de
   los vivos), ese invasor **se mueve** 2 (o 3, ver §3) píxeles en la dirección actual antes
   de redibujarse. El resto de invasores, en su turno, solo se redibuja en la nueva
   posición relativa — no tienen movimiento propio independiente.
4. Una "vuelta completa" a todos los invasores vivos = tantos frames como invasores
   queden vivos. Con 55 invasores vivos, una vuelta completa tarda 55 frames (~917 ms);
   con 27, tarda 27 frames (~450 ms); con 1, tarda 1 frame (~16.7 ms) — el invasor de
   referencia se mueve en cada frame porque es el único que queda.
5. Como la horda completa una traslación visible cada vez que se completa una vuelta, y la
   vuelta se acorta linealmente con el número de invasores vivos, **la velocidad aparente
   de la horda es inversamente proporcional a la cantidad de invasores vivos** — sin que
   exista ningún contador de velocidad explícito en el código.

**Cómo implementarlo con fidelidad (recomendación para la spec):** el núcleo no debe
simular esto con una curva de velocidad interpolada ni con una tabla de "ms por nivel".
Debe reproducir la causa: mantener una cola/orden de invasores vivos, avanzar un puntero
un invasor por tick de simulación, mover al invasor de referencia únicamente cuando el
puntero vuelve a él, y dejar que la velocidad aparente emerja del tamaño de esa cola —
igual que en el hardware. Esto es lo único que garantiza que la sensación de aceleración
"se sienta" como el original en vez de aproximarse con una curva ajustada a ojo
(Constitución, Art. 1 — la fidelidad prima sobre la conveniencia técnica de una curva
manual).

**Distinción importante:** la tabla de sonido de §4 usa umbrales de invasores vivos
distintos y no lineales — eso es un artefacto de diseño de sonido separado, no la fuente
de verdad del movimiento. No usar esa tabla para mover la horda.

---

## 6. Tabla de puntajes completa

| Objetivo | Puntos | Confianza |
|---|---|---|
| Invasor fila superior (pequeño, "squid") | 30 | `VERIFICADO` |
| Invasor filas intermedias (mediano, "crab") | 20 | `VERIFICADO` |
| Invasor filas inferiores (grande, "octopus") | 10 | `VERIFICADO` |
| OVNI | 50 a 300, variable — ver mecanismo abajo | `VERIFICADO` |

Fuente: arcade-history.com, ficha técnica (tabla puntos/tipo); computerarcheology.com,
*Code* (mecanismo del OVNI).

**Mecanismo del OVNI — incluye un bug real que se debe replicar:**

- La tabla interna de puntaje del OVNI tiene 16 valores: `10 05 05 10 15 10 10 05 30 10 10
  10 05 15 10 05` (cada valor ×10 para el puntaje real: 100, 50, 50, 100, 150, 100, 100,
  50, 300, 100, 100, 100, 50, 150, 100, 50).
- El puntero a esta tabla avanza con cada disparo del jugador (no con cada OVNI), y **el
  código tiene un bug real en la dirección `$044E`: el puntero da la vuelta cada 15
  valores en vez de cada 16**, aunque la tabla tiene 16 entradas. Efecto: el único valor de
  300 puntos aparece cada 15 disparos (después de un ciclo inicial de 8), no cada 16.
  `VERIFICADO` — computerarcheology.com, *Code*.
- **Recomendación:** replicar el bug tal cual (incluida la cadencia real: cada 8 disparos
  al inicio, luego cada 15). Es un comportamiento ampliamente conocido y buscado
  deliberadamente por jugadores expertos ("contar hasta 8, luego hasta 15"); "corregirlo"
  sería una desviación del original, no una mejora. Se recomienda **replicar**.

**Vida extra:** el umbral de puntaje para vida extra **no es fijo**: es un DIP switch de
hardware con dos valores posibles, 1000 o 1500 puntos. `VERIFICADO` — computerarcheology.com,
*Hardware* (bit 3 del puerto de DIP switches). **Pregunta abierta / decisión de producto:**
qué valor usar como default en la app — no es un dato de fidelidad, es una decisión de
Lucas (ver §11).

---

## 7. Progresión de niveles, vidas y fin de partida

- **Vidas iniciales:** configurable por DIP switch en el hardware original — 3, 4, 5 o 6.
  `VERIFICADO` — computerarcheology.com, *Hardware* (bits 0–1 del puerto de DIP switches).
  **Decisión de producto pendiente:** cuál usar de default (ver §11) — 3 es lo más
  reconocible/estándar en salón.
- **Posición Y inicial de la horda por ronda** (en la coordenada usada por el juego,
  hexadecimal, mayor = más abajo en pantalla):
  - Ronda 1: Y = `$78`
  - Ronda 2: Y = `$50` (16 px más abajo que la ronda 1)
  - Rondas 3–5: Y = `$48`, se mantiene igual por 3 rondas
  - Rondas 6–8: Y = `$40`, se mantiene igual por 3 rondas más
  - A partir de la ronda 7, la horda arranca "justo encima de los escudos" y la cadencia de
    disparo de los invasores alcanza su máximo — es, según la fuente, "tan difícil como se
    pone el juego" (no sigue haciéndose más difícil indefinidamente).
  `VERIFICADO` — computerarcheology.com, *Code*.
- **Los escudos NO se regeneran entre rondas.** El daño acumulado se conserva de una ronda
  a la siguiente — el juego guarda el estado de cada escudo en un buffer y lo restaura al
  empezar la ronda siguiente en vez de redibujarlo intacto. `VERIFICADO` —
  computerarcheology.com, *Code* (rutinas `RememberShields`/restauración). **Esto es un
  hecho de fidelidad importante y fácil de implementar mal por conveniencia** (redibujar
  escudos nuevos en cada ronda "porque es lo esperable" sería una desviación silenciosa).
- **El puntaje no se reinicia entre rondas.** Acumulación continua. `VERIFICADO` —
  computerarcheology.com, *Code*.
- **Fin de vida instantáneo:** si cualquier invasor alcanza la fila del jugador, se pierde
  la vida de inmediato — no hace falta que termine la ronda ni que el invasor choque con el
  jugador propiamente. `VERIFICADO` — computerarcheology.com, *Code* (ver §3).
- **Fin de partida:** se agota cuando las vidas llegan a 0 tras un "fin de vida instantáneo"
  o tras ser alcanzado por un disparo enemigo. **Cierre §11.5 (2026-09-04) — resuelto,
  `VERIFICADO`.** Se localizó la línea exacta del desensamblado que confirma la condición:
  tras `CALL DsableGameTasks`, el código llama a `$092E` (comentado en la fuente como *"Get
  number of ships for active player"*), compara el resultado contra cero con `AND A`
  (comentado *"Any left?"*) y, si es cero, salta con `JP Z,$166D`, comentado literalmente
  en la fuente como *"No ... handle game over for player"*. `VERIFICADO` —
  computerarcheology.com, *Code* (`$02D7`–`$02DB`, rutina que llama a `$166D`). Ya no es
  una suposición por consenso de fuentes secundarias: la condición es exactamente
  "vidas del jugador activo = 0", confirmada por el propio comentario del desensamblado.

---

## 8. Comportamiento de los escudos al recibir impactos

- **Cantidad y forma:** 4 escudos, 16×22 píxeles cada uno (ver §3), con la silueta clásica
  (bloque macizo con una hendidura/arco en la base). `VERIFICADO` — computerarcheology.com,
  *Code*.
- **Mecanismo de daño:** no hay una "tabla de patrones de daño" precomputada. El daño ocurre
  por **superposición de sprites durante el dibujado**: cuando un disparo (del jugador o de
  un invasor) impacta algo, se dibuja un sprite de explosión en ese punto por unos pocos
  frames; si esa explosión se superpone con el escudo, esa parte del escudo se borra del
  buffer de pantalla. El escudo se erosiona píxel a píxel según dónde impactan los disparos,
  no según un patrón prediseñado de "grados de daño". `VERIFICADO` —
  computerarcheology.com, *Code*; confirmado independientemente por Raspberry Pi
  Wireframe #9 ("Coding Space Invaders' disintegrating shields").
- **Impactos desde arriba (disparos de invasores y del jugador subiendo) y desde abajo
  (disparo del jugador) usan el mismo mecanismo de borrado por superposición** — no hay
  lógica separada por dirección de impacto en la fuente consultada. Los jugadores
  aprovechan esto para "cavar un túnel" disparando repetidamente al mismo punto, incluida
  la parte inferior del escudo. `VERIFICADO` (mecanismo) — Raspberry Pi Wireframe #9.
- **El daño persiste entre rondas** (ver §7) — un escudo que llega maltrecho al final de
  una ronda empieza igual de maltrecho la ronda siguiente.
- **Colisión del OVNI con los escudos:** no se documentó explícitamente en las fuentes
  consultadas si el OVNI puede dañar escudos al pasar por encima (normalmente no interactúa
  con ellos porque vuela por encima de la formación, fuera del alcance de los escudos) —
  se asume que no interactúa, por diseño de posición Y, pero queda como pregunta abierta de
  baja prioridad (ver §11).
- **Bug relacionado con los escudos (ver también §10):** existe un bug real de colisión
  donde disparar el borde derecho del escudo derecho, en el momento exacto en que la horda
  invierte dirección en el borde izquierdo, se puede registrar por error como si se hubiera
  matado al invasor de arriba a la izquierda — avanzando la ronda antes de tiempo. Detalle
  completo en §10.

---

## 9. Controles originales y mapeo a entrada táctil

**Controles originales** (mueble vertical Taito 1978): `VERIFICADO` —
computerarcheology.com, *Hardware*; arcade-history.com.

- Palanca de 2 posiciones (izquierda / derecha) — sin posición central con resorte, es
  todo-o-nada por dirección.
- 1 botón de disparo.
- Botones de inicio: "1 Player" y "2 Player" (turnos alternados, sin dos jugadores
  simultáneos en pantalla — el hardware original es de un jugador a la vez incluso en modo
  2 jugadores).
- Ranura de moneda.

**Mapeo propuesto a entrada táctil** (para que el shell lo declare como panel del juego,
`product-spec.md` §3.1 dice que Space Invaders usa "palanca horizontal (2 direcciones) +
botón de disparo" — coincide con el original, no hace falta desviación):

- Dos zonas táctiles de dirección (izquierda/derecha) del ancho de la mitad inferior de la
  pantalla, sin gradiente de velocidad — el toque sostenido mueve al cañón a velocidad
  constante, igual que la palanca original (no hay velocidad analógica que preservar: el
  original es binario).
- Una zona de disparo, independiente de las de dirección, para poder moverse y disparar al
  mismo tiempo (como con joystick físico + botón separado).
- No se requiere "shot cooldown" adicional en la UI: el propio juego ya limita a un disparo
  del jugador activo a la vez (§4) — el mapeo táctil no necesita imponer un límite propio,
  alcanza con no ignorar toques repetidos.

Esto no introduce una desviación de fidelidad de *comportamiento* (Constitución, Art. 1.6):
la única diferencia es el medio físico (dedo vs. palanca/botón), ya prevista y aceptada por
el product-spec como norma general de la app.

---

## 10. Bugs y comportamientos emergentes conocidos

| # | Bug / comportamiento | Descripción | Recomendación |
|---|---|---|---|
| 1 | **Aceleración de la horda** | No es un bug: es un efecto secundario intencional del redibujado por frame (ver §5). Nishikado lo descubrió por accidente y decidió dejarlo porque "hacía el juego más interesante". `VERIFICADO` — computerarcheology.com + en.wikipedia.org. | **Replicar** — es el mecanismo central de dificultad del juego; sin él, el juego no es fiel en absoluto. |
| 2 | **Bug de colisión escudo↔invasor en el giro de la horda** | Al calcular a qué invasor corresponde un disparo, el juego convierte coordenadas de pantalla a fila/columna sin chequeo de límites. Si se dispara el borde derecho del escudo derecho justo cuando la horda gira en el borde izquierdo, el cálculo `FILA×11+COLUMNA` puede coincidir por accidente con el índice del invasor superior izquierdo, registrando un "invasor muerto" que en realidad fue un impacto al escudo — y adelantando la ronda antes de tiempo. `VERIFICADO` — computerarcheology.com, *Code*. | **Replicar.** Es un bug real del original, no un defecto de una reimplementación; omitirlo es una desviación silenciosa (Constitución, Art. 1.6) aunque sea "más justo" no tocarlo. |
| 3 | **Bug del puntaje del OVNI (cadencia 15 en vez de 16)** | Ver §6. | **Replicar** — comportamiento buscado activamente por jugadores expertos ("contar a 8, luego a 15"); es parte de la estrategia óptima conocida del juego original. |
| 4 | **Asimetría de movimiento con 1 invasor** | 2 px a la izquierda, 3 px a la derecha con el último invasor vivo (§3). | **Replicar** — es consecuencia directa del mecanismo de §5, no un caso especial artificial: si se implementa el mecanismo real, esta asimetría aparece sola. |
| 5 | **Desfase entre sonido de pasos y movimiento real** | La tabla de sonido (§4) no coincide con la velocidad real de movimiento — el sonido va adelantado al principio y atrasado después. `VERIFICADO`. | **Replicar** — es sonido reconstruido de todas formas (product-spec: "audio reconstruido"), y el desfase es parte de cómo sonaba el original en el salón. |
| 6 | **"Nagoya shooting" / "wall of death"** | Con la horda muy cerca del cañón (en las últimas rondas), un ángulo de disparo de los invasores hace que sus proyectiles no puedan impactar al jugador en ciertas posiciones muy próximas — una laguna geométrica de colisión, no una regla de diseño. Wikipedia, con referencia histórica. `DERIVADO` (no se confirmó con el desensamblado en esta pasada, solo con fuente secundaria). | **Replicar si se confirma con el desensamblado** (queda en preguntas abiertas, §11) — es una estrategia históricamente documentada y parte de la "sensación" del original para quien lo jugó competitivamente; omitirla cambiaría el balance de las rondas avanzadas. |
| 7 | **Easter egg "TAITO COP"** | Combinación de botones sostenidos en modo demo (sin jugar) muestra un mensaje oculto en rojo en la zona del OVNI. Secuencia documentada en computerarcheology.com, *Code*, pero poco fiable de reproducir por timing incluso en MAME. `VERIFICADO` (existencia), mecanismo de activación con matices. | **Omitir.** No afecta la jugabilidad ni el "recuerdo" de nadie que jugó normalmente — es una curiosidad de depuración de fábrica, no una característica del juego jugado. Añadirlo sería esfuerzo desproporcionado a su valor de fidelidad. |

---

## 11. Preguntas abiertas

1. **[Actualizado 2026-09-04, sigue abierta] Coordenadas X exactas de los 4 escudos y
   offset Y fila-a-pantalla.** Se confirmaron cantidad (4) y dimensiones (16×22 px). Esta
   pasada localizó la rutina exacta que los posiciona, `CopyShields` (`$021E`), con
   `HL=$2806` como coordenada de pantalla del primer escudo y avance de `$02E0` por escudo
   (ver §3) — pero `computerarcheology.com` no publica una fórmula de conversión de
   dirección de VRAM a píxel X que se pueda citar con la confianza que exige el Art. 1.4, y
   `Hardware.html` da una explicación de esa conversión inconsistente consigo misma (28 vs.
   32 bytes por columna). Convertir `$2806`/`$02E0` a coordenadas X reales queda pendiente:
   requiere leer el desensamblado completo sin los recortes de un fetch por fragmentos, o
   correr el ROM en MAME y leer la posición en pantalla directamente.
2. **[Actualizado 2026-09-04, sigue abierta] Dimensiones exactas del sprite del OVNI en
   píxeles.** Se confirmó su rango de movimiento en Y (ya lo estaba) y, en esta pasada, que
   usa una estructura de objeto de 10 bytes y la rutina genérica `DrawSimpSprite` (ver §3) —
   pero el ancho/alto del bitmap en sí no aparece comentado en `Code.html`. Requiere leer el
   bitmap de la ROM referenciado por el descriptor de sprite, o medirlo sobre el ROM cargado
   en MAME.
3. **[Revisada 2026-09-04, sigue abierta — sin fuente nueva] Paleta exacta por fila de la
   variante C** (conversión oficial a color RGB / Space Invaders Color = `sicv` en MAME /
   mismo generador de color que Part II). Lucas ya eligió esta opción (§1). Se confirmó que
   existe como hardware real (RGB de 3 bits, 8 colores posibles, mismo generador que Part
   II) y un comportamiento dinámico (pantalla se pone roja durante la explosión del
   jugador), pero no la asignación exacta de color por fila de invasores. Esta pasada
   revisó de nuevo `src/mame/midw8080/8080bw.cpp` en mamedev/mame (el archivo es demasiado
   grande para extraerlo completo por fragmentos; se confirmó la sección de puertos de
   entrada de `sicv` pero no se localizó la función de paleta), `tcrf.net` (confirma en
   prosa que "la versión CV añade color propiamente basado en hardware" pero sin datos por
   fila) y la ficha de MAME en `adb.arcadeitalia.net` para `sicv` (campo "Colors: -", sin
   catalogar). Ninguna fuente nueva cierra esto. Antes de fijar constantes de color en la
   spec sigue habiendo dos caminos: (a) localizar la función de paleta completa de
   `8080bw.cpp` con acceso directo al archivo (no por fetch fragmentado), o (b) conseguir
   una captura de pantalla real de `sicv` corriendo en MAME. Mientras tanto, la spec puede
   avanzar con la aproximación `SUPUESTO` descrita en §1.1 (bandas rojo/blanco/verde de
   bordes duros, igual que el celofán de la opción A) sin bloquear el resto del trabajo.
4. **Identificación de la placa/fabricante de la variante D** (la máquina de la foto de
   Lucas). Sin identificar, queda registrada como desviación de fuente (Constitución, Art.
   1.6) en vez de como variante documentada — no bloquea, pero es deuda de investigación
   abierta si en algún momento se quiere precisión adicional.
5. **[Resuelta 2026-09-04, VERIFICADO] Condición exacta de "game over"** (vidas=0) — ya no
   es una suposición: se localizó la línea exacta del desensamblado (`$02D7`–`$02DB`, salto
   a `$166D`, comentado en la propia fuente como "handle game over for player" tras
   comprobar "Any left?" sobre el número de naves del jugador activo). Ver detalle y cita
   completa en §7. Cerrada, no requiere más trabajo.
6. **"Nagoya shooting" / laguna de colisión en rondas avanzadas** (§10, bug 6) — confirmado
   solo por fuente secundaria (Wikipedia), no por el desensamblado. Verificar contra
   computerarcheology.com antes de decidir si se replica.
7. **Colisión del OVNI con los escudos** (§8) — se asume que no interactúa, sin confirmación
   explícita.
8. **Decisiones de producto (no de fidelidad) que Lucas debe fijar antes de la spec:**
   vidas iniciales por defecto (3/4/5/6, todas fieles al hardware — es config, no fidelidad)
   y umbral de vida extra por defecto (1000 o 1500, también config original). Estas dos
   NO son preguntas de investigación: son decisiones de producto sobre qué configuración de
   DIP switch reproducir por defecto, y quedan para la spec, no para este documento.

---

## 11.9 Cierre ampliado (2026-09-05) — página completa de `Code.html`

El fetch automático de este hilo no puede llegar a `computerarcheology.com` (robots.txt lo
bloquea). Lucas guardó la página completa (`Code.html`, 7176 líneas de texto una vez
extraído el HTML) y la puso a disposición del hilo orquestador, que la leyó completa y
localizó lo siguiente — **todo con cita textual de rutina, dirección y comentario original**,
no interpretación:

1. **Velocidad del cañón del jugador — `VERIFICADO`, resuelve el `SUPUESTO` de `constants.ts`.**
   Rutinas `MovePlayerRight`/`MovePlayerLeft` (`$0381`–`$0398`): `INC A` / `DEC A` sobre la
   coordenada X — **1 píxel por invocación**, y la tarea "solo se llama en el ISR de
   mitad de pantalla" (comentario en `$028E`), es decir, **una vez por tick a 60 Hz**. La nota
   de investigación anterior ("se mueve tan rápido como el hardware permite, sin limitador
   adicional") no era una ausencia de límite: el límite es exactamente 1 px/tick, el mismo
   límite del que hablaba el comentario, solo que sin cuantificarlo. **1 px/tick (60 px/s).**

2. **Mecanismo real de disparo de los invasores — `VERIFICADO`, reemplaza el `SUPUESTO` de
   probabilidad que inventó el CLI.** No es una probabilidad por tick. Rutina
   `HandleAlienShot` (`$0563`), comentario original: *"The alien fire rate is based on the
   number of steps the other two shots on the screen have made. The smallest number-of-steps
   is compared to the reload-rate... Setting rate this way keeps shots from walking on each
   other."* Mecanismo exacto:
   - Los 3 disparos de invasor (rolling/plunger/squiggly) comparten un **puntero determinista
     a una tabla de columnas** (`aShotCFirLSB`) que avanza con cada nuevo disparo, no al azar.
   - Antes de iniciar un disparo nuevo, se compara el conteo de pasos de los OTROS DOS
     disparos activos contra una **tasa de recarga** (`aShotReloadRate`); si algún otro
     disparo lleva menos pasos que esa tasa, no se dispara todavía.
   - La tasa de recarga depende del MSB del puntaje del jugador activo — rutina
     `AShotReloadRate` (`$170E`), tabla en `$1AA1`/`$1CB8`, **comentada explícitamente en la
     fuente**: puntaje ≤ 0x0200 → recarga 0x30 (48 pasos); ≤ 0x1000 → 0x10 (16); ≤ 0x2000 →
     0x0B (11); ≤ 0x3000 → 0x08 (8); por encima → 0x07 (7). Un "paso" es una invocación de
     movimiento del disparo (mismo tick de la velocidad de disparo ya `VERIFICADO`, research
     §4).
   - Tras la muerte del jugador, el disparo de invasores queda deshabilitado **48 ticks**
     (`$02A1`–`$02A3`, `LD A,$30` sobre `alienFireDelay`) antes de reactivarse.
   - **Columna exacta que dispara en cada turno:** la tabla de columnas (`aShotCFirLSB`) SÍ
     existe (referenciada en `$059C`), pero su contenido literal (el orden de columnas) no
     se localizó en esta pasada — pendiente si se necesita reproducir el orden exacto y no
     solo la cadencia.

3. **Cadencia de aparición del OVNI — `VERIFICADO`, reemplaza el `SUPUESTO` de "cada 15 s".**
   Rutina `TimeToSaucer` (`$0913`): contador `tillSaucerLSB` cuenta regresivo; al llegar a
   cero arranca la secuencia del OVNI y el contador se reinicia a **`$0600` = 1536 ticks
   (25.6 s a 60 Hz)**. Con una condición adicional no documentada antes: el contador **no
   corre** hasta que el invasor de referencia baja de la posición Y inicial de la ronda 1
   (`$78`) — el OVNI no puede aparecer antes de que la horda haya descendido al menos una
   vez.

4. **Bitmap exacto del escudo — `VERIFICADO`, resuelve la mitad de §3.4 (la FORMA; la
   posición X en pantalla sigue sin resolver, ver punto 6).** Sección `Shield Image`,
   dirección `$1D20`, comentario original: *"Shield image pattern. 2 x 22 = 44 bytes."*
   16 columnas × 22 filas, 2 bytes por fila (16 bits, MSB primero, bit=1 es píxel sólido).
   ASCII art literal de la fuente:
   ```
   ************....
   *************...
   **************..
   ***************.
   ****************
   ..**************
   ...*************
   ....************
   ....************
   ....************
   ....************
   ....************
   ....************
   ....************
   ...*************
   ..**************
   ****************
   ****************
   ***************.
   **************..
   *************...
   ************....
   ```
   Bytes hexadecimales literales, fila por fila (22 valores de 16 bits / 44 bytes, en el
   orden del código fuente):
   ```
   $1D20: FF 0F  FF 1F  FF 3F  FF 7F  FF FF  FC FF  F8 FF  F0 FF  F0 FF  F0 FF  F0 FF
   $1D36: F0 FF  F0 FF  F0 FF  F8 FF  FC FF  FF FF  FF FF  FF 7F  FF 3F  FF 1F  FF 0F
   ```
   Reemplaza la silueta que el CLI tuvo que inventar en `createShieldMask` — usar este
   patrón literal, no una aproximación.

5. **Bitmap exacto del sprite del OVNI — `VERIFICADO`, cierra §11.2 por completo.** Sección
   `Flying Saucer Sprite`, dirección `$1D64`: sprite de **8 píxeles de ancho × 24 filas**
   (bytes hexadecimales y ASCII art completos), con la forma visible del platillo ocupando
   las filas centrales (aprox. filas 4–19, 16 de alto) y padding transparente arriba/abajo.
   El `SUPUESTO` de 16×24 de la spec §3.5 queda reemplazado por el bitmap real.

6. **Lo que sigue sin resolver, incluso con la página completa:**
   - **§11.1 — posición X en pantalla de los 4 escudos.** Se confirmó de nuevo la dirección
     VRAM (`$2806`, paso `$02E0` = 736 bytes = 23 filas × 32 bytes/fila) — el nuevo dato es
     que **32 bytes por fila es matemáticamente consistente** (256 px de ancho ÷ 8 bits =
     32), lo que apunta a que la cifra de "28 bytes" que aparecía en `Hardware.html` era la
     imprecisa. Pero convertir esa dirección VRAM a una coordenada X en la pantalla ROTADA
     (que es la orientación que usa esta spec) requiere la convención exacta de mapeo
     fila/columna del hardware de video, que vive en `Hardware.html`, no en `Code.html` —
     no se leyó esa página completa en esta pasada. **Sigue `SUPUESTO`.**
   - **§11.3 — paleta por fila.** No está en `Code.html` en absoluto — es responsabilidad del
     driver de video de MAME (`8080bw.cpp`), no del ROM del juego. **Sigue `SUPUESTO`.**
   - **Velocidad horizontal del OVNI** (px/tick) y **duración de las animaciones de
     explosión** de invasor y de OVNI — no se localizaron con un número explícito en esta
     pasada (sí se confirmó que la explosión del disparo del jugador usa un temporizador de
     ~10-15 ticks con la primera pasada dibujando el sprite, `$03D7`, pero el comentario
     fuente es ambiguo entre 10 y 15 — **`DERIVADO`, no `VERIFICADO`**, hasta una lectura más
     cuidadosa). **Siguen `SUPUESTO`** en `constants.ts`, sin empeorar respecto a antes.

**Fuente de este cierre:** archivo local `Games Code/Space Invaders Code.html`, guardado por
Lucas el 2026-09-05 desde `computerarcheology.com/Arcade/SpaceInvaders/Code.html` (fuente
(a), la misma ya declarada — el archivo es una copia íntegra de esa página, no una fuente
nueva). No se commitea al repositorio (es una copia de un sitio de terceros, no producto de
este proyecto); vive únicamente en la carpeta de trabajo de Lucas.

## 11.10 Segunda pasada dirigida (2026-09-05) — huecos puntuales sobre el mismo `Code.html`

Tras cerrar los puntos de §11.9, Lucas preguntó qué falta y si hace falta otra fuente. Antes
de pedir nada nuevo, se re-grepeó el mismo archivo local ya en mano con términos más
específicos (rutina del OVNI, tabla de columnas, temporizadores de explosión). Resultado:
tres huecos más cerrados sin gastar una fuente nueva, y confirmación de que los dos que
quedan (paleta, posición X de escudos) NO están en este archivo por ser de otro nivel
(hardware de video, no ROM del juego).

1. **Velocidad horizontal del OVNI — `VERIFICADO`, resuelve el `SUPUESTO` de §3.5.** Rutina
   de reinicio del objeto OVNI (`$045D`–`$0475`): la paridad del contador de disparos
   (`shotCountLSB AND 1`) decide la dirección — bit en 0 → `LD BC,$0229` (delta **+2**,
   arranca en X=`$29`=41, se mueve a la derecha); bit en 1 → `LD BC,$FEE0` (delta **-2**,
   arranca en X=`$E0`=224, se mueve a la izquierda). **2 px/tick (120 px/s), dirección
   alterna cada vez que reaparece.** Reemplaza cualquier valor inventado en `constants.ts`.

2. **Tabla literal de columnas de disparo — `VERIFICADO`, resuelve el punto 5 pendiente de
   §11.9.2 y el `SUPUESTO` de la spec §5.1.5.** Sección `ColFireTable` (`$1CFA`/`$1D00`),
   comentario original completo: *"This table decides which column a shot will fall from.
   The column number is read from the table (1-11) and the pointer increases for the shot
   type... the 'squiggly' shot uses index 06-14... the 'plunger' shot uses index 00-0F...
   the 'rolling' shot targets the player [no usa la tabla]."* Bytes exactos:
   ```
   $1D00: 01 07 01 01 01 04 0B 01 06 03 01 01 0B 09 02 08
   $1D10: 02 0B 04 07 0A
   ```
   (índices 0x00–0x14, 21 valores en total — "plunger" lee 0x00–0x0F, "squiggly" lee
   0x06–0x14, ambos punteros cíclicos e independientes sobre la misma tabla). Hay además un
   tramo en `$1D15` (`05 02 05 04 06 07 08 0A 06 0A 03`) que el propio comentario de la
   fuente marca como **no usado en el juego final** ("appears to be part of the
   column-firing table, but it is never used... perhaps intended for the rolling shot").
   No incluirlo en la implementación.

3. **Duración de la explosión de un invasor — `VERIFICADO`.** Rutina de impacto
   (`$152A`, `LD A,$10`): el temporizador de "invasor explotando" arranca en **`$10` = 16
   ticks** (0.267 s a 60 Hz) y cuenta regresivo hasta remover el invasor de juego
   (`$1538`–`$1548`).

4. **Duración de la secuencia de "OVNI impactado" — parcialmente `VERIFICADO`.** Rutina
   `$06D6`–`$06F9`: el temporizador (`$2086`) arranca en **`$20` = 32 ticks**, con dos
   puntos de control comentados en la fuente ("Starts at 20 ... first tick of show-hit
   timer" en `$1F`=31, "a little later" en `$18`=24) que cambian el sprite mostrado
   (explosión → puntaje) antes de remover el OVNI de juego. Se confirma el arranque en 32
   ticks; el desglose exacto de qué se dibuja en cada checkpoint intermedio no se
   verificó bit a bit — suficiente para fijar la duración total (32 ticks ≈ 0.53 s),
   marcado `VERIFICADO` en la duración, `DERIVADO` en el desglose interno de checkpoints.

5. **Duración de la explosión de un disparo de invasor (al chocar con jugador/escudo) —
   sigue `DERIVADO`, sin cambios.** Rutina `ShotBlowingUp` (`$0644`): confirma que dibuja el
   sprite de explosión en el primer tick donde el contador llega a `$03`, pero no se
   localizó dónde se inicializa el contador (`$2078`) a su valor de arranque en esta
   pasada — no se puede fijar la duración total todavía. Queda igual que en §11.9.6.

6. **Paleta por fila (§11.3) y posición X de escudos (§11.1) — confirmado que NO viven en
   `Code.html`, se necesita otra fuente.** Se intentó `raw.githubusercontent.com` sobre el
   driver de MAME `src/mame/midw8080/8080bw.cpp` (el archivo correcto — la ruta antigua
   `misc/8080bw.cpp` ya no existe, MAME reorganizó su árbol de código). El propio código
   confirma la hipótesis: la variante color (`invadpt2`) se describe literalmente como
   *"same as regular invaders, but with a color board added"* — la paleta la genera una
   **tarjeta de hardware separada** ("color board"), no una tabla en el ROM ni en el driver
   principal. La función real (`screen_update_invadpt2`, que también resolvería la rotación
   VRAM→pantalla que necesita §11.1) está declarada pero implementada en otro archivo del
   árbol de MAME que no se localizó en esta pasada — la búsqueda por fetch automático no
   pudo enumerar el directorio (`github.com` normal está bloqueado por robots.txt; solo
   `raw.githubusercontent.com` funciona archivo por archivo, y hay que acertar la ruta
   exacta). **Ambos puntos son puramente cosméticos/posicionales, no afectan la mecánica de
   juego** — no bloquean que el juego funcione en PC, solo su fidelidad visual exacta.

**Fuente de los puntos 1-5:** mismo archivo local ya declarado en §11.9 (`Games Code/Space
Invaders Code.html`), sin gastar una fuente nueva. **Fuente del intento del punto 6:**
`raw.githubusercontent.com/mamedev/mame/master/src/mame/midw8080/8080bw.cpp` (pública, sin
bloqueo de robots.txt, a diferencia del propio `github.com`).

## 11.11 Sprites de pixel art real — nave y los 3 tipos de invasor (2026-09-05)

Lucas jugó la implementación resultante de §11.9/§11.10 y reportó que se ve "todo mal":
invasores, nave y escudo aparecen como formas geométricas simples, no como el pixel-art
reconocible del original. Diagnóstico (ver `docs/estado.md` para el registro completo del
error): la spec nunca exigió el bitmap real de nave/invasores como criterio de aceptación —
solo se resolvieron escudo y OVNI en pasadas anteriores. `render.ts` usa `fillRect` de color
sólido para nave/invasores/OVNI porque no existe un atlas de sprites — la infraestructura
para dibujar sprites reales (`DrawSurface.drawSprite`, `packages/core/renderer/canvas-surface.ts`,
`SpriteAtlas`) ya existe en el código, simplemente nunca se le dio contenido real.

Mismo archivo local ya en mano (`Games Code/Space Invaders Code.html`), sin fuente nueva.
Convención de bits confirmada y reutilizada de §11.9.4 (validada cruzando con `SquiglyShot`,
`$1CD0`: byte `$44` = `..*...*.` — bit 0 es el píxel más a la IZQUIERDA de cada byte, LSB
primero, un byte = 8 columnas):

**Nave del jugador — `VERIFICADO`.** Sección `Player Sprite`, dirección `$1C60`. 8 px de
ancho × 16 filas, una sola forma (no anima al moverse):
```
........
........
****....
*****...
*****...
*****...
*****...
*******.
********
*******.
*****...
*****...
*****...
*****...
****....
........
```
Bytes: `$1C60: 00 00 0F 1F 1F 1F 1F 7F FF 7F 1F 1F 1F 1F 0F 00`

**Explosión de la nave — `VERIFICADO`, 2 cuadros.** Sección `PlrBlowupSprites`, direcciones
`$1C70` y `$1C80` (8×16 cada uno, patrón de "desintegración" en dos pasos — no hay ASCII
limpio reproducible aquí de forma compacta, usar los bytes directos):
```
$1C70: 00 04 01 13 03 07 B3 0F 2F 03 2F 49 04 03 00 01
$1C80: 40 08 05 A3 0A 03 5B 0F 27 27 0B 4B 40 84 11 48
```

**Invasores — `VERIFICADO`, 3 tipos × 2 cuadros de animación cada uno.** Sección
`Alien Images`, direcciones `$1C00` (cuadro 0, los 3 tipos consecutivos) y `$1C30` (cuadro
1). 8 px de ancho × 16 filas cada sprite. Direcciones exactas confirmadas por la tabla de
puntaje (`$1DBE`, "Tables used to draw SCORE ADVANCE TABLE information"): `Alien A, sprite 0`
→ `$1C00`; `Alien B, sprite 1` → `$1C40`; `Alien C, sprite 0` → `$1C20`.

```
Tipo A, cuadro 0 ($1C00):        Tipo B, cuadro 0 ($1C10):        Tipo C, cuadro 0 ($1C20):
........                          ........                          ........
........                          ........                          ........
*..***..                          ........                          ........
*..****.                          ...****.                          ........
.*.****.                          *.***...                          *..**...
.***.**.                          .*****.*                          .*.***..
..**.***                          ..**.**.                          *.**.**.
.*.*****                          ..****..                          .*.*****
.*.*****                          ..****..                          .*.*****
..**.***                          ..****..                          *.**.**.
.***.**.                          ..**.**.                          .*.***..
.*.****.                          .*****.*                          *..**...
*..****.                          *.***...                          ........
*..***..                          ...****.                          ........
........                          ........                          ........
........                          ........                          ........

Bytes tipo A ($1C00-$1C0F): 00 00 39 79 7A 6E EC FA FA EC 6E 7A 79 39 00 00
Bytes tipo B ($1C10-$1C1F): 00 00 00 78 1D BE 6C 3C 3C 3C 6C BE 1D 78 00 00
Bytes tipo C ($1C20-$1C2F): 00 00 00 00 19 3A 6D FA FA 6D 3A 19 00 00 00 00

Tipo A, cuadro 1 ($1C30):        Tipo B, cuadro 1 ($1C40):        Tipo C, cuadro 1 ($1C50):
........                          ........                          ........
........                          ........                          ........
...***..                          ........                          ........
.*.****.                          .***....                          ........
*******.                          ...**...                          .*.**...
*.**.**.                          .*****.*                          *.****..
..**.***                          *.**.**.                          ...*.**.
.*.*****                          *.****..                          ..******
.*.*****                          ..****..                          ..******
..**.***                          *.****..                          ...*.**.
*.**.**.                          *.**.**.                          *.****..
*******.                          .*****.*                          .*.**...
.*.****.                          ...**...                          ........
...***..                          .***....                          ........
........                          ........                          ........
........                          ........                          ........

Bytes tipo A ($1C30-$1C3F): 00 00 38 7A 7F 6D EC FA FA EC 6D 7F 7A 38 00 00
Bytes tipo B ($1C40-$1C4F): 00 00 00 0E 18 BE 6D 3D 3C 3D 6D BE 18 0E 00 00
Bytes tipo C ($1C50-$1C5F): 00 00 00 00 1A 3D 68 FC FC 68 3D 1A 00 00 00 00
```

**Mapeo tipo→fila de formación: `SUPUESTO`, sin confirmar en esta pasada.** El código usa
letras A/B/C internamente y no localicé en este grep dónde se asigna cada letra a una fila
de la formación (§3.1: fila 1 = "squid" 30 pts, filas 2-3 = "crab" 20 pts, filas 4-5 =
"octopus" 10 pts). Trabajo de implementación, no de investigación: grepear
`0124: LD HL,$1C00 ; Position 0 alien sprites` (línea 744 del archivo de texto) y la rutina
que lo llama para confirmar el mapeo exacto antes de wireing — un solo grep más sobre el
mismo archivo local, sin gastar fuente nueva.

**Explosión de invasor — `VERIFICADO`.** Sección `Alien Exploding Sprite`, `$1CC0` (8×16):
```
........
...*....
*..*..*.
.*...*..
..*.*...
*......*
.*....*.
........
.*....*.
*......*
..*.*...
.*...*..
*..*..*.
...*....
........
........
```
Bytes: `$1CC0: 00 08 49 22 14 81 42 00 42 81 14 22 49 08 00 00`

**Infraestructura de dibujo: ya existe, no hace falta construirla de cero.**
`packages/core/src/renderer/canvas-surface.ts` ya implementa `drawSprite()` sobre un
`SpriteAtlas` (drawImage con recorte de frame, flip horizontal, tintado). Lo que falta es
el propio atlas — la imagen spritesheet con estos bitmaps renderizados a píxeles reales, y
su manifiesto (`SpriteId` → rect en la imagen) — y cambiar `render.ts` de
`fillRect`/`drawShield` a `drawSprite` para nave, invasores y OVNI. El escudo puede quedarse
con el enfoque de spans (es destructible píxel a píxel, no encaja bien en un atlas de
sprites fijos).

## 12. Fuentes consultadas

**Peso (a) — desensamblado técnico comentado (fuente principal de este documento):**
- [computerarcheology.com/Arcade/SpaceInvaders](https://www.computerarcheology.com/Arcade/SpaceInvaders/) — página principal, hardware, timing, aceleración, bugs.
- [computerarcheology.com/Arcade/SpaceInvaders/Hardware.html](https://www.computerarcheology.com/Arcade/SpaceInvaders/Hardware.html) — resolución, mapa de memoria, controles, DIP switches.
- [computerarcheology.com/Arcade/SpaceInvaders/Code.html](https://www.computerarcheology.com/Arcade/SpaceInvaders/Code.html) — geometría, escudos, OVNI, progresión de rondas, bug de colisión. **2026-09-04:** además, rutina `CopyShields` (`$021E`, coordenada `$2806`/paso `$02E0` de escudos), estructura de 10 bytes del OVNI y rutina `DrawSimpSprite` (`$0704`, `$073C`), y confirmación textual de la condición de game over (`$02D7`–`$02DB`, salto a `$166D` — cierre de §11.5).

**Peso (b) — implementaciones de referencia y análisis técnicos consultados como apoyo:**
- [pcjs.org/machines/arcade/invaders](https://www.pcjs.org/machines/arcade/invaders/) — confirmación cruzada de resolución, controles y DIP switches. **2026-09-04:** revisada de nuevo buscando dimensiones del OVNI y condición de game over — no las tiene.
- [raspberrypi.com — Coding Space Invaders' disintegrating shields (Wireframe #9)](https://www.raspberrypi.com/news/coding-space-invaders-disintegrating-shields-wireframe-9/) — confirmación del mecanismo de daño por superposición de sprites.
- [github.com/mamedev/mame — src/mame/midw8080/8080bw.cpp](https://github.com/mamedev/mame/blob/master/src/mame/midw8080/8080bw.cpp) — declarada como implementación de referencia. **2026-09-04:** revisada buscando la función de paleta de `sicv`; el archivo es demasiado extenso para extraerse completo con las herramientas de fetch disponibles en esta pasada — se confirmó la sección `INPUT_PORTS_START( sicv )` y la existencia de `sicv_base`, pero no se localizó la función de paleta ni una tabla de color por fila. Sigue como pendiente para un agente con acceso directo al archivo (§11.3).
- [tcrf.net — Space Invaders (Arcade)](https://tcrf.net/Space_Invaders_(Arcade)) — **2026-09-04:** confirma en prosa que la versión CV "adds proper hardware-based color" pero sin datos de color por fila ni coordenadas/dimensiones de escudos u OVNI (§11.3).
- [adb.arcadeitalia.net — ficha MAME `sicv`](https://adb.arcadeitalia.net/dettaglio_mame.php?game_name=sicv&lang=en) — **2026-09-04:** revisada de nuevo buscando color por fila; el campo de colores de la ficha está vacío ("Colors: -"), sin catalogar (§11.3).

**Peso (c) — wikis técnicas y fichas con referencia primaria:**
- [arcade-history.com — ficha Space Invaders 1978](https://www.arcade-history.com/?page=detail&id=2537) — tabla de puntos por tipo de invasor, controles, CPU.
- [en.wikipedia.org/wiki/Space_Invaders](https://en.wikipedia.org/wiki/Space_Invaders) — contexto histórico del descubrimiento de la aceleración, "Nagoya shooting".

**Sobre la variante a color (§1, detalle completo en el artifact):**
- [tobiasvl.github.io/blog/space-invaders](https://tobiasvl.github.io/blog/space-invaders/) — overlay de celofán Taito vs. Midway.
- [ukvac.com — TECH: TAITO Space Invaders 1 colour variations](https://www.ukvac.com/forum/threads/tech-taito-space-invaders-1-colour-variations.16028/) — existencia de la conversión oficial a color RGB y de Space Invaders Part II.
- [curmi.com — When Arcade Games Lacked Colour](https://curmi.com/when-arcade-games-lacked-colour/) — historia general del overlay de celofán.
- [adb.arcadeitalia.net — ficha MAME `sicv`](https://adb.arcadeitalia.net/dettaglio_mame.php?game_name=sicv&lang=en) — confirma `sicv` = Space Invaders Color Version, mismo generador de color que Part II, RGB 3 bits, efecto de pantalla roja en explosión del jugador (§1.1).
- [github.com/mamedev/mame — src/mame/midw8080/8080bw.cpp](https://github.com/mamedev/mame/blob/master/src/mame/midw8080/8080bw.cpp) — código fuente de la implementación de referencia declarada; confirma la configuración de paleta RGB de 3 bits. La función completa de asignación de color por fila no se localizó en esta pasada (§11.3).
- Fotografía propia de Lucas: `docs/reference/consola1.jpg` (variante D, observación directa).

**No usadas como fuente (memoria del modelo, blogs sin fuente citada):** ninguna afirmación
de este documento proviene de la memoria del modelo sin verificación cruzada contra al
menos una de las fuentes de arriba, según exige la Constitución, Art. 1.3.
