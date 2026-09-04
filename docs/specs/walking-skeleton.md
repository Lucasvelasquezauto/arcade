# Spec — Esqueleto desplegable (walking skeleton)

**Versión:** 1.1
**Cambio v1.1 (2026-09-03):** se añade `client_id` al modelo de datos, requerido por la
idempotencia de la cola de récords especificada en `docs/specs/core.md` §8.2.
**Fecha:** 2026-09-03
**Estado:** pendiente de aprobación
**Documentos superiores:** `constitution.md`, `product-spec.md`, `stack-proposal.md`, `repo-structure.md`

---

## 1. Qué es y qué no es

El esqueleto es la app completa **sin ningún juego real**: mueble, navegación, ciclo de
vida, récords, PWA y despliegue, atravesados de punta a punta por un juego de prueba que no
pretende ser fiel a nada.

**No es un prototipo desechable.** Todo lo que se construye aquí es el núcleo y el shell
definitivos. Lo único desechable es el juego de prueba.

**Por qué primero.** Cada pieza de infraestructura de este proyecto es un punto donde el
primer intento falla: Vercel compilando un monorepo pnpm, la PWA instalándose de verdad en
Android, Safari de iOS con su barra y sus permisos de audio, Supabase con sus políticas de
acceso, la pausa por visibilidad comportándose distinto en cada sistema. Descubrir todo eso
ahora cuesta horas; descubrirlo con Space Invaders encima cuesta el doble, porque cada fallo
tendrá dos causas posibles.

**Este documento existe porque el Artículo 2 lo exige:** ningún agente escribe código sin
spec aprobada, y el esqueleto es código.

## 2. Alcance

### 2.1 Incluye

| Pieza | Qué se construye |
|---|---|
| Monorepo | Estructura de `repo-structure.md`, pnpm workspaces, TypeScript estricto, `CLAUDE.md` por carpeta |
| Verificación | `dependency-cruiser` + reglas ESLint constitucionales + Vitest, corriendo en CI |
| `contracts` | `GameModule`, entrada normalizada, superficie de render, panel de control, scheduler por ticks, RNG con semilla |
| `core` | Bucle a paso fijo 60 Hz, ciclo de vida y pausa por visibilidad, entrada táctil, render Canvas 2D con escalado entero, silencio global, hápticos, cliente de récords con cola IndexedDB |
| `shell` | Mueble completo: marquesina, bisel, panel, pantalla de selección, tabla de récords, ingreso de nombre de 5 caracteres, overlays de pausa y cuenta regresiva |
| `catalog` | Registro declarativo con una sola entrada: el juego de prueba |
| `games/test-pattern` | Juego de prueba (§3) |
| Supabase | Tabla de récords, políticas de acceso, migración versionada |
| Despliegue | Proyecto en Vercel desplegando desde el repo |
| PWA | Manifiesto, iconos, service worker, instalación verificada |

### 2.2 No incluye

- Ningún juego real, ninguna investigación, ningún sprite de los 80.
- Audio reconstruido: solo un tono de prueba que valide la cadena de audio y el silencio.
- Turborepo (entra al tercer juego).

## 3. El juego de prueba (`test-pattern`)

Un juego deliberadamente feo cuyo único propósito es **ejercitar todos los contratos**:

1. Un cuadrado que se mueve con la palanca y dispara con el botón — ejercita entrada y panel.
2. Un contador de puntaje que sube al disparar — ejercita puntaje y récords.
3. **Un temporizador visible de 10 segundos** que reinicia el cuadrado al llegar a cero —
   ejercita la primitiva de ticks y, sobre todo, **hace visible si la pausa congela o no los
   temporizadores internos**. Si al volver de una llamada el contador saltó, la pausa está mal.
4. Un tono corto al disparar — ejercita audio y silencio.
5. Una vibración al accionar el control en Android — ejercita hápticos.
6. Fin de partida a los 60 segundos — ejercita el flujo de récord.

Se queda en el repo permanentemente como **banco de pruebas del núcleo**, fuera del catálogo
de producción. Es el juego contra el que se verifica que un cambio en el núcleo no rompió
nada, sin depender de un juego real.

## 4. Criterios de aceptación

La validación ocurre en **dos puertas sucesivas**. No se pasa a la segunda sin aprobar la
primera. El orden no es burocracia: separa dos clases de fallo. Si algo se ve o se juega
mal y se descubre en el teléfono, no se sabe si el defecto es del juego o del dispositivo.

### 4.1 Puerta 1 — Validación en PC

Con el modo teclado (`product-spec.md` §2.1), sobre la URL desplegada. El propietario
aprueba tres cosas por separado, y puede rechazar cada una por su cuenta:

| # | Qué se aprueba |
|---|---|
| 1 | **Estética.** El mueble, la marquesina, el bisel, el panel, la tipografía y el color de acento. Es la primera vez que se ve la máquina completa. |
| 2 | **Controles.** La palanca y el botón responden, se animan al accionarlos, y el teclado se siente correcto. |
| 3 | **Funcionamiento.** Se elige un juego y arranca; el puntaje sube; los temporizadores internos corren; al perder visibilidad se pausa y al volver hay cuenta regresiva de 3 s y el estado retoma exactamente donde iba; se ingresa un nombre de 5 caracteres; el récord aparece en la tabla; un récord logrado sin conexión se encola y sube al reconectar; el sonido se prende y se apaga en partida y desde la selección. |
| 4 | **Verificación mecánica.** `pnpm verify` pasa en limpio **y falla a propósito** cuando se introduce un `setTimeout` en la lógica o un import cruzado entre juegos. |

**Lo que esta puerta NO aprueba, y no debe darse por bueno:** la sensación táctil, el
háptico, la instalación como PWA, y el rendimiento real. Sesenta cuadros por segundo en un
PC no dicen nada sobre un teléfono.

### 4.2 Puerta 2 — Validación en los tres dispositivos

Solo después de aprobar la puerta 1:

| # | Qué se verifica |
|---|---|
| 5 | Instalada como PWA en los dos Android, con icono propio y sin barra del navegador; funciona como web en el iPhone. |
| 6 | Funciona **sin conexión** tras la primera carga. |
| 7 | **60 fps sostenidos**, medidos con la pantalla de diagnóstico, no a ojo. |
| 8 | La pausa por cambio de app conserva el estado completo, verificada **con un temporizador corriendo**, no con el juego quieto. |
| 9 | Un puntaje entra al top 10 y **aparece en los otros dos dispositivos**. |
| 10 | Un récord logrado en modo avión queda encolado, se marca como no confirmado y sube al recuperar conexión (en el iPhone, al reabrir la app). |
| 11 | En Android vibra el control al accionarlo; en iPhone no vibra, pero el control se mueve igual. |
| 12 | La jugabilidad táctil es aceptable. Es un juicio del propietario, no una medición. |

### 4.3 Criterio estructural, verificable en cualquier momento

| # | Qué se verifica |
|---|---|
| 13 | Agregar un quinto juego no requiere modificar el núcleo ni el shell. |

## 5. Modelo de datos

Tabla única `scores`:

| Campo | Tipo | Regla |
|---|---|---|
| `id` | uuid | generado por el servidor |
| `client_id` | uuid | **generado por el cliente**, con restricción de unicidad. Es lo que hace que un reintento tras una respuesta perdida no cree un récord duplicado (ver `docs/specs/core.md` §8.2). Añadido en v1.1. |
| `game_id` | text | identificador del juego en el catálogo |
| `name` | text | exactamente 1–5 caracteres, validado en servidor |
| `score` | integer | ≥ 0 |
| `created_at` | timestamptz | del servidor, no del cliente (los relojes de los teléfonos mienten) |

- Índice por `(game_id, score desc, created_at desc)` — el desempate a favor del más reciente.
- Acceso: lectura pública, inserción pública, **sin actualización ni borrado** desde el
  cliente.
- El top 10 se calcula en el servidor.

**Riesgo conocido y aceptado:** con inserción pública y sin autenticación, cualquiera con la
URL y la clave anónima podría escribir récords. Es coherente con el uso privado declarado y
con no tener cuentas de usuario. Si alguna vez molesta, la mitigación es una función del
servidor con una clave compartida, no autenticación de usuarios.

## 6. Prerrequisitos que dependen de ti

| # | Qué necesito | Por qué |
|---|---|---|
| 1 | Decidir si el repo va a GitHub (y con qué nombre) o se queda local | Vercel despliega desde un repo remoto; sin él, el despliegue es manual |
| 2 | Proyecto de Supabase: ¿uno nuevo o uno existente? | La tabla de récords necesita dónde vivir |
| 3 | URL y clave anónima de Supabase | Van en `.env.local`, **nunca** versionadas (Art. 6) |
| 4 | Nombre de la app (PEND-05) | Va en el manifiesto de la PWA, el icono y la marquesina |

Sin 1–3 puedo construir y verificar todo localmente, pero no puedo cerrar los criterios 1, 2,
3, 6 y 7.

## 7. Orden de ejecución

1. Monorepo, configuración, `CLAUDE.md`, verificación mecánica — con un test que **debe
   fallar** para probar que las reglas muerden.
2. `contracts` y `core` sin render: bucle, ticks, pausa, determinismo, todo verificado con
   tests, sin abrir el navegador.
3. Render Canvas 2D + juego de prueba + panel de control.
4. Shell: mueble, selección, overlays.
5. Supabase + récords + cola offline.
6. PWA + despliegue en Vercel.
7. Verificación en los tres dispositivos y registro de resultados.

Los pasos 1 y 2 no requieren ninguna cuenta ni credencial: se pueden empezar de inmediato.
