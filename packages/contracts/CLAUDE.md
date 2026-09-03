# @arcade/contracts

**Capa:** la base del grafo de dependencias. Todo depende de aquí; esto no depende de nada.

**Solo lo toca el hilo orquestador.** Si eres un agente de juego, de núcleo o de shell y
crees necesitar un cambio aquí, **detente y pídelo**. Un contrato que cuatro agentes pueden
cambiar no es un contrato.

## Qué vive aquí

Interfaces compartidas (`GameModule`, `InputState`, `DrawSurface`, `ControlPanel`,
`SoundEvent`) y las utilidades **puras** que la lógica de juego sí puede usar: temporizadores
por ticks (`scheduler.ts`) y azar con semilla (`rng.ts`).

## Qué no puede aparecer aquí, jamás

DOM, red, almacenamiento, relojes del entorno, `Math.random()`, dependencias de terceros, ni
un import de ningún otro paquete del repo. ESLint y dependency-cruiser lo verifican.

## Por qué importa

Los juegos dependen de este paquete **y de nada más** (Art. 3.4). Es lo que hace
imposible que un juego alcance el DOM o el reloj: no tiene por dónde. Cualquier cosa que se
agregue aquí queda automáticamente al alcance de los cuatro juegos, así que agregar algo es
una decisión de arquitectura, no una comodidad.

**Spec:** `docs/specs/core.md` (pendiente) · **Constitución:** Art. 3.1 – 3.4
