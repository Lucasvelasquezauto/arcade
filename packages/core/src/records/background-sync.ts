/**
 * Rule §8.7: Background Sync only as an opportunistic improvement — it does
 * not exist in Safari on iOS, and the design cannot depend on it (the real
 * mechanism is `attachAutoFlush`'s open/focus/online triggers, §8.3).
 * `registration` is handed in by whoever owns the service worker (the core
 * never registers one itself); a missing `sync` API, or the registration
 * call itself failing, is silently ignored — same "detect the capability,
 * never throw" discipline as `haptics.ts`.
 */
export const RECORDS_SYNC_TAG = 'arcade-records-flush';

export interface SyncRegistrationLike {
  readonly sync?: { register(tag: string): Promise<void> };
}

export function registerBackgroundSync(registration: SyncRegistrationLike | null | undefined): void {
  if (registration?.sync === undefined) return;
  registration.sync.register(RECORDS_SYNC_TAG).catch(() => {
    // Best-effort only — see module comment.
  });
}
