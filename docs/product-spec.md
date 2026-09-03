# Product Spec — Compilatorio Arcade

**Versión:** 1.0 (borrador para aprobación)
**Fecha:** 2026-09-03
**Estado:** pendiente de aprobación por el propietario del proyecto (Lucas)
**Documento superior:** `constitution.md` (manda en caso de conflicto)

---

## 1. Propósito

Una app web que reproduce con fidelidad juegos arcade de los 80, presentados dentro de un
marco visual de maquinita, jugables en celular en orientación vertical, con una tabla de
récords compartida entre los dispositivos del propietario.

El producto no es una colección de minijuegos inspirados en clásicos: es una
**reconstrucción** de esos juegos tal como se jugaban, dentro de un mueble que reproduce
la experiencia del salón. Lo que se optimiza es la satisfacción de la nostalgia; lo que se
sacrifica, cuando hay que sacrificar algo, es la comodidad de implementación.

## 2. Usuarios y dispositivos objetivo

| | |
|---|---|
| Usuarios | El propietario y su círculo cercano. Uso personal, sin fines comerciales. |
| Dispositivos | 3 celulares: 2 Android + 1 iPhone. |
| Orientación | **Vertical, fija.** La app no se rota ni ofrece modo horizontal. |
| Entrada | **Solo táctil.** No se soporta teclado ni gamepad físico. |
| Conectividad | Se asume intermitente. La app debe ser jugable sin conexión. |
| Escritorio | No es objetivo. Si se ve razonable en un navegador de escritorio, es una consecuencia, no un requisito. |

## 3. Alcance funcional

### 3.1 Catálogo inicial

Cada juego declara una **versión de referencia canónica**: la variante concreta que se
reproduce (Constitución, Art. 1.3). Los parámetros técnicos exactos —resolución, tablas de
puntaje, velocidades por nivel— **no se fijan aquí**: son producto de la fase de
investigación de cada juego y viven en `docs/research/<juego>.md`.

| Juego | Versión de referencia canónica | Orientación nativa | Control original | Nota |
|---|---|---|---|---|
| **Space Invaders** | Taito, 1978, mueble vertical | Vertical | Palanca horizontal (2 direcciones) + botón de disparo | Juego piloto. Existe desensamblado público comentado de alta calidad. **Estética a color**, como la máquina de `consola1.jpg` (ver §3.1.1). |
| **Pac-Man** | Namco/Midway, 1980 | Vertical | Palanca de 4 direcciones, **sin botones** | El más documentado del grupo en cuanto a IA de fantasmas. |
| **Arkanoid** | Taito, 1986 | Vertical | **Perilla analógica** (spinner) + botón de láser | El de documentación primaria más pobre. Se controlará con palanca horizontal, no con perilla: desviación mayor registrada (ver §14). |
| **Tetris** | **Sega, 1988** (arcade) | Vertical | Palanca + botones de rotación | Elegido sobre Atari Tetris (horizontal, dos jugadores) y Game Boy (no arcade). Es la versión con mejor documentación mecánica pública: frames-por-celda por nivel, lock delay, DAS y tabla de puntaje. |


#### 3.1.1 Nota sobre la estética de Space Invaders

El Taito de 1978 era monocromo: el color provenía de tiras de celofán pegadas sobre el
vidrio. La máquina que sirve de referencia al proyecto (`consola1.jpg`) es una variante a
color, con invasores azules y bases verdes. **Decisión: se reproduce la variante a
color.**

Consecuencia para la investigación: la fuente se parte en dos y así debe quedar registrado.

- **Comportamiento, velocidades y puntaje** → del Taito 1978 documentado, marcados
  `VERIFICADO`.
- **Paleta y asignación de colores por fila y por elemento** → de la variante a color
  observada, marcados `DERIVADO`.

La fase de investigación debe identificar qué variante a color concreta corresponde a la
foto y dejarla declarada; si no logra identificarla, la paleta se toma de la observación
directa de la imagen y se registra como desviación (Constitución, Art. 1.6). En cualquier
caso, las variantes candidatas se presentan al propietario para que elija (§3.2.1).

### 3.2 Orden de trabajo

Space Invaders se construye completo y se valida antes de abrir cualquier otro juego. El
segundo juego se implementa sin modificar el núcleo, como prueba del contrato. Solo
después se paralelizan el tercero y el cuarto (Constitución, Art. 4).

Sugerencia de orden, sujeta a aprobación: **Space Invaders → Pac-Man → Tetris →
Arkanoid**. Pac-Man va segundo porque es el que más tensiona el contrato del núcleo
(movimiento en grilla, cuatro agentes con IA propia, sin botones); Arkanoid va último
porque su control analógico es el que más se aleja del panel base.

### 3.2.1 Hito de validación estética

Cada investigación, antes de convertirse en spec, presenta al propietario **opciones
gráficas comparadas** de la versión de referencia: variantes de la máquina, paletas,
tipografías y proporciones de sprites, vistas lado a lado. El propietario elige la que
corresponde a su recuerdo y esa elección queda registrada como vinculante (Constitución,
Art. 1.5).

Esto convierte el criterio "reconocible por alguien que lo jugó en los 80" —que ningún test
automatizado puede verificar— en una decisión explícita, fechada y trazable, tomada antes de
escribir código y no después de terminarlo.

### 3.3 Extensibilidad

Agregar un juego nuevo debe consistir en: (a) un documento de investigación, (b) una spec,
(c) una carpeta de juego con su lógica y sus recursos, (d) una entrada en el catálogo.
**No debe requerir tocar el núcleo ni el shell.** Si lo requiere, el contrato está mal
diseñado (Constitución, Art. 3.8).

El catálogo es una lista declarativa. Cada entrada aporta: identificador, título,
color de acento, arte de marquesina, definición de su panel de control y punto de entrada
de su lógica.

### 3.4 Fuera de alcance

- Multijugador, en cualquier forma.
- Cuentas de usuario, autenticación o perfiles.
- Guardado de partidas (ver §8 y §13).
- Modo horizontal, escritorio, teclado o gamepad.
- Publicación en tiendas de aplicaciones.
- Cualquier telemetría, analítica o seguimiento.

## 4. Estructura de la app

```
  [ Selección de juego ]
             │  toca un juego — arranca de inmediato
             ▼
  [ Juego ]  ◄──── pausa por pérdida de visibilidad ────► [ Pausa + cuenta regresiva 3 s ]
             │  fin de partida
             ▼
  [ Game over ] ──► ¿entra al top 10? ──sí──► [ Ingreso de nombre (5 caracteres) ]
             │                                              │
             └──────────────no──────────────┐               │
                                            ▼               ▼
                                     [ Tabla de récords del juego ]
                                            │
                                            ▼
                                     [ Selección de juego ]
```

La tabla de récords de cada juego también es accesible desde la pantalla de selección, sin
jugar.

**Decisión:** **no** se reproduce el ritual del salón. No hay pantalla de atracción, ni
ranura, ni contador de créditos, ni PUSH START: al tocar un juego, la partida empieza. El
escenario de uso es jugar tres minutos mientras pasa otra cosa, y la ceremonia añadiría
fricción en cada partida. La nostalgia se sostiene en el mueble, los controles, el sonido y
la fidelidad del juego, no en la espera.

## 5. El mueble (shell visual)

La app se presenta dentro de un mueble arcade vertical: marquesina arriba, pantalla con
bisel en el centro, panel de control abajo. La referencia visual del proyecto es
`consola1.jpg` (mueble oscuro, líneas de acento en el bisel y en el panel, marquesina
iluminada).

**Decisión:** mueble **único** para toda la app, con **color de acento por juego**. La
madera, el bisel, la forma del panel y la tipografía de sistema son idénticos siempre; lo
que cambia al entrar a un juego es el arte de la marquesina, el título y el color de las
líneas de acento.

Reglas:

1. El mueble es del shell. Ningún juego dibuja fuera de su pantalla.
2. La pantalla del juego mantiene la relación de aspecto de su versión de referencia. El
   espacio sobrante dentro del bisel es negro, como en un monitor real; **nunca** se
   deforma la imagen para llenar la pantalla del celular.
3. El escalado es a múltiplos enteros del píxel original cuando el dispositivo lo permita,
   para evitar píxeles de tamaño irregular.
4. La paleta y la tipografía *dentro* de la pantalla del juego son del juego y responden a
   su versión de referencia (Constitución, Art. 3.7).
5. El reparto vertical de la pantalla del celular —marquesina, pantalla, panel— es fijo y
   se define en la spec del shell. La pantalla del juego nunca queda tapada por el panel.

## 6. Controles

**Decisión:** el panel de control **lo declara cada juego** en su spec; el shell lo
renderiza. El layout base es constante (misma altura, misma posición del panel), lo que
cambia son los controles que contiene.

| Juego | Panel declarado |
|---|---|
| Space Invaders | Palanca horizontal (izquierda/derecha) + botón de disparo a la derecha |
| Pac-Man | Palanca de 4 direcciones, sin botón |
| Arkanoid | Palanca horizontal (izquierda/derecha) + botón de láser |
| Tetris | Palanca (izquierda/derecha/bajar) + botón(es) de rotación |

Reglas transversales:

1. **Feedback visual siempre, en ambas plataformas.** Todo control refleja visualmente el
   movimiento que se está haciendo sobre él: la palanca se inclina siguiendo el dedo, el
   botón se hunde, la palanca acompaña la dirección sostenida. Esto no es decoración: es la única
   confirmación de entrada que existe en una pantalla táctil sin relieve.
2. **Háptico solo en Android y solo en los controles.** Vibra el acto de accionar el
   control, nunca lo que ocurre en el juego (un impacto, una muerte, una línea completa no
   vibran). En iPhone no hay háptico; el feedback visual es idéntico en ambas plataformas.
3. **La zona táctil es más grande que el dibujo del control.** El dedo no debe requerir
   precisión visual.
4. **Ningún control se dibuja si el juego no lo declara.** No hay botones muertos.
5. La traducción de gesto táctil a entrada del juego original —cuántos píxeles de
   deslizamiento equivalen a cuánto movimiento, si la palanca es digital o analógica— es
   una decisión de la spec de cada juego y se registra como desviación (Constitución,
   Art. 1.6).

## 7. Audio

**Decisión:** el audio está **dentro de alcance** y se reconstruye con la misma exigencia
de fidelidad que el resto. No es ambientación: en Space Invaders la marcha de cuatro tonos
que acelera a medida que la horda se reduce es parte del diseño del juego, y sin ella el
juego no se siente igual.

Reglas:

1. **Reconstruido, no muestreado de la máquina original.** Los sonidos se reconstruyen a
   partir de la documentación del hardware de sonido y de la implementación de referencia
   declarada, con la misma trazabilidad que cualquier otra constante (Constitución,
   Art. 1.4).
2. **El audio es una capacidad del núcleo.** El núcleo expone reproducción de sonido; los
   juegos declaran qué suena y cuándo. El núcleo no conoce los sonidos de ningún juego.
3. **El audio obedece a los ticks, no al reloj del sistema.** Los sonidos que dependen del
   estado del juego —la marcha que acelera, la sirena de Pac-Man según el modo de los
   fantasmas— se disparan desde la lógica en ticks. Al pausar, el audio se detiene con la
   simulación; al reanudar, retoma en el mismo punto del estado.
4. **Silencio conmutable en dos lugares.** El sonido se prende y se apaga (a) **en vivo,
   durante la partida**, desde un control siempre visible en el mueble, sin pausar el juego
   ni interrumpir la simulación; y (b) **antes de entrar**, desde la pantalla de selección
   de juego. El estado es uno solo, global a la app, y se recuerda localmente en el
   dispositivo. Es un requisito de uso, no una preferencia: el escenario declarado es jugar
   mientras pasan otras cosas.
5. **Restricción de plataforma.** iOS y Android no permiten iniciar audio sin un gesto
   previo del usuario. El primer toque del jugador habilita el audio; la app nunca queda
   muda de forma silenciosa ni pide permiso con un diálogo propio.

## 8. Sistema de récords

| Aspecto | Definición |
|---|---|
| Alcance | **Por juego.** No hay ranking unificado. |
| Tamaño | Top 10 por juego. |
| Contenido de la entrada | Nombre (máx. 5 caracteres), puntaje, fecha y hora. |
| Filtro de contenido | Ninguno. Decisión del propietario, coherente con el uso privado. |
| Desempate | A igual puntaje, **gana el más reciente** (queda más arriba). |
| Almacenamiento | Una única base de datos compartida entre los tres dispositivos. |
| Momento de ingreso del nombre | Al terminar la partida, **solo si el puntaje entra al top 10**. |
| Sin conexión | El récord se escribe primero en una **cola local en IndexedDB**, que es la fuente de verdad hasta que el servidor confirma. La cola se vacía al abrir la app, al recuperar el foco, al volver la conexión y al terminar cada partida. Un fallo de red nunca cuesta un récord ni bloquea el juego. |
| Límite de plataforma | La API de Background Sync —la que permitiría subir el récord con la app cerrada— **no existe en Safari de iOS, en ninguna versión**; sí está en Chrome de Android. En Android se usa como mejora oportunista. **En el iPhone, un récord conseguido sin conexión se sube la próxima vez que abras la app.** Es una limitación de la plataforma, no una decisión de diseño. |
| Estado visible | Mientras un récord está pendiente de envío, la tabla lo muestra marcado como no confirmado. |
| Conflicto | Si dos dispositivos suben récords en paralelo, la base de datos es la autoridad; el cliente relee tras escribir. |

La entrada del nombre reproduce el ritual arcade: selección de caracteres, no un campo de
texto del sistema operativo (el teclado del celular taparía la pantalla y rompería el
mueble). Alfabeto permitido y comportamiento exacto se definen en la spec del shell.

## 9. Ciclo de vida: pausa y reanudación

**Disparador.** La app se pausa cuando la pantalla **pierde visibilidad**: cambio de app,
llamada entrante, notificación a pantalla completa, bloqueo de pantalla, cambio de pestaña.

**Al pausar:**

1. La simulación se detiene inmediatamente, en el tick en curso.
2. Se congela **todo** el estado, incluidos los temporizadores internos del juego (duración
   del modo azul de los fantasmas, cadencia del OVNI, lock delay de una pieza, animación de
   explosión en curso). Esto es posible porque la lógica no usa relojes del entorno y toda
   temporización vive dentro del estado (Constitución, Art. 3.3).
3. La entrada táctil se descarta: no se acumulan pulsaciones ocurridas durante la pausa.
4. El estado se conserva **en memoria** (ver §14, riesgo aceptado).

**Al recuperar visibilidad:**

1. Se muestra una **cuenta regresiva visible de 3 segundos** sobre la pantalla congelada.
2. Durante la cuenta regresiva la simulación sigue detenida y los controles no responden.
3. Al llegar a cero, la simulación se reanuda exactamente donde quedó. No hay salto,
   avance compensatorio ni pérdida de frames.

**Pausa manual.** Existe además pausa manual desde el mueble, con el mismo comportamiento y
la misma cuenta regresiva al reanudar.

## 10. Rendimiento

| Requisito | Definición |
|---|---|
| Objetivo | **60 fps sostenidos** en los tres dispositivos objetivo. Es criterio de aceptación, no aspiración (Constitución, Art. 5). |
| Paso de simulación | Fijo, **normalizado a 60 Hz para todos los juegos**, independiente de la tasa de refresco real de la pantalla. |
| Desviación registrada | Ningún original corría a 60 Hz exactos (Pac-Man ~60,6 Hz; Space Invaders ~59,5 Hz). Normalizar implica que Pac-Man corre ~1 % más lento y Space Invaders ~1 % más rápido que sus originales. Se acepta por simplicidad del núcleo y se registra como desviación en la spec de cada juego (Constitución, Art. 1.6). |
| Degradación | Si el dispositivo no alcanza, se pierde fluidez de animación, **nunca** velocidad de juego. Un juego que corre más lento o más rápido que el original es un defecto. |
| Arranque | La app debe estar jugable en pocos segundos desde el icono, sin conexión. |
| Medición | Cada juego se mide en dispositivo real antes de considerarse terminado, no en emulador de escritorio. |

## 11. Instalación y distribución

| Plataforma | Modo |
|---|---|
| Android (2 dispositivos) | **PWA instalable**: icono en el escritorio, pantalla completa sin barra del navegador, funcionamiento sin conexión. |
| iPhone (1 dispositivo) | **Web normal** en el navegador, sin instalación. Debe verse y jugarse bien conviviendo con la barra de Safari. |

Requisitos derivados:

1. Todos los recursos del juego se cachean localmente; una partida no depende de la red.
2. Solo los récords requieren red, y su fallo es tolerado (§8).
3. La actualización de la app no puede interrumpir una partida en curso.
4. El diseño del shell contempla las dos alturas útiles distintas (pantalla completa en
   Android, con barra en iPhone) sin que la pantalla del juego cambie de proporción.

## 12. Criterios de aceptación del producto

El producto —no un juego— se considera aceptable cuando:

1. Los cuatro juegos son reconocibles como sus originales por alguien que los jugó en los 80.
2. Cada juego cumple los criterios de aceptación de su propia spec.
3. Los tres dispositivos leen y escriben la misma tabla de récords.
4. La pausa por pérdida de visibilidad conserva el estado completo, verificada explícitamente
   con un evento temporal en curso (no solo con la nave quieta).
5. Se sostienen 60 fps en los tres dispositivos.
6. El audio de cada juego es reconocible respecto de su original, se detiene con la pausa y
   se puede silenciar desde el mueble.
7. La app funciona sin conexión, y los récords generados sin conexión llegan a la base de
   datos al recuperarla.
8. Está instalada como PWA en los dos Android y se usa como web en el iPhone.
9. Agregar un quinto juego no requiere modificar núcleo ni shell.

## 13. Decisiones pendientes

| ID | Decisión | Bloquea |
|---|---|---|
| PEND-05 | Nombre de la app y arte de la marquesina principal. | Spec del shell |

Resueltas: PEND-01 (Space Invaders a color, §3.1.1) · PEND-02 (audio dentro de alcance, §7)
· PEND-03 (simulación normalizada a 60 Hz, §10) · PEND-04 (sin ritual arcade, §4).

## 14. Riesgos aceptados

| Riesgo | Decisión | Consecuencia asumida |
|---|---|---|
| **Estado solo en memoria.** Si el sistema operativo descarta la pestaña en segundo plano —escenario frecuente en iOS Safari—, la partida se pierde pese a la pausa. | El propietario eligió no persistir snapshots. | Se pierde la partida tras ausencias largas. Mitigación disponible a futuro sin rediseño: el estado ya es serializable por diseño, así que agregar el snapshot es aditivo. |
| **Arkanoid se juega con palanca, no con perilla.** La perilla original es analógica, continua y sin tope; una palanca digital mueve la paleta a velocidad constante en una dirección. | Decisión del propietario: es más práctico en táctil y pocos conocieron la perilla. | Cambia la habilidad alcanzable, no solo la sensación: el reposicionamiento rápido y preciso del original no existe. Los récords de Arkanoid no son comparables con los de la máquina real. Debe quedar como desviación mayor en su spec. |
| **Documentación primaria pobre en Arkanoid.** | Se admite implementación de referencia y observación como fuente. | Sus constantes quedarán marcadas mayoritariamente como `DERIVADO`. |
| **El núcleo se valida con el juego más simple.** | Space Invaders es el piloto; el segundo juego prueba el contrato. | Riesgo de rediseño del núcleo al llegar a Pac-Man. Es el motivo de la regla del segundo juego. |
| **Un récord hecho sin conexión en el iPhone no sube hasta que reabras la app.** | Impuesto por la plataforma: Safari de iOS no implementa Background Sync. | Un récord puede tardar horas o días en aparecer en los otros dispositivos. La cola local garantiza que no se pierde. |
| **Sin filtro de contenido en los nombres.** | Decisión del propietario, uso privado. | Debe revisarse antes de cualquier escenario de publicación. |
