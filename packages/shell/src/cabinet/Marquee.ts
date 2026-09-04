/**
 * Top band: title (the app's own name on selection, the active game's title
 * elsewhere — shell.md §3.5), the mute toggle, and the long-press gesture
 * that opens diagnostics (shell.md §8).
 */
import { h } from 'preact';
import { useRef } from 'preact/hooks';
import { FONT_FAMILY, MARQUEE_BG, MARQUEE_TEXT, SPACING } from '../theme/tokens.js';
import { MuteToggle } from '../controls/MuteToggle.js';

/** SUPUESTO — duración de la pulsación larga; sin research previa. */
const LONG_PRESS_MS = 600;

export interface MarqueeProps {
  readonly title: string;
  readonly accentColor: string;
  readonly muted: boolean;
  readonly onToggleMute: () => void;
  readonly onLongPress: () => void;
}

export function Marquee({ title, accentColor, muted, onToggleMute, onLongPress }: MarqueeProps) {
  const timerRef = useRef<number | null>(null);

  function start(): void {
    timerRef.current = window.setTimeout(onLongPress, LONG_PRESS_MS);
  }

  function cancel(): void {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return h(
    'div',
    {
      style: {
        height: '100%',
        background: MARQUEE_BG,
        borderBottom: `3px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${SPACING.lg}px`,
        boxSizing: 'border-box',
        gap: `${SPACING.md}px`,
      },
    },
    h(
      'div',
      {
        onPointerDown: start,
        onPointerUp: cancel,
        onPointerCancel: cancel,
        onPointerLeave: cancel,
        style: {
          color: MARQUEE_TEXT,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: '20px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          userSelect: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
      title,
    ),
    h(MuteToggle, { muted, onToggle: onToggleMute }),
  );
}
