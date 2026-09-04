/**
 * Catalog list (product-spec.md §4): tapping a game starts it immediately —
 * no attract screen, no credits, no PUSH START. Each entry also has a
 * direct shortcut to its own records table.
 */
import { h } from 'preact';
import type { GameCatalogEntry } from '../types.js';
import { FONT_FAMILY, MIN_TOUCH_PX, SPACING, TEXT_MUTED, TEXT_PRIMARY } from '../theme/tokens.js';

export interface SelectionScreenProps {
  readonly catalog: readonly GameCatalogEntry[];
  readonly onPlay: (gameId: string) => void;
  readonly onViewRecords: (gameId: string) => void;
}

export function SelectionScreen({ catalog, onPlay, onViewRecords }: SelectionScreenProps) {
  return h(
    'div',
    {
      style: {
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT_FAMILY,
      },
    },
    ...catalog.map((entry) =>
      h(
        'div',
        {
          key: entry.id,
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${SPACING.lg}px`,
            borderBottom: '1px solid #1c1c20',
            borderLeft: `4px solid ${entry.accentColor}`,
            gap: `${SPACING.md}px`,
          },
        },
        h(
          'div',
          {
            role: 'button',
            onClick: () => onPlay(entry.id),
            style: {
              flex: '1 1 auto',
              color: TEXT_PRIMARY,
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              minHeight: `${MIN_TOUCH_PX}px`,
              display: 'flex',
              alignItems: 'center',
            },
          },
          entry.title,
        ),
        h(
          'button',
          {
            onClick: () => onViewRecords(entry.id),
            style: {
              background: 'transparent',
              border: `1px solid ${TEXT_MUTED}`,
              color: TEXT_MUTED,
              borderRadius: '4px',
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              fontFamily: FONT_FAMILY,
              fontSize: '12px',
              textTransform: 'uppercase',
              minHeight: `${MIN_TOUCH_PX}px`,
              cursor: 'pointer',
            },
          },
          'Récords',
        ),
      ),
    ),
  );
}
