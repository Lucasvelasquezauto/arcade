/**
 * The joystick (shell.md §5.6): visually analogue, functionally digital.
 * Tilts continuously with the drag; hands the core the CONTINUOUS
 * displacement normalised to its own radius (core.md §4.0) — the core
 * resolves the dead zone and the digital axis now (M2.1, see `touch.ts`'s
 * header comment), this component just measures the gesture.
 *
 * Two gesture sources feed the same visual/output state: a pointer drag, and
 * held keyboard keys (product-spec.md §2.1). Pointer takes priority while a
 * finger is actually down; keyboard applies whenever it isn't (including
 * right after a release, if a key is still held).
 */
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { haptics } from '@arcade/core';
import type { StickKind } from '@arcade/contracts';
import {
  clampToRadius,
  normalizeStickDrag,
  STICK_DEAD_ZONE_RATIO,
  type DragVector,
} from './touch.js';
import { resolveHeldDirections, stickDirectionForKey, type StickKeyDirection } from './keyboard.js';
import { MIN_TOUCH_PX } from '../theme/tokens.js';

const HOUSING_RADIUS_PX = 52;
const KNOB_RADIUS_PX = 26;
const TOUCH_PADDING_PX = 24;
const CENTERED: DragVector = { dx: 0, dy: 0 };

export interface StickProps {
  readonly kind: StickKind;
  /** Continuous displacement in [-1, 1] per axis, normalised to the drawn
   *  radius (core.md §4.0) — not the resolved digital axis. */
  readonly onChange: (x: number, y: number) => void;
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
  const heldKeysRef = useRef<Set<StickKeyDirection>>(new Set());
  /** Edge tracker for §6.3's "solo al accionar el control": fires once per
   *  transition from inside the dead zone to outside it, mirroring what
   *  `resolveStick` will decide in the core, without needing to ask it. */
  const wasActuatedRef = useRef(false);

  function emit(vector: DragVector): void {
    setDrag(vector);
    const deadZonePx = HOUSING_RADIUS_PX * STICK_DEAD_ZONE_RATIO;
    const actuated = Math.hypot(vector.dx, vector.dy) >= deadZonePx;
    // core.md §7.2 / shell.md §5 rule 3: haptics fire only on actuating the
    // control, never continuously while held, and only on the DOWN edge.
    if (actuated && !wasActuatedRef.current) haptics.trigger();
    wasActuatedRef.current = actuated;
    const normalized = normalizeStickDrag(vector, HOUSING_RADIUS_PX);
    onChange(normalized.x, normalized.y);
  }

  /** Applies the keyboard-held state, unless a pointer drag is in progress —
   *  the pointer owns the visual/output state while it's live. */
  function applyKeyboard(): void {
    if (activeRef.current !== null) return;
    const { x, y } = resolveHeldDirections(heldKeysRef.current);
    emit({ dx: x * HOUSING_RADIUS_PX, dy: y * HOUSING_RADIUS_PX });
  }

  function handleDown(event: PointerEvent): void {
    if (inert) return;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    activeRef.current = { pointerId: event.pointerId, originX: event.clientX, originY: event.clientY };
    emit(CENTERED);
  }

  function handleMove(event: PointerEvent): void {
    const active = activeRef.current;
    if (inert || !active || active.pointerId !== event.pointerId) return;
    const raw: DragVector = { dx: event.clientX - active.originX, dy: event.clientY - active.originY };
    emit(clampToRadius(raw, HOUSING_RADIUS_PX));
  }

  function release(event: PointerEvent): void {
    if (activeRef.current?.pointerId !== event.pointerId) return;
    activeRef.current = null;
    // A held key takes over immediately instead of snapping to centred,
    // matching "táctil y teclado conviven" (product-spec.md §2.1 rule 5).
    applyKeyboard();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      // product-spec.md §2.1 rule 4: OS auto-repeat is not a fresh pulse —
      // the held-key set alone is what sustains the direction.
      if (inert || event.repeat) return;
      const direction = stickDirectionForKey(event.key);
      if (direction === null) return;
      heldKeysRef.current.add(direction);
      applyKeyboard();
    }
    function onKeyUp(event: KeyboardEvent): void {
      const direction = stickDirectionForKey(event.key);
      if (direction === null) return;
      heldKeysRef.current.delete(direction);
      if (!inert) applyKeyboard();
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [inert]);

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
