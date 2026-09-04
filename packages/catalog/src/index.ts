/**
 * @arcade/catalog — declarative game registry (M1.11 "cableado").
 *
 * The one place that knows both the core and the games, and only as data
 * (Art. 3.8, this package's CLAUDE.md): an id, a title, the accent colour and
 * panel the marquee/selection screen need synchronously, and a dynamic
 * `import()` that loads the game's actual `GameModule` only when a session
 * for it actually starts.
 *
 * SUPUESTO: `id`/`title`/`accentColor`/`resolution`/`panel` below are
 * declared here as plain data, duplicating what `testPattern` already
 * declares in `packages/games/test-pattern/src/index.ts`. The alternative —
 * a static `import { testPattern } from '@arcade/game-test-pattern'` re-read
 * for its fields — would pull the whole game module (and everything it
 * imports) into the initial bundle just to read five constants, defeating
 * the "import dinámico" walking-skeleton.md §2.1 asks for. Duplication here
 * is the cost of keeping the selection screen synchronous while the actual
 * game code is code-split; if a future game's metadata drifts from its
 * module, that is a bug in this file, not in the game.
 */
import type { AnyGameModule, ControlPanel, Resolution } from '@arcade/contracts';

export interface CatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly accentColor: string;
  readonly resolution: Resolution;
  readonly panel: ControlPanel;
  /** Loads the full `GameModule` lazily. Not evaluated until a session for this game actually starts. */
  load(): Promise<AnyGameModule>;
}

export const CATALOG: readonly CatalogEntry[] = [
  {
    id: 'test-pattern',
    title: 'TEST PATTERN',
    accentColor: '#39ff14',
    resolution: { width: 200, height: 150 },
    panel: {
      stick: 'horizontal',
      buttons: [{ id: 'fire', label: 'FIRE', color: 'red' }],
    },
    load: () => import('@arcade/game-test-pattern').then((module) => module.testPattern),
  },
];

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.id === id);
}
