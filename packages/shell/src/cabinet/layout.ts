/**
 * Pure geometry for the PC magnification path (product-spec.md §2.1 regla 1):
 * the largest size, preserving `aspectRatio`, that fits inside the available
 * area — a portrait "contain" fit, so the cabinet grows to fill the
 * available height when width is abundant (the common wide-desktop-window
 * case) without ever overflowing either dimension. Kept separate from
 * `Cabinet.ts` so it is testable without touching the DOM, same pattern as
 * `renderer/layout.ts` in `@arcade/core`.
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

export function computeCabinetSize(available: Size, aspectRatio: number): Size {
  if (available.width <= 0 || available.height <= 0) return { width: 0, height: 0 };
  const widthIfHeightBound = available.height * aspectRatio;
  if (widthIfHeightBound <= available.width) {
    return { width: widthIfHeightBound, height: available.height };
  }
  return { width: available.width, height: available.width / aspectRatio };
}
