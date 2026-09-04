/**
 * Data model for the records queue (spec §8). Mirrors the columns in
 * `docs/specs/walking-skeleton.md` §5 v1.1 (`public.scores` + the not-yet-
 * applied `client_id` column — see `docs/handoff/1.9-core-records.md`).
 */

/** A record written to the local queue (§8.1), before the server has confirmed it. */
export interface QueuedRecord {
  /** Generated on the client, once, at enqueue time (§8.2) — never regenerated on retry. */
  readonly clientId: string;
  readonly gameId: string;
  readonly name: string;
  readonly score: number;
  /** ISO 8601, local device clock — display only while unconfirmed (never sent as `created_at`: §5 says that's the server's). */
  readonly queuedAt: string;
}

/** What the server hands back once a record is written (`public.scores`, server-assigned `id`/`created_at`). */
export interface ServerRecordSummary {
  readonly id: string;
  readonly clientId: string;
  readonly gameId: string;
  readonly name: string;
  readonly score: number;
  readonly createdAt: string;
}

/** One row of a displayed top 10 — same shape whether confirmed or still queued (§8.4). */
export interface RecordEntry {
  readonly name: string;
  readonly score: number;
  readonly achievedAt: string;
  readonly confirmed: boolean;
}

export interface RecordsView {
  readonly top10: readonly RecordEntry[];
}

/** Local persistence for the queue (§8.1). `IndexedDBQueueStore` is the real adapter; this is what `RecordsQueue` is tested against. */
export interface RecordQueueStore {
  all(): Promise<readonly QueuedRecord[]>;
  put(record: QueuedRecord): Promise<void>;
  remove(clientId: string): Promise<void>;
}

/** The network boundary (§8.5, §8.6): every call can fail, and a failure must never throw past `RecordsQueue.flush`. */
export interface RecordsNetworkClient {
  submitScore(input: Omit<QueuedRecord, 'queuedAt'>): Promise<ServerRecordSummary>;
  getTopScores(gameId: string, limit?: number): Promise<readonly ServerRecordSummary[]>;
}
