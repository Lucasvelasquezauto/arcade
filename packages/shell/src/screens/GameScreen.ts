/**
 * The mounted cabinet during play (shell.md §3, §4): the canvas plus
 * whichever overlay the current `SessionView.status` calls for. Purely
 * presentational — `App.ts` owns the session subscription so the same
 * snapshot can also drive the control panel's `inert` flag.
 */
import { h } from 'preact';
import type { GameCatalogEntry, CoreHandle, SessionView } from '../types.js';
import { CanvasMount } from '../cabinet/CanvasMount.js';
import { PauseButton } from '../controls/PauseButton.js';
import { PauseOverlay } from '../overlays/PauseOverlay.js';
import { CountdownOverlay } from '../overlays/CountdownOverlay.js';

export interface GameScreenProps {
  readonly game: GameCatalogEntry;
  readonly core: CoreHandle;
  readonly session: SessionView | null;
}

export function GameScreen({ game, core, session }: GameScreenProps) {
  const status = session?.status ?? null;

  return h(
    'div',
    { style: { position: 'relative', width: '100%', height: '100%' } },
    h(CanvasMount, { core, gameId: game.id }),
    status === 'paused' ? h(PauseOverlay, {}) : null,
    status === 'countdown' && session?.countdown !== null && session?.countdown !== undefined
      ? h(CountdownOverlay, { value: session.countdown })
      : null,
    // Countdown already has its own path back to running; no manual pause
    // control needed while it's counting down (product-spec.md §9).
    status === 'running' || status === 'paused'
      ? h(PauseButton, {
          paused: status === 'paused',
          onToggle: () => (status === 'paused' ? core.resumeManually() : core.pauseManually()),
        })
      : null,
  );
}
