/**
 * Screen flow (product-spec.md §4). Deliberately holds NOTHING but routing
 * state: which screen, which game, the score captured at game-over. This is
 * presentation state, not game state — the risk spec §2 warns about is game
 * state leaking in here, and none does: the score is a copy read once from
 * `SessionView` at the moment the game ended, not a live link to it.
 *
 * Pause/countdown are not navigation — they are overlays drawn on top of the
 * 'game' screen, driven directly by `SessionView.status` (see overlays/).
 * Diagnostics is likewise an overlay, reachable from any screen.
 */
import { signal, type Signal } from '@preact/signals';

export type ScreenName = 'selection' | 'game' | 'game-over' | 'name-entry' | 'records';

export interface NavState {
  readonly screen: ScreenName;
  readonly gameId: string | null;
  readonly finalScore: number | null;
}

const SELECTION: NavState = { screen: 'selection', gameId: null, finalScore: null };

export interface Navigation {
  readonly state: Signal<NavState>;
  goToSelection(): void;
  goToGame(gameId: string): void;
  goToGameOver(gameId: string, finalScore: number): void;
  goToNameEntry(gameId: string, finalScore: number): void;
  goToRecords(gameId: string): void;
}

export function createNavigation(): Navigation {
  const state = signal<NavState>(SELECTION);

  return {
    state,
    goToSelection(): void {
      state.value = SELECTION;
    },
    goToGame(gameId: string): void {
      state.value = { screen: 'game', gameId, finalScore: null };
    },
    goToGameOver(gameId: string, finalScore: number): void {
      state.value = { screen: 'game-over', gameId, finalScore };
    },
    goToNameEntry(gameId: string, finalScore: number): void {
      state.value = { screen: 'name-entry', gameId, finalScore };
    },
    goToRecords(gameId: string): void {
      state.value = { screen: 'records', gameId, finalScore: null };
    },
  };
}
