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

// core.md §4.0 / shell.md §5: the shell declares the stick's dead zone and
// hands it to the core as a parameter — apps/arcade needs this value to
// construct `@arcade/core`'s `TouchInput` for a session.
export { STICK_DEAD_ZONE_RATIO } from './controls/touch.js';

// product-spec.md §2.1 regla 1: apps/arcade needs the same fine-pointer
// signal `Cabinet.ts` uses, to decide whether the canvas itself should
// smooth-magnify to fill its letterboxed area (core.md §5.4b).
export { prefersFinePointer } from './platform/pointer.js';

// Fixtures: exercise this package without a real core. Not for production
// wiring — apps/arcade must supply a real CoreHandle and catalog instead.
export { FIXTURE_CATALOG } from './fixtures/fakeCatalog.js';
export { createFixtureCoreHandle } from './fixtures/fakeCore.js';
