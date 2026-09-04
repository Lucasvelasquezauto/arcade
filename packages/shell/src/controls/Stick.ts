/**
 * The joystick (shell.md §5.6): visually analogue, functionally digital.
 * Tilts continuously with the drag; reports -1/0/1 through `resolveStickAxis`
 * (`touch.ts`), which is where the actual axis math lives so it stays
 * testable without the DOM.
 */
import { h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import type { Axis, StickKind } from '@arcade/contracts';
import { clampToRadius, resolveStickAxis, type DragVector } from './touch.js';
import { MIN_TOUCH_PX } from '../theme/tokens.js';

const HOUSING_RADIUS_PX = 52;
const KNOB_RADIUS_PX = 26;
const TOUCH_PADDING_PX = 24;
const CENTERED: DragVector = { dx: 0, dy: 0 };

export interface StickProps {
  readonly kind: StickKind;
  readonly onChange: (x: Axis, y: Axis) => void;
  /** During the pause countdown the control shows no feedback (shell.md §6.2). */
  readonly inert?: boolean;
}

interface ActiveDrag {
  readonly pointerId: number;
  readonly originX: number;
  readonly originY: number;
}

export function Stick({ kind, onChange, inert = false }: StickProps) {
  const [drag, setDrag] = useState<DragVector>(CENTERED);
  const activeRef = useRef<ActiveDrag | null>(null);

  function handleDown(event: PointerEvent): void {
    if (inert) return;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    activeRef.current = { pointerId: event.pointerId, originX: event.clientX, originY: event.clientY };
    setDrag(CENTERED);
    onChange(0, 0);
  }

  function handleMove(event: PointerEvent): void {
    const active = activeRef.current;
    if (inert || !active || active.pointerId !== event.pointerId) return;
    const raw: DragVector = { dx: event.clientX - active.originX, dy: event.clientY - active.originY };
    setDrag(clampToRadius(raw, HOUSING_RADIUS_PX));
    const axis = resolveStickAxis(kind, raw, HOUSING_RADIUS_PX);
    onChange(axis.x, axis.y);
  }

  function release(event: PointerEvent): void {
    if (activeRef.current?.pointerId !== event.pointerId) return;
    activeRef.current = null;
    setDrag(CENTERED);
    onChange(0, 0);
  }

  const touchDiameter = Math.max(MIN_TOUCH_PX * 2, (HOUSING_RADIUS_PX + TOUCH_PADDING_PX) * 2);
  const knobY = kind === 'horizontal' ? 0 : drag.dy;

  return h(
    'div',
    {
      role: 'group',
      'aria-label': 'stick',
      onPointerDown: handleDown,
      onPointerMove: handleMove,
      onPointerUp: release,
      onPointerCancel: release,
      style: {
        width: `${touchDiameter}px`,
        height: `${touchDiameter}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 40%, #26262c, #101013)',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: inert ? 0.55 : 1,
      },
    },
    h('div', {
      style: {
        width: `${HOUSING_RADIUS_PX * 2}px`,
        height: `${HOUSING_RADIUS_PX * 2}px`,
        borderRadius: '50%',
        border: '2px solid #050506',
        position: 'absolute',
      },
    }),
    h('div', {
      style: {
        width: `${KNOB_RADIUS_PX * 2}px`,
        height: `${KNOB_RADIUS_PX * 2}px`,
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #3a3a42, #1d1d22)',
        boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
        transform: `translate(${drag.dx}px, ${knobY}px)`,
        transition: activeRef.current ? 'none' : 'transform 120ms ease-out',
      },
    }),
  );
}
