/** shell.md §6.1 — darkens the screen without hiding it. */
import { h } from 'preact';
import { FONT_FAMILY, OVERLAY_SCRIM, TEXT_PRIMARY } from '../theme/tokens.js';

export function PauseOverlay() {
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
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      },
    },
    'Pausa',
  );
}
