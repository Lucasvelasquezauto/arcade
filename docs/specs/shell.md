# Spec — `@arcade/shell` (el mueble)

**Versión:** 1.0 — **APROBADA** por el propietario el 2026-09-03
**Fecha:** 2026-09-03
**Documentos superiores:** `constitution.md`, `product-spec.md`, `stack-proposal.md`
**Referencia visual:** `docs/reference/consola1.jpg`

---

## 1. Alcance

El shell es todo lo que el jugador ve **fuera** de la pantalla del juego: el mueble, los
controles, los menús, la tabla de récords y los overlays.

**No sabe qué juegos existen.** Recibe el catálogo y lo renderiza. Un `if` por juego en
este paquete es una violación del Art. 3.8. Lo único que un juego le comunica es lo que
declara en su `GameModule`: título, color de acento, resolución y panel de control.

Construido con **Preact + Signals**. El `<canvas>` del juego se monta una sola vez y queda
**fuera del árbol de render** del framework: el bucle del núcleo dibuja sobre él a 60 Hz y
Preact no debe re-renderizarlo nunca.

## 2. Riesgo principal de este paquete

El error que hay que prevenir por diseño: **que el estado del juego termine dentro del
estado del framework**. Si una señal de Preact contiene estado de la partida, se rompen el
determinismo, la pausa y la serialización, y se rompen en silencio.

**Regla:** el shell puede leer del núcleo el puntaje, el estado de pausa y el estado de la
cola de récords —datos de presentación—, y nada más. El estado del juego vive en el núcleo
y no entra al shell jamás.

## 3. Layout vertical

Tres franjas fijas, de arriba abajo:

```
┌──────────────────────┐
│      MARQUESINA      │  título del juego, arte, acceso a diagnóstico
├──────────────────────┤
│                      │
│   BISEL + PANTALLA   │  canvas del juego, centrado, con bandas negras
│                      │
├──────────────────────┤
│   PANEL DE CONTROL   │  palanca izquierda, botones derecha
└──────────────────────┘
```

Reglas:

1. **Orientación vertical fija.** La app no rota ni ofrece modo horizontal.
2. **La pantalla del juego nunca queda tapada por el panel.** El panel tiene altura mínima
   garantizada y la pantalla ocupa lo que sobra, no al revés.
3. **Dos alturas útiles distintas:** Android instalado como PWA va a pantalla completa;
   iPhone convive con la barra de Safari. El reparto debe funcionar en ambas sin que la
   pantalla del juego cambie de proporción. Se respetan las áreas seguras del dispositivo.
4. **El mueble es uno solo** para toda la app: madera, bisel, forma del panel y tipografía
   de sistema idénticos siempre.
5. **Lo único que cambia por juego** es el arte y el título de la marquesina, y el **color
   de acento** de las líneas del bisel y del borde del panel, que el juego declara.

## 4. Pantallas

| Pantalla | Contenido |
|---|---|
| **Selección** | Lista de juegos del catálogo. Cada uno: título, marquesina, acceso directo a su tabla de récords. Control de silencio disponible aquí. Al tocar un juego, **la partida arranca de inmediato**: no hay atracción, ni ranura, ni créditos (`product-spec.md` §4). |
| **Juego** | Mueble completo con el canvas activo y el panel que el juego declaró. |
| **Fin de partida** | Puntaje final. Si entra al top 10, pasa a ingreso de nombre; si no, a la tabla de récords. |
| **Ingreso de nombre** | Máximo 5 caracteres, con **selector de caracteres tipo arcade**, nunca el teclado del sistema: taparía la pantalla y rompería el mueble. Alfabeto: A–Z, 0–9 y espacio. Sin filtro de contenido. |
| **Tabla de récords** | Top 10 del juego, con nombre, puntaje y fecha. Los récords pendientes de subir se muestran marcados como no confirmados. |

## 5. Panel de control

El shell renderiza **lo que el juego declara** en su `ControlPanel`, y nada más. Sin
botones muertos: un control que el juego no declaró no se dibuja.

Reglas transversales:

1. **Feedback visual siempre, en las dos plataformas.** La palanca se inclina siguiendo el
   dedo; el botón se hunde; el estado se ve mientras el control está accionado. No es
   decoración: en una pantalla sin relieve es la única confirmación de que el control
   respondió. En iPhone, donde no hay vibración, es la **única** que existe.
2. **El feedback visual no puede depender del tick del juego.** Responde al toque de
   inmediato, aunque el juego esté pausado o cargando.
3. **Háptico solo en Android y solo al accionar el control**, nunca por eventos del juego.
4. **Zonas táctiles generosas**, mayores que el dibujo. Mínimo 44 px de lado.
5. **Multitáctil:** palanca y botón simultáneos, con dedos distintos.
6. La palanca es visualmente analógica y funcionalmente digital: se inclina de forma
   continua, pero entrega -1, 0 o 1.

## 6. Overlays

1. **Pausa:** oscurece la pantalla del juego sin ocultarla. El jugador debe ver dónde
   quedó.
2. **Cuenta regresiva:** 3, 2, 1 sobre la pantalla congelada. Los controles se ven inertes
   —sin feedback de accionamiento— durante la cuenta.
3. Ambos los dibuja el shell; quién y cuándo lo decide el núcleo.

## 7. Silencio

Control siempre visible en el mueble durante la partida, que **conmuta en vivo sin pausar**,
y disponible también en la pantalla de selección. Un solo estado global, persistido
localmente.

## 8. Diagnóstico

Pulsación larga sobre la marquesina abre la pantalla de diagnóstico del núcleo (§9 de
`docs/specs/core.md`). El shell solo la presenta; los datos son del núcleo.

## 9. Criterios de aceptación

1. El mueble se ve correcto y completo en los tres dispositivos, con y sin barra del
   navegador, sin recortes ni desbordes.
2. La pantalla del juego conserva su relación de aspecto en las tres pantallas.
3. Cada juego del catálogo muestra su marquesina y su color de acento sin que el shell
   contenga ninguna referencia a un juego concreto.
4. Los cuatro paneles declarados en `product-spec.md` §6 se renderizan correctamente, sin
   controles sobrantes.
5. La palanca y un botón responden simultáneamente con dedos distintos.
6. El feedback visual del control responde de inmediato incluso con el juego pausado.
7. Se puede ingresar un nombre de 5 caracteres sin que aparezca el teclado del sistema.
8. El silencio conmuta durante la partida sin interrumpirla, y desde la selección.
9. Una búsqueda de identificadores de juego en `packages/shell/**` no encuentra ninguno.
10. `pnpm verify` pasa en limpio.

## 10. Prohibiciones

- Ninguna referencia a un juego concreto.
- Ningún estado de partida dentro de señales o estado de Preact.
- Ningún re-render del framework sobre el canvas del juego.
- Ninguna dependencia de UI de terceros: sin librería de componentes, sin framework de
  estilos. El mueble es específico y se dibuja a mano.
