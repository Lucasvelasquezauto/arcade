import { describe, expect, it } from 'vitest';
import { createNavigation } from '../src/navigation.js';

describe('navigation (product-spec.md §4 flow)', () => {
  it('starts on selection with no game and no score', () => {
    const nav = createNavigation();
    expect(nav.state.value).toEqual({ screen: 'selection', gameId: null, finalScore: null });
  });

  it('walks the full flow: selection -> game -> game-over -> name-entry -> records -> selection', () => {
    const nav = createNavigation();

    nav.goToGame('demo');
    expect(nav.state.value).toEqual({ screen: 'game', gameId: 'demo', finalScore: null });

    nav.goToGameOver('demo', 42);
    expect(nav.state.value).toEqual({ screen: 'game-over', gameId: 'demo', finalScore: 42 });

    nav.goToNameEntry('demo', 42);
    expect(nav.state.value).toEqual({ screen: 'name-entry', gameId: 'demo', finalScore: 42 });

    nav.goToRecords('demo');
    expect(nav.state.value).toEqual({ screen: 'records', gameId: 'demo', finalScore: null });

    nav.goToSelection();
    expect(nav.state.value).toEqual({ screen: 'selection', gameId: null, finalScore: null });
  });

  it('a low score can skip straight from game-over to records without a name', () => {
    const nav = createNavigation();
    nav.goToGame('demo');
    nav.goToGameOver('demo', 3);
    nav.goToRecords('demo');
    expect(nav.state.value).toEqual({ screen: 'records', gameId: 'demo', finalScore: null });
  });

  it('the records shortcut from selection carries no score', () => {
    const nav = createNavigation();
    nav.goToRecords('demo');
    expect(nav.state.value.finalScore).toBeNull();
  });
});
