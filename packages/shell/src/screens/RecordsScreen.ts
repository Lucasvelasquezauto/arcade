/**
 * Top-10 table (product-spec.md §8): unconfirmed local entries show marked
 * as such, with their real score, while the offline queue drains.
 */
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { CoreHandle, RecordsView } from '../types.js';
import { FONT_FAMILY, MIN_TOUCH_PX, SPACING, TEXT_MUTED, TEXT_PRIMARY } from '../theme/tokens.js';

export interface RecordsScreenProps {
  readonly gameId: string;
  readonly core: CoreHandle;
  readonly onBack: () => void;
}

const EMPTY: RecordsView = { top10: [] };

export function RecordsScreen({ gameId, core, onBack }: RecordsScreenProps) {
  const [view, setView] = useState<RecordsView>(EMPTY);

  useEffect(() => core.subscribeRecords(gameId, setView), [core, gameId]);

  return h(
    'div',
    {
      style: {
        height: '100%',
        overflowY: 'auto',
        fontFamily: FONT_FAMILY,
        color: TEXT_PRIMARY,
        padding: `${SPACING.lg}px`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: `${SPACING.lg}px`,
      },
    },
    view.top10.length === 0
      ? h('div', { style: { color: TEXT_MUTED, textAlign: 'center' } }, 'Sin récords todavía')
      : h(
          'ol',
          { style: { listStyle: 'none', margin: 0, padding: 0, flex: '1 1 auto' } },
          ...view.top10.map((entry, i) =>
            h(
              'li',
              {
                key: `${entry.name}-${entry.achievedAt}-${i}`,
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: `${SPACING.sm}px`,
                  padding: `${SPACING.sm}px 0`,
                  borderBottom: '1px solid #1c1c20',
                  opacity: entry.confirmed ? 1 : 0.6,
                },
              },
              h('span', { style: { flex: '1 1 auto' } }, `${i + 1}. ${entry.name}`),
              !entry.confirmed
                ? h('span', { style: { color: TEXT_MUTED, fontSize: '11px' } }, 'sin confirmar')
                : null,
              h('span', {}, String(entry.score)),
            ),
          ),
        ),
    h(
      'button',
      {
        onClick: onBack,
        style: {
          alignSelf: 'center',
          minHeight: `${MIN_TOUCH_PX}px`,
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          background: 'transparent',
          border: `1px solid ${TEXT_MUTED}`,
          color: TEXT_MUTED,
          fontFamily: FONT_FAMILY,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          cursor: 'pointer',
        },
      },
      'Volver',
    ),
  );
}
