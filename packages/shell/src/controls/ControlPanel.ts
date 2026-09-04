/**
 * Renders exactly what the active game declared (shell.md §5): the stick if
 * any, the buttons in order, nothing more — no dead controls.
 */
import { h } from 'preact';
import type { ControlPanel as ControlPanelContract } from '@arcade/contracts';
import type { CoreHandle } from '../types.js';
import { Stick } from './Stick.js';
import { Button } from './Button.js';
import { PANEL_BG, PANEL_MIN_HEIGHT_PX, SPACING } from '../theme/tokens.js';

export interface ControlPanelProps {
  readonly panel: ControlPanelContract;
  readonly accentColor: string;
  readonly core: CoreHandle;
  /** True during the pause countdown: controls sit visible but inert (shell.md §6.2). */
  readonly inert?: boolean;
}

export function ControlPanel({ panel, accentColor, core, inert = false }: ControlPanelProps) {
  return h(
    'div',
    {
      style: {
        minHeight: `${PANEL_MIN_HEIGHT_PX}px`,
        background: PANEL_BG,
        borderTop: `3px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${SPACING.lg}px`,
        boxSizing: 'border-box',
        gap: `${SPACING.lg}px`,
      },
    },
    panel.stick
      ? h(Stick, {
          kind: panel.stick,
          inert,
          onChange: (x, y) => core.setStick(x, y),
        })
      : h('div', {}),
    h(
      'div',
      { style: { display: 'flex', gap: `${SPACING.md}px` } },
      ...panel.buttons.map((button) =>
        h(Button, {
          key: button.id,
          button,
          inert,
          onDown: () => core.setButton(button.id, true),
          onUp: () => core.setButton(button.id, false),
        }),
      ),
    ),
  );
}
