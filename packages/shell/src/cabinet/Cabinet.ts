/**
 * The one cabinet frame for the whole app (shell.md §3.4): marquee, screen,
 * panel — three fixed bands, top to bottom. `screen` gets whatever height is
 * left over; the panel never grows to cover it (§3.2).
 *
 * M2.1 (product-spec.md §2.1 regla 1): on a resizable desktop window the
 * cabinet no longer stretches edge-to-edge — it keeps `CABINET_ASPECT_RATIO`
 * and grows only as a whole, centred, to fill the available height (never
 * more width than that ratio allows). On a real phone (`prefersFinePointer`
 * false) this is skipped entirely and the cabinet fills its container exactly
 * as before M2.1 — width and height both 100%, no measurement, no resize
 * math, matching product-spec.md §2.1 regla 1's "en el celular esto no
 * aplica."
 */
import { h, type ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { BEZEL_BG, CABINET_ASPECT_RATIO, CABINET_BG, MARQUEE_HEIGHT_PX, PANEL_MIN_HEIGHT_PX } from '../theme/tokens.js';
import { prefersFinePointer } from '../platform/pointer.js';
import { computeCabinetSize, type Size } from './layout.js';

export interface CabinetProps {
  readonly marquee: ComponentChildren;
  readonly screen: ComponentChildren;
  readonly panel: ComponentChildren;
}

export function Cabinet({ marquee, screen, panel }: CabinetProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [finePointer] = useState(prefersFinePointer);

  useLayoutEffect(() => {
    if (!finePointer) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const applySize = (): void => {
      const rect = viewport.getBoundingClientRect();
      setSize(computeCabinetSize({ width: rect.width, height: rect.height }, CABINET_ASPECT_RATIO));
    };
    applySize();
    const observer = new ResizeObserver(applySize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [finePointer]);

  return h(
    'div',
    {
      ref: viewportRef,
      style: {
        position: 'fixed',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: CABINET_BG,
        // shell.md §3.3 — respects device safe areas (notches, home indicator).
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'hidden',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          background: CABINET_BG,
          overflow: 'hidden',
          width: finePointer && size ? `${size.width}px` : '100%',
          height: finePointer && size ? `${size.height}px` : '100%',
          flex: finePointer ? 'none' : '1 1 auto',
        },
      },
      h('div', { style: { flex: `0 0 ${MARQUEE_HEIGHT_PX}px` } }, marquee),
      h(
        'div',
        {
          style: {
            flex: '1 1 auto',
            minHeight: '0',
            background: BEZEL_BG,
            position: 'relative',
            overflow: 'hidden',
          },
        },
        screen,
      ),
      h('div', { style: { flex: '0 0 auto', minHeight: `${PANEL_MIN_HEIGHT_PX}px` } }, panel),
    ),
  );
}
