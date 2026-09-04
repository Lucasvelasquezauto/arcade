/**
 * Final score, then routes to name entry or straight to the records table
 * (product-spec.md §4). SUPUESTO — advances on a tap ("Continuar") rather
 * than an automatic delay: the spec names the transition but not a
 * duration, and no research fixes a number worth guessing.
 */
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { CoreHandle, RecordsView } from '../types.js';
import { qualifiesForTop10 } from './records.js';
import { FONT_FAMILY, MIN_TOUCH_PX, SPACING, TEXT_MUTED, TEXT_PRIMARY } from '../theme/tokens.js';

export interface GameOverScreenProps {
  readonly gameId: string;
  readonly score: number;
  readonly core: CoreHandle;
  readonly onEnterName: () => void;
  readonly onShowRecords: () => void;
}

const EMPTY: RecordsView = { top10: [] };

export function GameOverScreen({ gameId, score, core, onEnterName, onShowRecords }: GameOverScreenProps) {
  const [records, setRecords] = useState<RecordsView>(EMPTY);

  useEffect(() => core.subscribeRecords(gameId, setRecords), [core, gameId]);

  function handleContinue(): void {
    if (qualifiesForTop10(records.top10, score)) onEnterName();
    else onShowRecords();
  }

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
          fontSize: '14px',
          letterSpacing: '0.2em',
          color: TEXT_MUTED,
          textTransform: 'uppercase',
        },
      },
      'Fin de partida',
    ),
    h('div', { style: { fontSize: '40px', fontWeight: 800 } }, String(score)),
    h(
      'button',
      {
        onClick: handleContinue,
        style: {
          minHeight: `${MIN_TOUCH_PX}px`,
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          background: 'transparent',
          border: `1px solid ${TEXT_PRIMARY}`,
          color: TEXT_PRIMARY,
          fontFamily: FONT_FAMILY,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          cursor: 'pointer',
        },
      },
      'Continuar',
    ),
  );
}
