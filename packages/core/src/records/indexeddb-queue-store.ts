/**
 * The real local queue (spec §8.1: "la cola local en IndexedDB es la fuente
 * de verdad"). Thin and untested here on purpose — same split as
 * `CanvasDrawSurface`/`WebAudioPlayer`: everything decidable without a
 * browser (enqueue, retry, dedupe, confirm) lives in `records-queue.ts` and
 * is unit-tested against `MemoryQueueStore`; this class only turns that
 * logic's calls into actual IndexedDB requests, one object store keyed by
 * `clientId` so a `put` with the same id (a retry) overwrites in place
 * instead of accumulating duplicates.
 */
import type { IDBDatabaseLike, IDBFactoryLike } from '../env.js';
import { realIndexedDBFactory } from '../env.js';
import { MemoryQueueStore } from './memory-queue-store.js';
import type { QueuedRecord, RecordQueueStore } from './types.js';

const DB_NAME = 'arcade-records-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending';

export class IndexedDBQueueStore implements RecordQueueStore {
  private dbPromise: Promise<IDBDatabaseLike> | null = null;

  constructor(private readonly factory: IDBFactoryLike) {}

  private open(): Promise<IDBDatabaseLike> {
    this.dbPromise ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result as IDBDatabaseLike;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'clientId' });
        }
      };
      request.onsuccess = () => resolve(request.result as IDBDatabaseLike);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  async all(): Promise<readonly QueuedRecord[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as QueuedRecord[] | undefined) ?? []);
      request.onerror = () => reject(request.error);
    });
  }

  async put(record: QueuedRecord): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async remove(clientId: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(clientId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/** Real IndexedDB when available, otherwise the in-memory fallback (see `memory-queue-store.ts`). */
export function createRecordQueueStore(factory: IDBFactoryLike | null = realIndexedDBFactory()): RecordQueueStore {
  return factory === null ? new MemoryQueueStore() : new IndexedDBQueueStore(factory);
}
