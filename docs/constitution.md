# Constitución del proyecto Arcade

**Versión:** 1.0 (borrador para aprobación)
**Fecha:** 2026-09-03
**Estado:** pendiente de aprobación por el propietario del proyecto (Lucas)

---

## 0. Naturaleza de este documento

Este documento define los principios **no negociables** del proyecto. No describe qué se
construye (eso es `product-spec.md`) ni cómo se construye técnicamente (eso son las specs
por módulo). Define **cómo se decide** y **qué nunca se hace**, sin importar el juego, el
agente o la fase.

**Jerarquía de autoridad.** Ante conflicto, manda el documento de mayor jerarquía:

| # | Fuente | Autoridad |
|---|--------|-----------|
| 1 | Esta constitución | Máxima. Solo el propietario la enmienda. |
| 2 | `product-spec.md` | Alcance y comportamiento del producto. |
| 3 | Spec aprobada del módulo o juego | Fuente de verdad para implementar. |
| 4 | Documento de investigación del juego | Sustento factual de la spec. |
| 5 | Código existente | La menor. El código nunca justifica una decisión. |

Ningún agente —humano o LLM— puede invocar "así lo hizo el otro agente", "así suele
hacerse" o "lo recuerdo del original" como fundamento. La memoria del modelo **no es
fuente**.

**Enmiendas.** Cambiar esta constitución requiere aprobación explícita del propietario y
un registro en la sección 8 (Historial). Los agentes pueden *proponer* enmiendas; nunca
aplicarlas.

---

## Artículo 1 — Fidelidad al original, investigada antes de programar

**Principio.** La app reproduce juegos arcade de los 80 como fueron, no como se recuerdan
ni como sería más cómodo implementarlos. Cuando la fidelidad y la conveniencia técnica
entren en conflicto, gana la fidelidad; si la fidelidad es técnicamente inviable en el
target, se documenta la desviación y se aprueba explícitamente.

**Reglas.**

1. **Investigación previa obligatoria.** Ningún juego pasa a spec sin un documento de
   investigación aprobado en `docs/research/<juego>.md`. Ningún juego pasa a código sin
   spec aprobada. El orden es inviolable: **investigar → especificar → aprobar → codificar**.
2. **Cobertura mínima de la investigación.** Cada documento debe cubrir, con fuente citada:
   - Resolución nativa, relación de aspecto, orientación del monitor y paleta de colores.
   - Geometría del campo de juego en unidades del original (píxeles, celdas, tiles).
   - Velocidades, aceleraciones y temporizaciones en **frames del hardware original**
     (típicamente 60 Hz o 59.94 Hz), no en milisegundos redondeados.
   - Tabla de puntajes completa, incluidos casos especiales y bonificaciones.
   - Reglas de progresión: niveles, dificultad, vidas extra, condiciones de fin.
   - Comportamiento de IA / patrones de los enemigos, incluidos estados y transiciones.
   - Controles originales y su mapeo a entrada táctil.
   - Bugs y comportamientos emergentes conocidos, con decisión explícita de replicar u omitir.
3. **Versión de referencia canónica y fuentes.** Cada juego declara en su documento de
   investigación una **versión de referencia canónica**: la variante concreta cuya
   estética, controles, jugabilidad y puntaje se reproducen. El criterio de elección es la
   versión **popularmente reconocida de los años 80** —la que satisface la nostalgia—, no
   necesariamente la primera publicada ni la técnicamente más pura. Elegida la versión, se
   elige también una **implementación de referencia**: una reimplementación o port
   completo y bien comentado, citado por nombre y versión, del que sí está permitido tomar
   comportamiento. Fuentes admitidas, en orden de peso:
   (a) documentación técnica del hardware y desensamblados públicos comentados;
   (b) la implementación de referencia elegida, y otras reimplementaciones completas y
   documentadas;
   (c) análisis técnicos y wikis especializadas con referencia primaria;
   (d) observación de gameplay original en video.
   Nunca: la memoria del modelo, ni blogs sin fuente, ni una implementación de referencia
   distinta a la declarada sin registrarlo.
4. **Trazabilidad con nivel de confianza.** Toda constante numérica que exista en el
   código (velocidad, puntaje, umbral, duración) debe poder rastrearse a una línea del
   documento de investigación, marcada como `VERIFICADO` (fuente (a) o (c) con referencia
   primaria) o `DERIVADO` (tomada de la implementación de referencia o de observación).
   Ambas son válidas; la distinción existe para saber qué revisar cuando algo "no se
   siente" como el original. Constantes sin origen documentado son deuda que bloquea la
   validación del juego.
5. **Validación estética por el propietario.** Antes de escribir la spec de un juego, su
   documento de investigación debe **presentar opciones gráficas comparadas** —variantes
   de la máquina, paletas, tipografías, proporciones de sprites— y el propietario elige la
   que corresponde a su recuerdo. La elección queda registrada en el documento y se vuelve
   vinculante. Ningún agente decide por su cuenta "cuál se ve más como el original": la
   nostalgia es el criterio, y el propietario es el único que la tiene.
6. **Desviaciones explícitas.** Toda diferencia deliberada respecto del original —por
   input táctil, por rendimiento, por resolución del dispositivo— se registra en la
   sección "Desviaciones" de la spec del juego, con motivo y alternativa descartada.
   Una desviación no registrada es un defecto, no una decisión.

---

## Artículo 2 — Spec-driven development

**Principio.** La spec aprobada es la fuente de verdad. El código es una consecuencia de
la spec, no al revés.

**Reglas.**

1. **Ningún agente escribe código sin una spec aprobada y guardada en el repositorio.**
   Sin spec, el agente se detiene y la solicita; no improvisa ni "avanza mientras tanto".
2. **Una spec por unidad de trabajo.** Cada juego, el núcleo compartido y el shell visual
   tienen su propia spec versionada. Cada spec declara: alcance, interfaces públicas de
   entrada/salida, invariantes, criterios de aceptación verificables y desviaciones.
3. **Criterios de aceptación verificables.** Una spec sin criterios comprobables (por
   test automatizado o por procedimiento manual escrito) no está lista para aprobación.
4. **El código no enmienda la spec.** Si al implementar se descubre que la spec está mal,
   el agente **detiene la implementación**, propone el cambio de spec y espera aprobación.
   Cambiar el comportamiento y "actualizar la spec después" está prohibido.
5. **Aislamiento entre agentes.** Cada agente trabaja contra la spec y contra las
   interfaces publicadas del núcleo, nunca contra el código en progreso de otro agente.
   Un agente no lee ni copia decisiones de la carpeta de otro juego para justificar las
   suyas.
6. **Contratos antes que implementaciones.** Las interfaces del núcleo compartido se
   especifican y congelan antes de que los juegos las consuman. Cambiar un contrato ya
   publicado requiere aprobación y actualización simultánea de todos los consumidores.
7. **Ambigüedad = pregunta, no suposición.** Ante una spec ambigua, el agente pregunta.
   Si opera sin supervisión, escoge la opción más fiel al original, la marca como
   `SUPUESTO` en el documento y la deja visible para revisión.

---

## Artículo 3 — Modularidad: tres capas separadas

**Principio.** La lógica de juego, el núcleo compartido y la presentación visual son
capas independientes con dependencias en una sola dirección.

```
                 ┌──────────────────────────────┐
                 │   SHELL / PRESENTACIÓN       │   marco de maquinita, controles
                 │   (mueble, joystick, botón,  │   táctiles, menús, tabla de récords
                 │    menús, hápticos, overlay) │
                 └──────────────┬───────────────┘
                                │ usa
                 ┌──────────────▼───────────────┐
                 │   NÚCLEO COMPARTIDO          │   game loop, entrada normalizada,
                 │   (plataforma, contratos)    │   pausa/reanudación, récords, render
                 └──────────────┬───────────────┘
                                │ orquesta
                 ┌──────────────▼───────────────┐
                 │   LÓGICA DE JUEGO (por juego)│   estado puro, reglas, IA, puntaje
                 │   pura, determinista, sin DOM│
                 └──────────────────────────────┘
```

**Reglas.**

1. **La lógica de juego es pura y determinista.** No conoce el DOM, ni el canvas, ni el
   dispositivo, ni la red, ni la base de datos, ni la hora del sistema. Recibe estado +
   entrada + delta y devuelve estado nuevo. Misma entrada ⇒ mismo resultado, siempre.
2. **Sin aleatoriedad implícita.** Cualquier azar usa un generador con semilla provisto
   por el núcleo. `Math.random()` está prohibido en la lógica de juego.
3. **Sin relojes del entorno, pero con temporización de primera clase.** La lógica de
   juego no usa `setTimeout`, `setInterval`, `Date.now()` ni `performance.now()`. Todo
   tiempo entra como *ticks* provistos por el núcleo. Para que esta disciplina no sea
   costosa, el núcleo **debe** ofrecer una primitiva de temporización determinista
   (contadores y agenda de eventos por ticks) que viva **dentro del estado serializable
   del juego**: expresar "dentro de 90 frames ocurre X" debe ser tan barato como un
   `setTimeout`, y además congelable, restaurable y reproducible. Si un agente siente la
   necesidad de un temporizador del entorno, el defecto está en la primitiva del núcleo,
   no en la regla.
4. **Dependencias en una sola dirección.** Presentación → núcleo → lógica de juego. El
   núcleo no importa nada de un juego concreto; la lógica de un juego no importa nada del
   shell. Ningún juego importa código de otro juego, nunca.
5. **El núcleo es una plataforma, no un motor de juego.** El núcleo provee ciclo de vida,
   bucle a paso fijo, entrada normalizada, pausa y reanudación, temporización por ticks,
   azar con semilla, superficie de render, persistencia de récords y ciclo PWA. **No**
   provee entidades, colisiones, físicas ni una abstracción unificada del mundo.
6. **Cada juego es un desarrollo independiente.** Dentro de su capa, cada juego decide su
   propia organización interna, sus estructuras de datos y su forma de representar el
   mundo: Pac-Man en grilla con túnel, Tetris en matriz lógica, Space Invaders y Arkanoid
   en coordenadas libres. No se les impone una abstracción común. Un juego no importa
   código de otro juego, nunca, ni siquiera "para no repetir".
7. **Lo que sí comparten es la plataforma y el modelo estético de la app.** El mueble,
   los controles táctiles, los menús, la tabla de récords, la tipografía de sistema y el
   comportamiento de pausa son del shell y son iguales para todos. La paleta, los sprites
   y la tipografía *dentro* de la pantalla del juego son de cada juego y responden a su
   versión de referencia canónica.
8. **El núcleo no conoce a los juegos.** No contiene condicionales por juego
   (`if (game === 'pacman')` es una violación de esta constitución). Agregar un juego no
   modifica el núcleo; si obliga a tocarlo, el contrato estaba mal diseñado: se corrige el
   contrato, no se parcha el juego.

---

## Artículo 4 — Un juego validado completo antes de paralelizar

**Principio.** El primer juego (**Space Invaders**) es el que valida la arquitectura. Hasta
que esté terminado y aprobado, no se abre trabajo paralelo sobre los demás.

**Reglas.**

1. **Prohibida la paralelización prematura.** Mientras el juego piloto no cumpla su
   criterio de cierre, no se crean carpetas, specs de implementación ni agentes para los
   otros juegos. La *investigación* de otros juegos sí puede adelantarse: no toca código.
2. **Criterio de cierre del juego piloto.** Se considera validado cuando, simultáneamente:
   - Cumple todos los criterios de aceptación de su spec.
   - Alcanza el objetivo de rendimiento definido en `product-spec.md` en los tres
     dispositivos objetivo reales.
   - Pausa y reanuda conservando el estado completo, incluidos temporizadores internos.
   - Guarda y lee récords contra la base de datos compartida, incluido el reintento tras
     pérdida de conexión.
   - Funciona instalado como PWA en Android y como web en iPhone.
   - Su lógica de juego no contiene ninguna referencia al DOM, al shell ni al reloj.
   - El núcleo expone contratos estables que un segundo juego podría consumir sin cambios.
3. **Revisión de arquitectura obligatoria al cierre.** Antes de paralelizar se hace una
   revisión explícita del núcleo: qué quedó acoplado al piloto, qué contrato hay que
   generalizar. El resultado se registra y se aplica **antes** de abrir el segundo juego.
4. **Segundo juego como prueba del contrato.** El segundo juego se implementa sin
   modificar el núcleo. Si no es posible, se detiene y se corrige el núcleo primero.
5. **Paralelización solo tras dos juegos.** Los juegos tercero y cuarto pueden abordarse
   en paralelo únicamente después de que el segundo confirme la estabilidad del contrato.

---

## Artículo 5 — Calidad y rendimiento como requisito, no como objetivo

1. El objetivo de 60 fps es un **criterio de aceptación**, no una aspiración. Un juego que
   no lo cumple en los dispositivos objetivo no está terminado.
2. La lógica de juego avanza a paso fijo, independiente de la tasa de refresco de la
   pantalla; la presentación puede interpolar. Un dispositivo lento produce animación
   menos fluida, nunca un juego que corre a otra velocidad.
3. Toda optimización se justifica con medición previa. No se optimiza por intuición ni se
   sacrifica fidelidad por rendimiento sin registrar la desviación (Artículo 1.5).
4. Sin dependencias innecesarias. Cada librería de terceros se justifica en la spec que la
   introduce; una librería que solo ahorra unas pocas líneas no entra.

---

## Artículo 6 — Datos y privacidad

1. Los récords son el **único** dato persistido. No se guarda partida, telemetría, ni
   identificador de dispositivo o de persona.
2. El nombre del récord es de máximo 5 caracteres y no se somete a filtro de contenido
   (decisión del propietario, coherente con el uso privado).
3. Las credenciales de la base de datos compartida nunca se versionan en el repositorio.
4. Un fallo de red **nunca** puede costar un récord ni bloquear el juego: se reintenta en
   segundo plano hasta lograr la escritura.

---

## Artículo 7 — Historial de enmiendas

| Versión | Fecha | Cambio | Aprobado por |
|---------|-------|--------|--------------|
| 1.0 | 2026-09-03 | Redacción inicial (borrador) | pendiente |

---

## Anexo A — Lista de verificación para agentes

Antes de escribir una sola línea de código, el agente confirma:

- [ ] Existe documento de investigación aprobado para lo que voy a construir.
- [ ] Existe spec aprobada, guardada en el repo, y la he leído completa.
- [ ] Entiendo en qué capa vivo y qué me está prohibido importar.
- [ ] Toda constante que voy a escribir tiene origen documentado.
- [ ] Conozco los criterios de aceptación con los que se me va a evaluar.
- [ ] No estoy tomando decisiones basadas en el código de otro agente ni en mi memoria.
- [ ] Si algo es ambiguo, pregunto o lo marco como `SUPUESTO`; no lo resuelvo en silencio.
