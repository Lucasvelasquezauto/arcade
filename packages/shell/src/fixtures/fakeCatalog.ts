/**
 * Generic, non-game-specific fixtures for exercising this package on its
 * own, since neither `@arcade/core` nor `@arcade/catalog` exist yet
 * (docs/execution-plan.md, M1.4–M1.6). None of these ids, titles or colours
 * refer to any real game — shell.md §10/§9 forbids that even in fixtures.
 */
import type { GameCatalogEntry } from '../types.js';

export const FIXTURE_CATALOG: readonly GameCatalogEntry[] = [
  {
    id: 'shell-fixture-one-button',
    title: 'Prueba uno',
    accentColor: '#ff5470',
    resolution: { width: 224, height: 256 },
    panel: {
      stick: 'horizontal',
      buttons: [{ id: 'action', label: 'A', color: 'red' }],
    },
  },
  {
    id: 'shell-fixture-no-buttons',
    title: 'Prueba dos',
    accentColor: '#39d98a',
    resolution: { width: 224, height: 288 },
    panel: {
      stick: 'four-way',
      buttons: [],
    },
  },
  {
    id: 'shell-fixture-two-buttons',
    title: 'Prueba tres',
    accentColor: '#4da6ff',
    resolution: { width: 256, height: 224 },
    panel: {
      stick: 'horizontal',
      buttons: [
        { id: 'action-a', label: 'A', color: 'blue' },
        { id: 'action-b', label: 'B', color: 'yellow' },
      ],
    },
  },
];
