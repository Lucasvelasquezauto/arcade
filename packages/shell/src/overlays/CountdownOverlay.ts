/** shell.md §6.2 — 3, 2, 1 over the frozen screen; controls read as inert. */
import { h } from 'preact';
import { FONT_FAMILY, OVERLAY_SCRIM, TEXT_PRIMARY } from '../theme/tokens.js';

export interface CountdownOverlayProps {
  readonly value: number;
}

export function CountdownOverlay({ value }: CountdownOverlayProps) {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        inset: '0',
        background: OVERLAY_SCRIM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: TEXT_PRIMARY,
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        fontWeight: 800,
      },
    },
    String(value),
  );
}
