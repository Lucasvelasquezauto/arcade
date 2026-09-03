# Investigación — Space Invaders

**Estado:** paso 1 y paso 2 completos. Lucas eligió la **opción C** del comparador
(2026-09-03) — ver §1. Queda una pieza de deuda documentada antes de fijar constantes de
color en la spec: la paleta exacta fila por fila de la opción C (§1, §11.3).
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
  (rutina de copiado de escudo). Las coordenadas X exactas de cada uno de los 4 escudos y
  el offset Y de fila-a-pantalla no se pudieron extraer con precisión de píxel de la fuente
  disponible en esta pasada — **pregunta abierta**, ver §11.
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
  `VERIFICADO` — computerarcheology.com, *Code*. Ancho/alto exacto del sprite del OVNI en
  píxeles: no confirmado con precisión — pregunta abierta, ver §11.

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
  o tras ser alcanzado por un disparo enemigo. El documento fuente no detalla una pantalla
  de "game over" distinta de agotar vidas — se asume el criterio estándar (vidas = 0 ⇒ fin),
  consistente con cómo describen el ciclo todas las fuentes secundarias consultadas, pero
  no se localizó la línea exacta de código que lo confirma en esta pasada — marcarlo
  `DERIVADO` en vez de `VERIFICADO` y añadir a preguntas abiertas si algún agente necesita
  certeza total antes de codificar el estado de "game over".

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

1. **Coordenadas X exactas de los 4 escudos y offset Y fila-a-pantalla.** Se confirmaron
   cantidad (4) y dimensiones (16×22 px) pero no las posiciones X exactas con precisión de
   píxel. Antes de codificar el layout del campo de juego, hay que volver a
   computerarcheology.com/Arcade/SpaceInvaders/Code.html (rutinas de dibujo de escudo) o al
   desensamblado ROM directo y extraer la tabla de coordenadas.
2. **Dimensiones exactas del sprite del OVNI en píxeles.** Se confirmó su rango de
   movimiento en Y pero no su ancho/alto.
3. **Paleta exacta por fila de la variante C (conversión oficial a color RGB / Space
   Invaders Color = `sicv` en MAME / mismo generador de color que Part II).** Lucas ya
   eligió esta opción (§1). Se confirmó que existe como hardware real (RGB de 3 bits, 8
   colores posibles, mismo generador que Part II) y un comportamiento dinámico (pantalla
   se pone roja durante la explosión del jugador), pero no la asignación exacta de color
   por fila de invasores. Antes de fijar constantes de color en la spec: (a) revisar el
   código de paleta completo de `src/mame/midw8080/8080bw.cpp` en mamedev/mame (la función
   no se localizó completa en esta pasada, posiblemente en un archivo de video separado o
   más abajo en el mismo archivo), o (b) conseguir una captura de pantalla real de `sicv`
   corriendo en MAME. Mientras tanto, la spec puede avanzar con la aproximación `SUPUESTO`
   descrita en §1.1 (bandas rojo/blanco/verde de bordes duros, igual que el celofán de la
   opción A) sin bloquear el resto del trabajo.
4. **Identificación de la placa/fabricante de la variante D** (la máquina de la foto de
   Lucas). Sin identificar, queda registrada como desviación de fuente (Constitución, Art.
   1.6) en vez de como variante documentada — no bloquea, pero es deuda de investigación
   abierta si en algún momento se quiere precisión adicional.
5. **Condición exacta de "game over"** (vidas=0) — se asume por sentido común y consenso de
   fuentes secundarias, pero no se localizó la línea exacta del desensamblado que lo
   confirma (§7).
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

## 12. Fuentes consultadas

**Peso (a) — desensamblado técnico comentado (fuente principal de este documento):**
- [computerarcheology.com/Arcade/SpaceInvaders](https://www.computerarcheology.com/Arcade/SpaceInvaders/) — página principal, hardware, timing, aceleración, bugs.
- [computerarcheology.com/Arcade/SpaceInvaders/Hardware.html](https://www.computerarcheology.com/Arcade/SpaceInvaders/Hardware.html) — resolución, mapa de memoria, controles, DIP switches.
- [computerarcheology.com/Arcade/SpaceInvaders/Code.html](https://www.computerarcheology.com/Arcade/SpaceInvaders/Code.html) — geometría, escudos, OVNI, progresión de rondas, bug de colisión.

**Peso (b) — implementaciones de referencia y análisis técnicos consultados como apoyo:**
- [pcjs.org/machines/arcade/invaders](https://www.pcjs.org/machines/arcade/invaders/) — confirmación cruzada de resolución, controles y DIP switches.
- [raspberrypi.com — Coding Space Invaders' disintegrating shields (Wireframe #9)](https://www.raspberrypi.com/news/coding-space-invaders-disintegrating-shields-wireframe-9/) — confirmación del mecanismo de daño por superposición de sprites.
- MAME (`invaders`, driver `misc/8080bw.cpp`) declarada como implementación de referencia para huecos futuros — no se extrajo código de ella en esta pasada.

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
