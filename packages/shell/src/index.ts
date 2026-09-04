/**
 * @arcade/shell — the cabinet (docs/specs/shell.md).
 *
 * Public surface: the `App` component and the exact `CoreHandle`/`AppProps`
 * contract it needs from whoever wires it up (today: fixtures inside this
 * package; eventually: `apps/arcade` with `@arcade/core` and
 * `@arcade/catalog`). See `docs/handoff/1.7-shell.md`.
 */
export { App } from './App.js';
export type {
  AppProps,
  CoreHandle,
  DiagnosticsView,
  GameCatalogEntry,
  RecordEntry,
  RecordsView,
  SessionStatus,
  SessionView,
} from './types.js';
export { APP_NAME } from './theme/tokens.js';

// Fixtures: exercise this package without a real core. Not for production
// wiring — apps/arcade must supply a real CoreHandle and catalog instead.
export { FIXTURE_CATALOG } from './fixtures/fakeCatalog.js';
export { createFixtureCoreHandle } from './fixtures/fakeCore.js';
