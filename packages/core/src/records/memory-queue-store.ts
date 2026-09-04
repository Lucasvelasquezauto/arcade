/**
 * In-memory `RecordQueueStore`. Two uses: it is the fake the tests for
 * `RecordsQueue`/`RecordsService` are written against, and it is the
 * automatic fallback `createRecordQueueStore` (in
 * `indexeddb-queue-store.ts`) picks when IndexedDB itself is unavailable.
 *
 * SUPUESTO — that fallback trades durability (a record made this way is
 * lost if the tab closes before it flushes) for rule §8.6 ("un fallo de red
 * nunca cuesta un récord ni bloquea el juego"): the alternative, throwing
 * because there is nowhere to persist the queue, would be worse — it turns
 * a platform quirk (IndexedDB blocked in some locked-down private mode) into
 * a crash. No spec fixes this trade-off explicitly.
 */
import type { QueuedRecord, RecordQueueStore } from './types.js';

export class MemoryQueueStore implements RecordQueueStore {
  private readonly records = new Map<string, QueuedRecord>();

  async all(): Promise<readonly QueuedRecord[]> {
    return Promise.resolve([...this.records.values()]);
  }

  async put(record: QueuedRecord): Promise<void> {
    this.records.set(record.clientId, record);
    return Promise.resolve();
  }

  async remove(clientId: string): Promise<void> {
    this.records.delete(clientId);
    return Promise.resolve();
  }
}
