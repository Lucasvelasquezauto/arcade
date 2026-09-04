/**
 * Visual tokens for the cabinet itself — never for what a game draws inside
 * its own screen (Constitution Art. 3.7). Colours here are chosen against
 * `docs/reference/consola1.jpg` (black cabinet body, cyan accent line work,
 * warm marquee lettering); none of them come from research, so every value
 * is SUPUESTO and safe to swap in one place.
 */

/** SUPUESTO — no hay una paleta de mueble decidida; se aproxima consola1.jpg. */
export const CABINET_BG = '#0b0b0d';
export const BEZEL_BG = '#000000';
export const PANEL_BG = '#151519';
export const TEXT_PRIMARY = '#f2f2f0';
export const TEXT_MUTED = '#8a8a90';
export const MARQUEE_BG = '#111114';
/** SUPUESTO — tono cálido aproximado del rótulo de consola1.jpg. */
export const MARQUEE_TEXT = '#ffce54';
export const DANGER = '#ff4d4f';
export const OVERLAY_SCRIM = 'rgba(0, 0, 0, 0.72)';

/** SUPUESTO — "tipografía de sistema" (shell.md §3.4) sin fuente concreta elegida. */
export const FONT_FAMILY =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
export const FONT_FAMILY_MONO =
  "'Consolas', 'SFMono-Regular', ui-monospace, Menlo, monospace";

/** product-spec.md §6.3 / shell.md §5.4 — VERIFICADO, texto explícito de la spec. */
export const MIN_TOUCH_PX = 44;

/** SUPUESTO — dimensiones de layout del mueble; sin research previa. */
export const MARQUEE_HEIGHT_PX = 64;
export const PANEL_MIN_HEIGHT_PX = 180;

/**
 * SUPUESTO — proporción (ancho/alto) que el mueble conserva al ampliarse en
 * PC (product-spec.md §2.1 regla 1: "el mueble no cambia de forma: cambia de
 * tamaño"). Ningún documento fija el ancho/alto CSS real de los tres
 * celulares objetivo, así que no hay un número "correcto" que derivar; se
 * eligió una proporción de teléfono moderno típica (9:19.5) porque el mueble
 * ya se compone en vertical para celular y esta es la familia de formas que
 * ese diseño ya asume. Ajustar este número no cambia ninguna lógica, solo
 * qué tan angosto se ve el mueble en una ventana ancha.
 */
export const CABINET_ASPECT_RATIO = 9 / 19.5;

/**
 * Nombre de la app. PEND-05 en product-spec.md §13: sin decidir todavía.
 * SUPUESTO — placeholder único; cambiar la app entera es cambiar esta línea.
 */
export const APP_NAME = 'ARCADE';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
} as const;
