/**
 * Manual pause from the cabinet (product-spec.md §9: "Existe además pausa
 * manual desde el mueble, con el mismo comportamiento y la misma cuenta
 * regresiva al reanudar"). SUPUESTO — placed as a small corner control over
 * the screen band rather than in the marquee: it only makes sense while a
 * game is active, and the marquee is shared by every screen.
 */
import { h } from 'preact';
import { MIN_TOUCH_PX } from '../theme/tokens.js';

export interface PauseButtonProps {
  readonly paused: boolean;
  readonly onToggle: () => void;
}

export function PauseButton({ paused, onToggle }: PauseButtonProps) {
  return h(
    'button',
    {
      onClick: onToggle,
      'aria-label': paused ? 'Reanudar' : 'Pausar',
      style: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        minWidth: `${MIN_TOUCH_PX}px`,
        minHeight: `${MIN_TOUCH_PX}px`,
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '16px',
        lineHeight: '1',
        cursor: 'pointer',
        zIndex: '10',
      },
    },
    paused ? '►' : '❚❚',
  );
}
