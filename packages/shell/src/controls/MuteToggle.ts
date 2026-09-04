/**
 * The always-visible silence toggle (product-spec.md §7.4, shell.md §7).
 * Hand-drawn speaker glyph — no icon library (shell.md §10).
 */
import { h } from 'preact';
import { DANGER, MIN_TOUCH_PX } from '../theme/tokens.js';

export interface MuteToggleProps {
  readonly muted: boolean;
  readonly onToggle: () => void;
}

export function MuteToggle({ muted, onToggle }: MuteToggleProps) {
  return h(
    'div',
    {
      role: 'button',
      'aria-label': muted ? 'Activar sonido' : 'Silenciar',
      onClick: onToggle,
      style: {
        width: `${MIN_TOUCH_PX}px`,
        height: `${MIN_TOUCH_PX}px`,
        borderRadius: '50%',
        background: '#1c1c20',
        border: '1px solid #050506',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        flex: '0 0 auto',
      },
    },
    h('div', {
      style: {
        width: '10px',
        height: '10px',
        background: muted ? '#5a5a60' : '#e8e8ea',
        clipPath: 'polygon(0% 30%, 40% 30%, 100% 0%, 100% 100%, 40% 70%, 0% 70%)',
      },
    }),
    muted
      ? h('div', {
          style: {
            position: 'absolute',
            width: '26px',
            height: '2px',
            background: DANGER,
            transform: 'rotate(45deg)',
          },
        })
      : null,
  );
}
