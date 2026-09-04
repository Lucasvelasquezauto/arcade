/**
 * A single panel button (shell.md §5): visually presses on touch, released
 * on lift, independent of any game tick (§5.2). No JSX — see
 * docs/handoff/1.7-shell.md for why this package writes `.ts` + `h()`
 * instead of `.tsx`.
 *
 * Two gesture sources feed the same visual/output "pressed" state: a pointer
 * press, and the `L` key (product-spec.md §2.1) — SUPUESTO: this component
 * assumes it IS the app's single keyboard action button unconditionally,
 * which holds today because "ningún juego declara un segundo botón sin una
 * decisión explícita del propietario" (product-spec.md §2.1) means a panel
 * never renders more than one `Button`. If that ever changes, `L` needs to
 * be routed to a specific button by `ControlPanel` instead.
 */
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { haptics } from '@arcade/core';
import type { PanelButton } from '@arcade/contracts';
import { isActionButtonKey } from './keyboard.js';
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
  const [pointerPressed, setPointerPressed] = useState(false);
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const wasPressedRef = useRef(false);
  const pressed = pointerPressed || keyboardPressed;

  /** Fires `onDown`/`onUp` and haptics only on the combined edge, since
   *  pointer and keyboard are independent sources that must not double-fire
   *  each other's edge (core.md §7.2: only on actuating the control). */
  function setEffectivePressed(next: boolean): void {
    if (next === wasPressedRef.current) return;
    wasPressedRef.current = next;
    if (next) {
      haptics.trigger();
      onDown();
    } else {
      onUp();
    }
  }

  function handleDown(event: PointerEvent): void {
    if (inert) return;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    setPointerPressed(true);
    setEffectivePressed(true);
  }

  function handleUp(): void {
    if (inert) return;
    setPointerPressed(false);
    setEffectivePressed(keyboardPressed);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (inert || event.repeat || !isActionButtonKey(event.key)) return;
      setKeyboardPressed(true);
      setEffectivePressed(true);
    }
    function onKeyUp(event: KeyboardEvent): void {
      if (!isActionButtonKey(event.key)) return;
      setKeyboardPressed(false);
      if (!inert) setEffectivePressed(pointerPressed);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [inert, pointerPressed]);

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
