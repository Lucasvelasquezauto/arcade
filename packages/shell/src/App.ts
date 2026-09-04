/**
 * Wires navigation, the mute preference and the current session snapshot
 * into the three Cabinet slots. This is the one place allowed to know both
 * "which screen" and "which game" at once — every screen below it stays
 * ignorant of the others.
 */
import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { AppProps, GameCatalogEntry, SessionView } from './types.js';
import { createNavigation } from './navigation.js';
import { browserKeyValueStore, createMuteState } from './mute.js';
import { APP_NAME } from './theme/tokens.js';
import { Cabinet } from './cabinet/Cabinet.js';
import { Marquee } from './cabinet/Marquee.js';
import { ControlPanel } from './controls/ControlPanel.js';
import { SelectionScreen } from './screens/SelectionScreen.js';
import { GameScreen } from './screens/GameScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { NameEntryScreen } from './screens/NameEntryScreen.js';
import { RecordsScreen } from './screens/RecordsScreen.js';
import { DiagnosticsOverlay } from './diagnostics/DiagnosticsOverlay.js';

/** SUPUESTO — acento neutro para la pantalla de selección, donde ningún
 *  juego concreto está activo; sin research previa. */
const NEUTRAL_ACCENT = '#2ee6ff';

export function App({ catalog, core }: AppProps) {
  const [nav] = useState(() => createNavigation());
  const [muteState] = useState(() => createMuteState(browserKeyValueStore()));
  const [session, setSession] = useState<SessionView | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const navState = nav.state.value;
  const muted = muteState.muted.value;

  useEffect(() => {
    // Syncs the persisted preference once per core instance; later toggles
    // push explicitly from handleToggleMute below, so `muted` is not a dep.
    core.setMuted(muted);
  }, [core]);

  useEffect(() => {
    if (navState.screen !== 'game' || navState.gameId === null) {
      setSession(null);
      return;
    }
    const gameId = navState.gameId;
    return core.subscribeSession((view) => {
      setSession(view);
      if (view.gameStatus === 'over') nav.goToGameOver(gameId, view.score);
    });
  }, [core, navState.screen, navState.gameId]);

  function findGame(gameId: string): GameCatalogEntry {
    const entry = catalog.find((g) => g.id === gameId);
    if (!entry) throw new Error(`Unknown game id in catalog: ${gameId}`);
    return entry;
  }

  function handleToggleMute(): void {
    const next = !muted;
    muteState.setMuted(next);
    core.setMuted(next);
  }

  const activeGame = navState.gameId !== null ? findGame(navState.gameId) : null;
  const title = activeGame ? activeGame.title : APP_NAME;
  const accentColor = activeGame ? activeGame.accentColor : NEUTRAL_ACCENT;

  let screenContent;
  switch (navState.screen) {
    case 'selection':
      screenContent = h(SelectionScreen, {
        catalog,
        onPlay: nav.goToGame,
        onViewRecords: nav.goToRecords,
      });
      break;
    case 'game':
      screenContent = activeGame ? h(GameScreen, { game: activeGame, core, session }) : null;
      break;
    case 'game-over':
      screenContent =
        activeGame && navState.finalScore !== null
          ? h(GameOverScreen, {
              gameId: activeGame.id,
              score: navState.finalScore,
              core,
              onEnterName: () => nav.goToNameEntry(activeGame.id, navState.finalScore as number),
              onShowRecords: () => nav.goToRecords(activeGame.id),
            })
          : null;
      break;
    case 'name-entry':
      screenContent =
        activeGame && navState.finalScore !== null
          ? h(NameEntryScreen, {
              score: navState.finalScore,
              onSubmit: (name) => {
                core.submitScore(activeGame.id, name);
                nav.goToRecords(activeGame.id);
              },
            })
          : null;
      break;
    case 'records':
      screenContent = activeGame
        ? h(RecordsScreen, { gameId: activeGame.id, core, onBack: nav.goToSelection })
        : null;
      break;
    default: {
      const exhaustive: never = navState.screen;
      throw new Error(`Unhandled screen: ${String(exhaustive)}`);
    }
  }

  const panelContent =
    navState.screen === 'game' && activeGame
      ? h(ControlPanel, {
          panel: activeGame.panel,
          accentColor: activeGame.accentColor,
          core,
          // shell.md §5.1/§5.2 vs §6.2: feedback keeps responding while
          // merely paused — only the countdown makes controls read as inert.
          inert: session?.status === 'countdown',
        })
      : null;

  const marqueeContent = h(Marquee, {
    title,
    accentColor,
    muted,
    onToggleMute: handleToggleMute,
    onLongPress: () => setDiagnosticsOpen(true),
  });

  return h(
    Fragment,
    null,
    h(Cabinet, { marquee: marqueeContent, screen: screenContent, panel: panelContent }),
    diagnosticsOpen ? h(DiagnosticsOverlay, { core, onClose: () => setDiagnosticsOpen(false) }) : null,
  );
}
