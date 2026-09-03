/**
 * Digital stick resolution (spec §4.3–4.4).
 */
import type { Axis, StickKind } from '@arcade/contracts';

export interface StickVector {
  readonly x: Axis;
  readonly y: Axis;
}

export const NEUTRAL_STICK: StickVector = { x: 0, y: 0 };

function toAxis(value: number): Axis {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

/**
 * Resolves a raw finger displacement from the stick's centre — each
 * component normalised to roughly [-1, 1] by the caller, since the physical
 * zone radius is a shell-layer concern this package never sees — into the
 * digital axis a game receives.
 *
 * `horizontal` ignores `dy` entirely (§4.3). `four-way` never reports a
 * diagonal: only the axis with the larger displacement is reported, the
 * other stays 0 (§4.3, "resolviendo el conflicto a favor del eje con mayor
 * desplazamiento del dedo").
 *
 * SUPUESTO: `deadZone` is the fraction of that normalised displacement below
 * which the stick reads as centred, and for `four-way` it is compared only
 * against the dominant axis's own displacement. §4.4 places the exact
 * threshold value in the shell's spec, which does not exist yet, so this
 * function takes it as a parameter instead of inventing a number; the
 * per-axis-vs-combined-magnitude comparison is not settled by any spec
 * either and is a minor ambiguity resolved here.
 */
export function resolveStick(kind: StickKind, dx: number, dy: number, deadZone: number): StickVector {
  if (kind === 'horizontal') {
    return Math.abs(dx) < deadZone ? NEUTRAL_STICK : { x: toAxis(dx), y: 0 };
  }
  const dominantIsX = Math.abs(dx) >= Math.abs(dy);
  const dominantMagnitude = dominantIsX ? Math.abs(dx) : Math.abs(dy);
  if (dominantMagnitude < deadZone) return NEUTRAL_STICK;
  return dominantIsX ? { x: toAxis(dx), y: 0 } : { x: 0, y: toAxis(dy) };
}
