# Spec — `@arcade/core` (la plataforma)

**Versión:** 1.0 — **APROBADA** por el propietario el 2026-09-03
**Fecha:** 2026-09-03
**Documentos superiores:** `constitution.md`, `product-spec.md`, `stack-proposal.md`
**Contratos que implementa:** `@arcade/contracts`

---

## 1. Alcance

El núcleo es **la plataforma, no un motor de juego** (Art. 3.5). Provee todo lo que
cualquier juego necesita del mundo exterior, y nada de lo que un juego concreto necesita
de sí mismo.

**Incluye:** bucle a paso fijo, ciclo de vida y pausa, entrada táctil normalizada,
superficie de dibujo sobre Canvas 2D, reproducción de audio, háptico, persistencia de
récords con cola offline, y diagnóstico.

**No incluye —y no puede incluir—:** entidades, colisiones, físicas, sprites, ninguna
abstracción del mundo del juego, y **ninguna condicional por juego**. `if (game.id ===
'pacman')` en este paquete es una violación de la constitución, no un atajo.

El núcleo recibe un `AnyGameModule` ya construido y lo opera sin saber qué es.

## 2. Bucle a paso fijo

**Contrato:** la simulación avanza en ticks de `TICK_MS` (16.667 ms, 60 Hz normalizados),
independientemente de la tasa de refresco real de la pantalla.

```
cada frame del navegador:
  acumulador += tiempo transcurrido desde el frame anterior
  mientras acumulador >= TICK_MS y ticks_en_este_frame < MAX_TICKS_POR_FRAME:
      estado = juego.step(estado, entrada_del_tick)
      reproducir sonidos devueltos
      acumulador -= TICK_MS
  alpha = acumulador / TICK_MS
  juego.draw(estado, superficie, alpha)
```

Reglas:

1. **`MAX_TICKS_POR_FRAME = 5`.** Si el dispositivo se atrasa más que eso, el exceso del
   acumulador **se descarta**. Sin este tope, un frame lento genera una avalancha de ticks
   que genera frames más lentos: el juego se congela en espiral. Perder unos ticks es un
   salto visible; la espiral es un cuelgue.
2. **Nunca se recupera tiempo tras una pausa.** Al reanudar, el acumulador se pone en cero.
   El tiempo que el juego estuvo pausado no existió para la simulación.
3. **`alpha` es solo presentación.** Un juego que lo ignora es correcto; cambia la suavidad
   del movimiento, jamás la simulación.
4. **`draw` no decide nada.** Dibujar dos veces el mismo estado produce la misma imagen.
5. El bucle usa `requestAnimationFrame` y el reloj del entorno. **El núcleo sí puede usar
   relojes; la lógica de juego no.** Esa asimetría es toda la arquitectura del Art. 3.3.

## 3. Ciclo de vida y pausa

**Disparadores de pausa.** `visibilitychange` a `hidden`, `pagehide`, y pérdida de foco de
la ventana. Se escuchan los tres porque ninguno cubre solo todos los casos entre Android y
iOS.

**Al pausar:**

1. Se detiene el bucle en el tick en curso. No se completa un tick a medias.
2. El acumulador se descarta.
3. Todo el audio se detiene, incluidos los loops.
4. La entrada se descarta: se olvida qué botones estaban presionados. Nada de lo que ocurra
   con el dedo mientras la app está oculta llega al juego.
5. **El estado del juego no se toca.** No hay que congelarlo: ya está congelado, porque
   todo su tiempo vive dentro de él (Art. 3.3). Esto es lo que hace que el requisito sea
   una consecuencia del diseño y no una funcionalidad aparte.
6. El estado se conserva **solo en memoria**. Decisión del propietario; riesgo registrado
   en `product-spec.md` §14.

**Al recuperar visibilidad:**

1. Cuenta regresiva visible de **3 segundos**, sobre la pantalla congelada, dibujada por el
   shell.
2. Durante la cuenta regresiva: simulación detenida, controles inertes, audio en silencio.
3. La cuenta regresiva se mide con el reloj del entorno, no en ticks: no es parte de la
   simulación.
4. Si la app pierde visibilidad **durante** la cuenta regresiva, la cuenta se reinicia
   desde 3 al volver.
5. Al llegar a cero se reanuda exactamente donde quedó.

**Pausa manual.** Mismo comportamiento, misma cuenta regresiva al reanudar.

## 4. Entrada táctil

El núcleo traduce toques a `InputState` (`@arcade/contracts`). El juego nunca ve dedos,
píxeles ni eventos de puntero.

1. **Muestreo continuo, instantánea por tick.** Los eventos táctiles llegan cuando el
   navegador quiere; el núcleo mantiene un estado vivo y toma una instantánea al inicio de
   cada tick.
2. **`pressed` es un flanco, y no se puede perder.** Vale `true` en un tick si el botón
   pasó de suelto a presionado **en algún momento desde la instantánea anterior**, aunque
   el jugador lo haya soltado antes de que el tick ocurriera. Un disparo entre dos ticks es
   un disparo, no un evento perdido: a 60 Hz eso pasa y se nota.
3. **La palanca es digital**, según lo que declare el juego: `horizontal` produce `x` en
   {-1, 0, 1} con `y` siempre 0; `four-way` produce una sola dirección a la vez, nunca
   diagonales, resolviendo el conflicto a favor del eje con mayor desplazamiento del dedo.
4. **Zona muerta.** Un desplazamiento menor al umbral declarado en la spec del shell deja
   la palanca centrada, para que apoyar el dedo no sea moverse.
5. **Multitáctil obligatorio.** Palanca y botón se usan a la vez, con dedos distintos, sin
   que uno cancele al otro.
6. La zona táctil es más grande que el dibujo del control (`product-spec.md` §6.3).

## 5. Superficie de dibujo

Implementa `DrawSurface` sobre Canvas 2D. El juego dibuja en **sus** píxeles lógicos; el
núcleo hace el resto.

1. **Escalado a múltiplo entero** del tamaño lógico, el mayor que quepa. Un píxel del juego
   son N píxeles reales, con N entero. Nunca 1.4: eso produce píxeles de tamaño irregular y
   se ve mal en juegos de sprites.
2. **Suavizado desactivado** (`imageSmoothingEnabled = false`).
3. **Bandas negras** alrededor del área útil, dentro del bisel, como un monitor real. Nunca
   se deforma la imagen para llenar la pantalla.
4. Se respeta `devicePixelRatio` para que el escalado entero se calcule en píxeles físicos.
5. Los sprites se cargan del manifiesto declarado por el juego y se resuelven por
   identificador. El núcleo no conoce ningún sprite concreto.

## 6. Audio

1. **Web Audio API.** Un contexto único para toda la app.
2. **Desbloqueo por gesto.** iOS y Android no permiten iniciar audio sin interacción: el
   primer toque del jugador desbloquea el contexto. La app nunca pide permiso con un
   diálogo propio ni queda muda en silencio.
3. **El núcleo reproduce lo que el juego devuelve**, nunca lo que decide. Los `SoundEvent`
   llegan como resultado de `step`.
4. **`loop` con `rate`** cambia la velocidad de un loop en curso sin reiniciarlo. Es lo que
   permite que la marcha de Space Invaders acelere de forma continua.
5. **Silencio global**, conmutable durante la partida sin pausarla y desde la pantalla de
   selección. Estado único, persistido localmente en el dispositivo.
6. Al pausar, todo el audio se detiene; al reanudar, los loops que el estado del juego
   siga pidiendo vuelven solos, porque se re-emiten desde `step`.

## 7. Háptico

1. `navigator.vibrate`, únicamente. Sin librerías.
2. **Solo al accionar un control**, nunca por eventos del juego. Un impacto, una muerte o
   una línea completa **no vibran** (`product-spec.md` §6.2).
3. En iPhone no hay háptico y no se intenta emular. El feedback visual del control es
   idéntico en ambas plataformas.
4. Se detecta la capacidad, no la plataforma: si `vibrate` no existe o falla, se ignora en
   silencio.

## 8. Récords

1. **La cola local es la fuente de verdad** hasta que el servidor confirma. Un récord se
   escribe primero en IndexedDB y solo después se intenta enviar.
2. Cada récord lleva un **identificador generado en el cliente**, para que un reintento
   tras una respuesta perdida no cree un duplicado.
3. **La cola se vacía** al abrir la app, al recuperar el foco, al volver la conexión
   (evento `online`) y al terminar cada partida.
4. Un récord pendiente **se muestra en la tabla marcado como no confirmado**, con su
   puntaje real: el jugador ve su récord aunque no haya red.
5. **El servidor es la autoridad del orden.** Tras una escritura confirmada se relee el top
   10; el cliente no lo calcula.
6. **Un fallo de red nunca bloquea el juego ni cuesta un récord.** Ninguna operación de red
   está en la ruta de una partida.
7. Background Sync se usa **solo como mejora oportunista** donde exista. No existe en
   Safari de iOS y el diseño no depende de él (`product-spec.md` §8).
8. Las credenciales llegan por variables de entorno. Nunca versionadas (Art. 6.3).

## 9. Diagnóstico

Pantalla oculta, accesible con pulsación larga en la marquesina. Existe porque los
criterios de aceptación exigen medir en dispositivo real, y el propietario trabaja en
Windows: sin esto, validar un iPhone significa "a ojo".

Muestra: fps real, ticks por segundo, ticks perdidos por el tope del bucle, tamaño de la
cola de récords, estado de la conexión, y el registro de los últimos eventos de pausa con
su duración.

No es una herramienta de desarrollo que se quita antes de publicar: es parte del producto.

## 10. Criterios de aceptación

1. Con `test-pattern` corriendo, se sostienen **60 fps** en los tres dispositivos.
2. Un test de determinismo: la misma secuencia de entradas produce el mismo estado final,
   comparado por `snapshot()`.
3. Un test de pausa: `snapshot` → pausar → reanudar → simular N ticks produce **exactamente**
   el mismo estado que simular N ticks sin pausar, con un temporizador interno corriendo
   durante la pausa.
4. Un test del tope del bucle: un frame artificialmente largo no produce más de
   `MAX_TICKS_POR_FRAME` ticks.
5. Un test del flanco de entrada: una pulsación y suelta entre dos ticks produce
   `pressed: true` exactamente una vez.
6. Cambiar de app y volver muestra la cuenta regresiva de 3 s y reanuda sin salto.
7. Un récord generado en modo avión queda en cola, se muestra como no confirmado y sube al
   recuperar conexión.
8. El escalado es de múltiplo entero en las tres pantallas, verificado visualmente.
9. `pnpm verify` pasa en limpio.
10. `grep` de identificadores de juego en `packages/core/**` no encuentra ninguno.

## 11. Prohibiciones

- Ninguna condicional ni constante por juego.
- Ningún import de `packages/games/**` ni de `packages/shell/**`.
- Ninguna dependencia de terceros sin aprobación previa.
- Ninguna decisión de gameplay: si el núcleo tiene que saber qué hace un juego, el contrato
  está mal y se corrige el contrato.
