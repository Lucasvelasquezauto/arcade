/**
 * Arcade-style character selector (product-spec.md §8, shell.md §4): five
 * slots, cycled one at a time, never the system keyboard. Logic lives in
 * `nameEntry.ts` so it is testable without the DOM.
 *
 * SUPUESTO — its own controls (◀ ▶ ▲ ▼ OK), drawn here rather than reusing
 * the active game's declared `ControlPanel`: no game is running on this
 * screen, so there is nothing for the panel band to show, and the game's
 * panel shape (a stick plus 0–2 buttons) does not map cleanly onto "move
 * cursor / cycle letter / confirm" anyway.
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import {
  cycleChar,
  initialName,
  moveCursor,
  setCharAt,
  toSubmittableName,
  type NameChars,
} from './nameEntry.js';
import { FONT_FAMILY, MIN_TOUCH_PX, SPACING, TEXT_MUTED, TEXT_PRIMARY } from '../theme/tokens.js';

export interface NameEntryScreenProps {
  readonly score: number;
  readonly onSubmit: (name: string) => void;
}

function ArcadeKey(label: string, onClick: () => void, disabled = false) {
  return h(
    'button',
    {
      onClick,
      disabled,
      style: {
        minWidth: `${MIN_TOUCH_PX}px`,
        minHeight: `${MIN_TOUCH_PX}px`,
        background: 'transparent',
        border: `1px solid ${disabled ? '#3a3a40' : TEXT_PRIMARY}`,
        color: disabled ? '#3a3a40' : TEXT_PRIMARY,
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        cursor: disabled ? 'default' : 'pointer',
      },
    },
    label,
  );
}

export function NameEntryScreen({ score, onSubmit }: NameEntryScreenProps) {
  const [name, setName] = useState<NameChars>(initialName());
  const [cursor, setCursor] = useState(0);

  const submittable = toSubmittableName(name);

  return h(
    'div',
    {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${SPACING.lg}px`,
        fontFamily: FONT_FAMILY,
        color: TEXT_PRIMARY,
      },
    },
    h(
      'div',
      {
        style: {
          fontSize: '12px',
          letterSpacing: '0.2em',
          color: TEXT_MUTED,
          textTransform: 'uppercase',
        },
      },
      `Nuevo récord — ${score}`,
    ),
    h(
      'div',
      { style: { display: 'flex', gap: `${SPACING.sm}px` } },
      ...name.map((char, i) =>
        h(
          'div',
          {
            key: i,
            style: {
              width: '36px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              borderBottom: `3px solid ${i === cursor ? TEXT_PRIMARY : '#3a3a40'}`,
            },
          },
          char === ' ' ? ' ' : char,
        ),
      ),
    ),
    h(
      'div',
      { style: { display: 'flex', gap: `${SPACING.md}px`, alignItems: 'center' } },
      ArcadeKey('◀', () => setCursor((c) => moveCursor(c, -1))),
      ArcadeKey('▲', () => setName((n) => setCharAt(n, cursor, cycleChar(n[cursor] ?? ' ', 1)))),
      ArcadeKey('▼', () => setName((n) => setCharAt(n, cursor, cycleChar(n[cursor] ?? ' ', -1)))),
      ArcadeKey('▶', () => setCursor((c) => moveCursor(c, 1))),
    ),
    ArcadeKey(
      'OK',
      () => {
        if (submittable) onSubmit(submittable);
      },
      submittable === null,
    ),
  );
}
