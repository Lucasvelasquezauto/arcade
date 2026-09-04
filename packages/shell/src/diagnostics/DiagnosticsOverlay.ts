/**
 * Hidden diagnostics screen (shell.md §8, core.md §9): opened by a long
 * press on the marquee, from any screen. The shell only presents this data;
 * all of it comes from the core.
 */
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { CoreHandle, DiagnosticsView } from '../types.js';
import {
  CABINET_BG,
  FONT_FAMILY_MONO,
  MIN_TOUCH_PX,
  SPACING,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from '../theme/tokens.js';

export interface DiagnosticsOverlayProps {
  readonly core: CoreHandle;
  readonly onClose: () => void;
}

const EMPTY: DiagnosticsView = {
  fps: 0,
  ticksPerSecond: 0,
  droppedTicks: 0,
  recordsQueueSize: 0,
  online: true,
  pauseLog: [],
};

function Row(label: string, value: string) {
  return h(
    'div',
    { style: { display: 'flex', justifyContent: 'space-between', padding: `${SPACING.xs}px 0` } },
    h('span', { style: { color: TEXT_MUTED } }, label),
    h('span', {}, value),
  );
}

export function DiagnosticsOverlay({ core, onClose }: DiagnosticsOverlayProps) {
  const [view, setView] = useState<DiagnosticsView>(EMPTY);

  useEffect(() => core.subscribeDiagnostics(setView), [core]);

  return h(
    'div',
    {
      style: {
        position: 'fixed',
        inset: '0',
        background: CABINET_BG,
        color: TEXT_PRIMARY,
        fontFamily: FONT_FAMILY_MONO,
        padding: `${SPACING.lg}px`,
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: '1000',
      },
    },
    h('div', { style: { fontSize: '16px', fontWeight: 700, marginBottom: `${SPACING.md}px` } }, 'Diagnóstico'),
    Row('FPS', String(view.fps)),
    Row('Ticks/s', String(view.ticksPerSecond)),
    Row('Ticks perdidos', String(view.droppedTicks)),
    Row('Cola de récords', String(view.recordsQueueSize)),
    Row('Conexión', view.online ? 'en línea' : 'sin conexión'),
    h('div', { style: { marginTop: `${SPACING.md}px`, color: TEXT_MUTED } }, 'Últimas pausas'),
    ...view.pauseLog.map((entry, i) =>
      h(
        'div',
        { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: `${SPACING.xs}px 0` } },
        h('span', { style: { color: TEXT_MUTED } }, entry.startedAt),
        h('span', {}, `${entry.durationMs} ms`),
      ),
    ),
    h(
      'button',
      {
        onClick: onClose,
        style: {
          marginTop: `${SPACING.lg}px`,
          minHeight: `${MIN_TOUCH_PX}px`,
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          background: 'transparent',
          border: `1px solid ${TEXT_PRIMARY}`,
          color: TEXT_PRIMARY,
          cursor: 'pointer',
        },
      },
      'Cerrar',
    ),
  );
}
