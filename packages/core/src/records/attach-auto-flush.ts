/**
 * Wires three of the four real flush opportunities from spec §8.3: opening
 * the app (fires once immediately), regaining focus/visibility, and
 * regaining connectivity. The fourth — "al terminar cada partida" — has no
 * event to listen for here: this package has no notion of a running game
 * session, so whoever detects `GameModule.readStatus(state) === 'over'`
 * must call `service.flush()` itself (see `docs/handoff/1.9-core-records.md`).
 *
 * Untested: thin real event wiring, like `attachBrowserLifecycle`.
 */
import { attachConnectivity } from '../connectivity.js';
import { realVisibilitySource, type EventTarget } from '../env.js';
import type { RecordsService } from './records-service.js';

export function attachAutoFlush(
  service: RecordsService,
  { document, window }: { document: EventTarget & { hidden: boolean }; window: EventTarget } = realVisibilitySource,
): () => void {
  const onVisible = (): void => {
    if (!document.hidden) void service.flush();
  };
  const onFocus = (): void => void service.flush();

  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onFocus);
  const detachConnectivity = attachConnectivity(() => void service.flush(), { window });

  void service.flush(); // rule §8.3: "al abrir la app"

  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onFocus);
    detachConnectivity();
  };
}
