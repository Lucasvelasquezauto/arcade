import { describe, expect, it, vi } from 'vitest';
import { MemoryQueueStore } from '../src/records/memory-queue-store.js';
import { RecordsService } from '../src/records/records-service.js';
import type { RecordsNetworkClient, RecordsView, ServerRecordSummary } from '../src/records/types.js';

function sequentialIds(): () => string {
  let n = 0;
  return () => `client-${++n}`;
}

function fakeClock(iso = '2026-09-03T00:00:00.000Z'): () => string {
  return () => iso;
}

interface FakeNetwork extends RecordsNetworkClient {
  setTopScores(gameId: string, top: readonly ServerRecordSummary[]): void;
  failNextSubmit(): void;
  getTopScoresCalls: number;
}

function fakeNetwork(): FakeNetwork {
  const topByGame = new Map<string, ServerRecordSummary[]>();
  let failOnce = false;
  let getTopScoresCalls = 0;
  return {
    setTopScores(gameId, top) {
      topByGame.set(gameId, [...top]);
    },
    failNextSubmit() {
      failOnce = true;
    },
    get getTopScoresCalls() {
      return getTopScoresCalls;
    },
    async submitScore(input) {
      if (failOnce) {
        failOnce = false;
        throw new Error('network down');
      }
      const server: ServerRecordSummary = {
        id: `server-${input.clientId}`,
        clientId: input.clientId,
        gameId: input.gameId,
        name: input.name,
        score: input.score,
        createdAt: '2026-09-03T00:00:01.000Z',
      };
      const current = topByGame.get(input.gameId) ?? [];
      topByGame.set(input.gameId, [...current, server]);
      return server;
    },
    async getTopScores(gameId) {
      getTopScoresCalls += 1;
      return topByGame.get(gameId) ?? [];
    },
  };
}

describe('RecordsService (spec §8.3–§8.5)', () => {
  it('submit publishes the pending record immediately, unconfirmed (§8.4)', async () => {
    const store = new MemoryQueueStore();
    const network = fakeNetwork();
    const service = new RecordsService({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    const views: RecordsView[] = [];
    service.subscribeRecords('space-invaders', (view) => views.push(view));
    await service.submit('space-invaders', 'LUC', 1200);
    await flushMicrotasks();

    const withPending = views.find((v) => v.top10.some((e) => !e.confirmed));
    expect(withPending?.top10).toContainEqual({
      name: 'LUC',
      score: 1200,
      achievedAt: '2026-09-03T00:00:00.000Z',
      confirmed: false,
    });
  });

  it('after a successful submit, re-reads the server top 10 and the view flips to confirmed (§8.5)', async () => {
    const store = new MemoryQueueStore();
    const network = fakeNetwork();
    const service = new RecordsService({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    const views: RecordsView[] = [];
    service.subscribeRecords('space-invaders', (view) => views.push(view));
    await service.submit('space-invaders', 'LUC', 1200);
    await flushMicrotasks();

    const last = views.at(-1);
    expect(last?.top10).toEqual([{ name: 'LUC', score: 1200, achievedAt: '2026-09-03T00:00:01.000Z', confirmed: true }]);
    expect(network.getTopScoresCalls).toBeGreaterThan(0);
  });

  it('a submit that fails to reach the network keeps the record queued and visible, unconfirmed (§8.6)', async () => {
    const store = new MemoryQueueStore();
    const network = fakeNetwork();
    network.failNextSubmit();
    const service = new RecordsService({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    const views: RecordsView[] = [];
    service.subscribeRecords('space-invaders', (view) => views.push(view));
    await service.submit('space-invaders', 'LUC', 1200);
    await flushMicrotasks();

    const last = views.at(-1);
    expect(last?.top10).toEqual([{ name: 'LUC', score: 1200, achievedAt: '2026-09-03T00:00:00.000Z', confirmed: false }]);

    // A later flush (simulating "online" or "focus regained") succeeds.
    await service.flush();
    await flushMicrotasks();
    const finalView = views.at(-1);
    expect(finalView?.top10[0]?.confirmed).toBe(true);
  });

  it('subscribeQueueSize reports the total pending count across games', async () => {
    const store = new MemoryQueueStore();
    const network = fakeNetwork();
    network.failNextSubmit();
    const service = new RecordsService({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    const sizes: number[] = [];
    service.subscribeQueueSize((size) => sizes.push(size));
    await service.submit('space-invaders', 'LUC', 1200); // fails, stays queued
    await flushMicrotasks();

    expect(sizes.at(-1)).toBe(1);
  });

  it('unsubscribing stops further notifications', async () => {
    const store = new MemoryQueueStore();
    const network = fakeNetwork();
    const service = new RecordsService({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    const listener = vi.fn();
    const unsubscribe = service.subscribeRecords('space-invaders', listener);
    unsubscribe();
    await service.submit('space-invaders', 'LUC', 1200);
    await flushMicrotasks();

    expect(listener).not.toHaveBeenCalled();
  });
});

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
