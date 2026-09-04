/**
 * The one cabinet frame for the whole app (shell.md §3.4): marquee, screen,
 * panel — three fixed bands, top to bottom. `screen` gets whatever height is
 * left over; the panel never grows to cover it (§3.2).
 */
import { h, type ComponentChildren } from 'preact';
import { BEZEL_BG, CABINET_BG, MARQUEE_HEIGHT_PX, PANEL_MIN_HEIGHT_PX } from '../theme/tokens.js';

export interface CabinetProps {
  readonly marquee: ComponentChildren;
  readonly screen: ComponentChildren;
  readonly panel: ComponentChildren;
}

export function Cabinet({ marquee, screen, panel }: CabinetProps) {
  return h(
    'div',
    {
      style: {
        position: 'fixed',
        inset: '0',
        display: 'flex',
        flexDirection: 'column',
        background: CABINET_BG,
        // shell.md §3.3 — respects device safe areas (notches, home indicator).
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'hidden',
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
  );
}
