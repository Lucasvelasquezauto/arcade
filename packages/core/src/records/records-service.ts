/**
 * Ties the queue (`RecordsQueue`) to the network's top-10 read and to
 * per-game subscriptions — the piece that turns "flush succeeded" into
 * "re-read the top 10" (spec §8.5) and "queue changed" into "tell whoever is
 * watching" (§8.4). Built entirely from the injected `store`/`network` of
 * `RecordsQueueDeps`, so it is testable with in-memory fakes, no browser.
 *
 * What this class does NOT do: decide when to flush automatically (that is
 * `attachAutoFlush`, the real adapter below) or know that a game ended (this
 * package has no notion of a running session — see
 * `docs/handoff/1.9-core-records.md` for the wiring recipe).
 */
import { mergeRecordsView } from './merge-view.js';
import { RecordsQueue, type RecordsQueueDeps } from './records-queue.js';
import type { QueuedRecord, RecordsView, ServerRecordSummary } from './types.js';

type Unsubscribe = () => void;

export class RecordsService {
  private readonly queue: RecordsQueue;
  private readonly network: RecordsQueueDeps['network'];
  private readonly topByGame = new Map<string, readonly ServerRecordSummary[]>();
  private readonly viewListeners = new Map<string, Set<(view: RecordsView) => void>>();
  private readonly sizeListeners = new Set<(size: number) => void>();

  constructor(deps: RecordsQueueDeps) {
    this.queue = new RecordsQueue(deps);
    this.network = deps.network;
  }

  /**
   * Rule §8.1/§8.6: written to the queue first; the network attempt below is
   * fire-and-forget and never awaited by the caller — submitting a score is
   * never on a game's path.
   */
  async submit(gameId: string, name: string, score: number): Promise<QueuedRecord> {
    const record = await this.queue.enqueue(gameId, name, score);
    await this.publishSize();
    await this.publishView(gameId);
    void this.flush();
    return record;
  }

  /**
   * Rule §8.3: call this at every real opportunity (app open, focus regained,
   * `online`, end of a game — see `attachAutoFlush` for the first three).
   * Rule §8.6: never throws, regardless of how the network behaves.
   */
  async flush(): Promise<void> {
    const results = await this.queue.flush();
    if (results.length === 0) return;

    await this.publishSize();

    const confirmedGames = new Set(results.filter((r) => r.confirmed).map((r) => r.record.gameId));
    for (const gameId of confirmedGames) await this.refreshTop(gameId); // rule §8.5

    const touchedGames = new Set(results.map((r) => r.record.gameId));
    for (const gameId of touchedGames) await this.publishView(gameId);
  }

  /** Emits the current merged view immediately, then again whenever the queue or the server top 10 for `gameId` changes. */
  subscribeRecords(gameId: string, listener: (view: RecordsView) => void): Unsubscribe {
    let listeners = this.viewListeners.get(gameId);
    if (listeners === undefined) {
      listeners = new Set();
      this.viewListeners.set(gameId, listeners);
    }
    listeners.add(listener);

    void this.publishView(gameId);
    if (!this.topByGame.has(gameId)) void this.refreshTop(gameId);

    const captured = listeners;
    return () => {
      captured.delete(listener);
    };
  }

  /** Diagnostics feed (spec §9's "tamaño de la cola de récords") — every game's pending count combined. */
  subscribeQueueSize(listener: (size: number) => void): Unsubscribe {
    this.sizeListeners.add(listener);
    void this.publishSize();
    return () => {
      this.sizeListeners.delete(listener);
    };
  }

  private async refreshTop(gameId: string): Promise<void> {
    try {
      const top = await this.network.getTopScores(gameId);
      this.topByGame.set(gameId, top);
      await this.publishView(gameId);
    } catch {
      // Rule §8.6: a read failure just leaves the last known top 10 on screen.
    }
  }

  private async publishView(gameId: string): Promise<void> {
    const listeners = this.viewListeners.get(gameId);
    if (listeners === undefined || listeners.size === 0) return;
    const pending = await this.queue.pending(gameId);
    const view = mergeRecordsView(this.topByGame.get(gameId) ?? [], pending);
    for (const listener of listeners) listener(view);
  }

  private async publishSize(): Promise<void> {
    if (this.sizeListeners.size === 0) return;
    const size = await this.queue.size();
    for (const listener of this.sizeListeners) listener(size);
  }
}
