/**
 * Whether the primary pointer is a mouse/trackpad rather than a finger.
 *
 * product-spec.md §2.1's PC magnification path and its "sin suavizado en el
 * celular" counterpart are two sides of the same rule, and nothing in any
 * spec fixes the real CSS viewport size of the three target phones, so there
 * is no absolute-pixel threshold to derive the difference from (see the
 * SUPUESTO on `CABINET_ASPECT_RATIO`). What genuinely differs between "a
 * resizable desktop window" and "a phone screen" is the input device, and
 * that IS something the platform exposes directly — the same
 * "detect the capability, not the platform" rule core.md §7.4 already uses
 * for haptics (`navigator.vibrate`). `(pointer: fine)` is the standard media
 * feature for "the primary pointer can hover and place a cursor precisely,"
 * true for a mouse/trackpad and false for a touchscreen; it is not user-agent
 * sniffing and it is not the input-mode detection product-spec.md §2.1 rule 5
 * forbids (that rule is about touch/keyboard LISTENING always being on, not
 * about a rendering decision like this one).
 */
export function prefersFinePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: fine)').matches;
}
