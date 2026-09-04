/**
 * A single panel button (shell.md §5): visually presses on touch, released
 * on lift, independent of any game tick (§5.2). No JSX — see
 * docs/handoff/1.7-shell.md for why this package writes `.ts` + `h()`
 * instead of `.tsx`.
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { PanelButton } from '@arcade/contracts';
import { MIN_TOUCH_PX } from '../theme/tokens.js';

/** SUPUESTO — colores de cara de botón típicos de arcade; sin research previa. */
const BUTTON_FACE_COLOR: Record<PanelButton['color'], string> = {
  red: '#e6392b',
  blue: '#2b6ee6',
  yellow: '#e6c02b',
  green: '#2be65a',
};

const CAP_DIAMETER_PX = 56;
const TOUCH_PADDING_PX = 20;

export interface ButtonProps {
  readonly button: PanelButton;
  readonly onDown: () => void;
  readonly onUp: () => void;
  /** During the pause countdown the control shows no feedback (shell.md §6.2). */
  readonly inert?: boolean;
}

export function Button({ button, onDown, onUp, inert = false }: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  function handleDown(event: PointerEvent): void {
    if (inert) return;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    setPressed(true);
    onDown();
  }

  function handleUp(): void {
    if (inert) return;
    setPressed(false);
    onUp();
  }

  const touchDiameter = Math.max(MIN_TOUCH_PX, CAP_DIAMETER_PX) + TOUCH_PADDING_PX;

  return h(
    'div',
    {
      role: 'button',
      'aria-label': button.label || button.id,
      onPointerDown: handleDown,
      onPointerUp: handleUp,
      onPointerCancel: handleUp,
      style: {
        width: `${touchDiameter}px`,
        height: `${touchDiameter}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        cursor: inert ? 'default' : 'pointer',
      },
    },
    h(
      'div',
      {
        style: {
          width: `${CAP_DIAMETER_PX}px`,
          height: `${CAP_DIAMETER_PX}px`,
          borderRadius: '50%',
          background: BUTTON_FACE_COLOR[button.color],
          boxShadow: pressed
            ? 'inset 0 3px 6px rgba(0,0,0,0.6)'
            : '0 4px 0 rgba(0,0,0,0.45), inset 0 -3px 6px rgba(0,0,0,0.25)',
          transform: pressed ? 'translateY(3px)' : 'translateY(0)',
          transition: 'transform 40ms linear, box-shadow 40ms linear',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(0,0,0,0.55)',
          fontWeight: 700,
          fontSize: '13px',
          opacity: inert ? 0.55 : 1,
        },
      },
      button.label,
    ),
  );
}
