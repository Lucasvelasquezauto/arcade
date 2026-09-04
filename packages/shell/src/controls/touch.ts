/**
 * Pure geometry for the stick's drag gesture. Kept separate from `Stick.ts`
 * so it is testable without touching the DOM.
 *
 * M2.1 correction (core.md §4.0, product-spec.md §2.1): the shell used to
 * resolve the drag all the way to a digital -1/0/1 axis itself, applying its
 * own dead zone. That left `@arcade/core`'s `resolveStick`/`TouchInput`
 * without a real consumer (docs/handoff/1.11-cableado.md §4/§8). The
 * dead-zone-to-digital step now lives in the core, where it was always
 * specified to live; this file only turns a raw drag into the CONTINUOUS
 * displacement, normalised against the stick's own drawn radius, that
 * core.md §4.0 says the shell hands over.
 *
 * The dead zone constant stays here regardless: shell.md §5 makes it a
 * shell-declared parameter passed INTO the core (`TouchInputConfig.deadZone`),
 * not a core-owned constant. It no longer resolves anything itself in this
 * file — `Stick.ts` also reads it directly, to decide when a keyboard/drag
 * actuation has crossed into "pressed enough to buzz" for its own haptics
 * (§6.3 below is now the control's job, not `apps/arcade`'s).
 */
export interface DragVector {
  readonly dx: number;
  readonly dy: number;
}

export interface StickVector {
  readonly x: number;
  readonly y: number;
}

/** SUPUESTO — zona muerta como fracción del radio dibujado del control, no en
 *  píxeles crudos, para que el mismo umbral tenga sentido en cualquier
 *  densidad de pantalla. Elegido sin research previa.
 *
 *  DESAJUSTE OBSERVADO, NO CORREGIDO: shell.md §5 fija el valor inicial en
 *  0.15; este archivo (de antes de M2.1) usa 0.25. Cambiar el número es una
 *  decisión de producto fuera del alcance de esta tarea (M2.1 solo mueve
 *  QUIÉN aplica la zona muerta, no su valor) — se preserva 0.25 sin tocar y
 *  se deja señalado para que el hilo orquestador decida cuál es la correcta. */
export const STICK_DEAD_ZONE_RATIO = 0.25;

/**
 * Raw drag displacement -> continuous stick vector in [-1, 1] per axis,
 * normalised against `radiusPx` (core.md §4.0). No dead zone, no digital
 * resolution, no `StickKind` awareness: `@arcade/core`'s `resolveStick`
 * does all three now, given this value and the dead zone above. Magnitude is
 * clamped to 1 (a finger past the housing does not report more than "fully
 * over"), direction is preserved.
 */
export function normalizeStickDrag(drag: DragVector, radiusPx: number): StickVector {
  if (radiusPx <= 0) return { x: 0, y: 0 };
  const x = drag.dx / radiusPx;
  const y = drag.dy / radiusPx;
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

/** Clamps a drag vector to a maximum radius, for the stick's visual tilt
 *  (continuous, per shell.md §5.6) independent of the normalised output above. */
export function clampToRadius(drag: DragVector, maxRadiusPx: number): DragVector {
  const length = Math.hypot(drag.dx, drag.dy);
  if (length <= maxRadiusPx || length === 0) return drag;
  const scale = maxRadiusPx / length;
  return { dx: drag.dx * scale, dy: drag.dy * scale };
}
