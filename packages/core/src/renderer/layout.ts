/**
 * Integer-scale letterboxing (spec §5.1–§5.4).
 *
 * Pure geometry: given the game's logical resolution, the CSS pixels actually
 * available for the screen area (the shell's concern — the core does not know
 * about the cabinet, Art. 3.7), and the device pixel ratio, compute the
 * largest whole-number scale that fits, plus the letterbox bars around it.
 *
 * The scale is chosen against PHYSICAL pixels (§5.4: "se respeta
 * devicePixelRatio para que el escalado entero se calcule en píxeles
 * físicos"), never CSS pixels, so a 3x device pixel ratio phone gets a
 * sharper multiple than a 1x desktop with the same CSS-pixel screen area.
 */
import type { Resolution } from '@arcade/contracts';

export interface CanvasLayout {
  /** Integer physical pixels per logical pixel. Always >= 1. */
  readonly scale: number;
  /** Canvas backing-store size, in physical pixels — what `canvas.width/height` must be set to. */
  readonly canvasWidthPx: number;
  readonly canvasHeightPx: number;
  /** On-screen size, in CSS pixels — what `canvas.style.width/height` must be set to. */
  readonly cssWidthPx: number;
  readonly cssHeightPx: number;
  /** Black-bar width on EACH side, in CSS pixels (total letterbox is double this). */
  readonly letterboxXPx: number;
  readonly letterboxYPx: number;
}

/**
 * SUPUESTO: cuando el área disponible es más pequeña que la resolución
 * lógica incluso a escala 1 (pantalla físicamente insuficiente), la escala
 * se mantiene en 1 en vez de cero o fraccionaria. La spec prohíbe deformar
 * la imagen (§5.1) pero no dice qué hacer si ni el múltiplo mínimo entra;
 * dejar que el canvas exceda el área disponible (y se recorte visualmente)
 * es, de las opciones, la única que no deforma nada.
 */
export function computeCanvasLayout(
  logical: Resolution,
  availableCssPx: Resolution,
  devicePixelRatio: number,
): CanvasLayout {
  const availablePhysicalWidth = availableCssPx.width * devicePixelRatio;
  const availablePhysicalHeight = availableCssPx.height * devicePixelRatio;

  const scaleForWidth = Math.floor(availablePhysicalWidth / logical.width);
  const scaleForHeight = Math.floor(availablePhysicalHeight / logical.height);
  const scale = Math.max(1, Math.min(scaleForWidth, scaleForHeight));

  const canvasWidthPx = logical.width * scale;
  const canvasHeightPx = logical.height * scale;
  const cssWidthPx = canvasWidthPx / devicePixelRatio;
  const cssHeightPx = canvasHeightPx / devicePixelRatio;

  return {
    scale,
    canvasWidthPx,
    canvasHeightPx,
    cssWidthPx,
    cssHeightPx,
    letterboxXPx: Math.max(0, (availableCssPx.width - cssWidthPx) / 2),
    letterboxYPx: Math.max(0, (availableCssPx.height - cssHeightPx) / 2),
  };
}
