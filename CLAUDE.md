# Arcade — reglas para cualquier agente

App web que reproduce juegos arcade de los 80 dentro de un marco tipo maquinita.
Uso personal. **Fidelidad al original por encima de conveniencia técnica.**

## Antes de escribir una sola línea

1. Lee `docs/constitution.md`. Manda sobre todo lo demás, incluido este archivo.
2. Lee la spec aprobada de tu paquete en `docs/specs/`. **Sin spec aprobada no se escribe
   código** (Art. 2.1). Si no existe, detente y pídela.
3. Lee el `CLAUDE.md` de tu carpeta: define qué puedes importar y qué no.

Este archivo no repite las reglas: las señala. Si algo aquí parece contradecir la
constitución, la constitución tiene razón y este archivo está mal.

## Límites que no se negocian

- Escribes **solo dentro de tu paquete**. Nada fuera.
- `packages/contracts/` y `docs/` los toca únicamente el hilo orquestador. Si necesitas
  cambiar un contrato, **detente y pídelo**.
- No lees ni copias código de otro juego para justificar el tuyo (Art. 2.5).
- No agregas dependencias: se piden, no se instalan.
- Ambigüedad en la spec: pregunta, o marca `SUPUESTO` en el código y sigue. Nunca decidas
  en silencio (Art. 2.7).

## Verificación

`pnpm verify` = tipos + ESLint constitucional + dependency-cruiser + tests + prueba negativa.
Lo que no pasa, no entra. No lo desactives ni lo rodees: si una regla te estorba, es una
conversación, no un obstáculo técnico.

## Convenciones

- Documentación en español; código, identificadores y comentarios en inglés.
- Toda constante numérica lleva su marca `VERIFICADO` o `DERIVADO` y su referencia al
  documento de investigación (Art. 1.4).
- Node >= 22.12 · pnpm · TypeScript estricto.
