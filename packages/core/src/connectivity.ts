/**
 * Connection status (spec §8.3's `online` trigger, §9's "estado de la
 * conexión"). Small enough that records and diagnostics share one adapter
 * instead of each listening to `online`/`offline` on their own.
 *
 * Same split as the rest of this package: nothing here is browser-only
 * logic worth testing — it is thin wiring around two globals — so, like
 * `attachBrowserLifecycle`, it has no unit tests of its own.
 */
import { realIsOnline, realVisibilitySource, type EventTarget } from './env.js';

/**
 * Calls `onChange` once immediately with the current status, then again on
 * every `online`/`offline` transition. Returns an unsubscribe function.
 */
export function attachConnectivity(
  onChange: (online: boolean) => void,
  { window }: { window: EventTarget } = realVisibilitySource,
): () => void {
  const onOnline = (): void => onChange(true);
  const onOffline = (): void => onChange(false);

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  onChange(realIsOnline());

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
