/**
 * Pure geometry: continuous drag vector -> digital stick axis. Kept separate
 * from `Stick.ts` so it is testable without touching the DOM.
 *
 * The dead zone and the four-way tie-break are decisions product-spec.md §6.5
 * explicitly delegates to this spec, and docs/specs/shell.md does not fix a
 * number either — both are SUPUESTO here, chosen without prior research.
 */
import type { Axis, StickKind } from '@arcade/contracts';

export interface DragVector {
  readonly dx: number;
  readonly dy: number;
}

export interface StickAxis {
  readonly x: Axis;
  readonly y: Axis;
}

/** SUPUESTO — zona muerta como fracción del radio dibujado del control, no en
 *  píxeles crudos, para que el mismo umbral tenga sentido en cualquier
 *  densidad de pantalla. Elegido sin research previa. */
export const STICK_DEAD_ZONE_RATIO = 0.25;

/**
 * Resolves core.md §4.3's rule: `horizontal` only ever reports x; `four-way`
 * never reports a diagonal, favouring whichever axis has the larger
 * displacement. SUPUESTO — an exact tie (|dx| === |dy|) resolves to
 * horizontal; the spec does not say and it is an edge case a human thumb
 * essentially never produces exactly.
 */
export function resolveStickAxis(kind: StickKind, drag: DragVector, radiusPx: number): StickAxis {
  const deadZone = radiusPx * STICK_DEAD_ZONE_RATIO;
  const ax = Math.abs(drag.dx);
  const ay = Math.abs(drag.dy);

  if (kind === 'horizontal') {
    if (ax < deadZone) return { x: 0, y: 0 };
    return { x: drag.dx > 0 ? 1 : -1, y: 0 };
  }

  if (ax < deadZone && ay < deadZone) return { x: 0, y: 0 };
  if (ax >= ay) return { x: drag.dx > 0 ? 1 : -1, y: 0 };
  return { x: 0, y: drag.dy > 0 ? 1 : -1 };
}

/** Clamps a drag vector to a maximum radius, for the stick's visual tilt
 *  (continuous, per shell.md §5.6) independent of the digital output above. */
export function clampToRadius(drag: DragVector, maxRadiusPx: number): DragVector {
  const length = Math.hypot(drag.dx, drag.dy);
  if (length <= maxRadiusPx || length === 0) return drag;
  const scale = maxRadiusPx / length;
  return { dx: drag.dx * scale, dy: drag.dy * scale };
}
