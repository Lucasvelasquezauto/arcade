import { describe, expect, it } from 'vitest';
import { MemoryQueueStore } from '../src/records/memory-queue-store.js';
import { RecordsQueue } from '../src/records/records-queue.js';
import type { RecordsNetworkClient, ServerRecordSummary } from '../src/records/types.js';

function fakeClock(startIso = '2026-09-03T00:00:00.000Z'): () => string {
  return () => startIso;
}

function sequentialIds(prefix = 'client'): () => string {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

interface FakeNetworkOptions {
  readonly failClientIds?: ReadonlySet<string>;
}

function fakeNetwork({ failClientIds = new Set() }: FakeNetworkOptions = {}): {
  network: RecordsNetworkClient;
  submitCallsByClientId: Map<string, number>;
} {
  const submitCallsByClientId = new Map<string, number>();
  const network: RecordsNetworkClient = {
    async submitScore(input) {
      submitCallsByClientId.set(input.clientId, (submitCallsByClientId.get(input.clientId) ?? 0) + 1);
      if (failClientIds.has(input.clientId)) throw new Error('network down');
      const server: ServerRecordSummary = {
        id: `server-${input.clientId}`,
        clientId: input.clientId,
        gameId: input.gameId,
        name: input.name,
        score: input.score,
        createdAt: '2026-09-03T00:00:01.000Z',
      };
      return server;
    },
    async getTopScores() {
      return [];
    },
  };
  return { network, submitCallsByClientId };
}

describe('RecordsQueue (spec §8.1–§8.2, §8.5–§8.6)', () => {
  it('enqueue writes to the local store first and never touches the network (§8.1, §8.6)', async () => {
    const store = new MemoryQueueStore();
    const { network, submitCallsByClientId } = fakeNetwork();
    const queue = new RecordsQueue({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    const record = await queue.enqueue('space-invaders', 'LUC', 1200);

    expect(record.clientId).toBe('client-1');
    expect(await store.all()).toEqual([record]);
    expect(submitCallsByClientId.size).toBe(0);
  });

  it('flush submits every queued record and removes confirmed ones (§8.5)', async () => {
    const store = new MemoryQueueStore();
    const { network } = fakeNetwork();
    const queue = new RecordsQueue({ store, network, generateClientId: sequentialIds(), now: fakeClock() });
    await queue.enqueue('space-invaders', 'LUC', 1200);
    await queue.enqueue('space-invaders', 'ABC', 900);

    const results = await queue.flush();

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.confirmed)).toBe(true);
    expect(await store.all()).toEqual([]);
  });

  it('a network failure during flush never throws and leaves the record queued (§8.6)', async () => {
    const store = new MemoryQueueStore();
    const { network } = fakeNetwork({ failClientIds: new Set(['client-1']) });
    const queue = new RecordsQueue({ store, network, generateClientId: sequentialIds(), now: fakeClock() });
    await queue.enqueue('space-invaders', 'LUC', 1200);

    const results = await queue.flush();
    expect(results).toEqual([{ record: expect.objectContaining({ clientId: 'client-1' }), confirmed: false }]);

    const pending = await queue.pending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.clientId).toBe('client-1');
  });

  it('a retry after a failed flush resubmits the SAME clientId, never a new one (§8.2 dedupe)', async () => {
    const store = new MemoryQueueStore();
    const failing = new Set(['client-1']);
    const { network, submitCallsByClientId } = fakeNetwork({ failClientIds: failing });
    const queue = new RecordsQueue({ store, network, generateClientId: sequentialIds(), now: fakeClock() });
    await queue.enqueue('space-invaders', 'LUC', 1200);

    await queue.flush(); // fails, stays queued
    failing.delete('client-1'); // simulate connectivity coming back
    await queue.flush(); // succeeds this time

    expect(submitCallsByClientId.get('client-1')).toBe(2);
    expect(submitCallsByClientId.size).toBe(1); // never generated a second id for the same logical record
    expect(await store.all()).toEqual([]);
  });

  it('pending(gameId) filters to that game only', async () => {
    const store = new MemoryQueueStore();
    const { network } = fakeNetwork();
    const queue = new RecordsQueue({ store, network, generateClientId: sequentialIds(), now: fakeClock() });
    await queue.enqueue('space-invaders', 'LUC', 1200);
    await queue.enqueue('arkanoid', 'ABC', 500);

    expect(await queue.pending('space-invaders')).toHaveLength(1);
    expect(await queue.size()).toBe(2);
  });

  it('flush is a no-op, resolved cleanly, when the queue is empty', async () => {
    const store = new MemoryQueueStore();
    const { network } = fakeNetwork();
    const queue = new RecordsQueue({ store, network, generateClientId: sequentialIds(), now: fakeClock() });

    await expect(queue.flush()).resolves.toEqual([]);
  });
});
