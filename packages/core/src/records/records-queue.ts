/**
 * The offline queue itself (spec §8.1–§8.2, §8.5–§8.6). Everything here is
 * decidable without touching IndexedDB or a real network: `store` and
 * `network` are injected, so this is the part covered by Vitest — the real
 * adapters (`IndexedDBQueueStore`, `createSupabaseRecordsClient`) are thin
 * wiring around this, untested, same split as `GameLoop`/`WebAudioPlayer`.
 */
import type { QueuedRecord, RecordQueueStore, RecordsNetworkClient, ServerRecordSummary } from './types.js';

export interface RecordsQueueDeps {
  readonly store: RecordQueueStore;
  readonly network: RecordsNetworkClient;
  readonly generateClientId: () => string;
  readonly now: () => string;
}

export interface FlushResult {
  readonly record: QueuedRecord;
  readonly confirmed: boolean;
  readonly server?: ServerRecordSummary;
}

export class RecordsQueue {
  constructor(private readonly deps: RecordsQueueDeps) {}

  /**
   * Rule §8.1: written to the local queue FIRST. Rule §8.6: this never
   * touches the network — enqueueing a record is never on a game's path.
   */
  async enqueue(gameId: string, name: string, score: number): Promise<QueuedRecord> {
    const record: QueuedRecord = {
      clientId: this.deps.generateClientId(),
      gameId,
      name,
      score,
      queuedAt: this.deps.now(),
    };
    await this.deps.store.put(record);
    return record;
  }

  /**
   * Attempts to submit every queued record, in queue order. Rule §8.6: a
   * failure for one record is swallowed here, never thrown — the record
   * simply stays queued for the next real opportunity (§8.3). A record the
   * network confirms is removed from the local queue (rule §8.5: the server
   * becomes its source of truth from that point on).
   *
   * Retries always resubmit the SAME `clientId` (never regenerated — see
   * `enqueue`), which is what makes a retry after a lost response safe to
   * repeat rather than a duplicate (§8.2); the network client is the layer
   * responsible for actually being idempotent on that id.
   */
  async flush(): Promise<readonly FlushResult[]> {
    const pending = await this.deps.store.all();
    const results: FlushResult[] = [];
    for (const record of pending) {
      try {
        const server = await this.deps.network.submitScore(record);
        await this.deps.store.remove(record.clientId);
        results.push({ record, confirmed: true, server });
      } catch {
        results.push({ record, confirmed: false });
      }
    }
    return results;
  }

  async pending(gameId?: string): Promise<readonly QueuedRecord[]> {
    const all = await this.deps.store.all();
    return gameId === undefined ? all : all.filter((r) => r.gameId === gameId);
  }

  async size(): Promise<number> {
    return (await this.deps.store.all()).length;
  }
}
