import { describe, expect, it } from 'vitest';
import { mergeRecordsView } from '../src/records/merge-view.js';
import type { QueuedRecord, ServerRecordSummary } from '../src/records/types.js';

function server(overrides: Partial<ServerRecordSummary> = {}): ServerRecordSummary {
  return {
    id: 'server-1',
    clientId: 'client-1',
    gameId: 'space-invaders',
    name: 'LUC',
    score: 1000,
    createdAt: '2026-09-03T00:00:00.000Z',
    ...overrides,
  };
}

function queued(overrides: Partial<QueuedRecord> = {}): QueuedRecord {
  return {
    clientId: 'client-2',
    gameId: 'space-invaders',
    name: 'ABC',
    score: 500,
    queuedAt: '2026-09-03T00:05:00.000Z',
    ...overrides,
  };
}

describe('mergeRecordsView (spec §8.4–§8.5)', () => {
  it('reproduces the server top 10 exactly, marked confirmed, never re-sorted (§8.5)', () => {
    const top10 = [server({ clientId: 'a', score: 900 }), server({ clientId: 'b', score: 1500 })]; // deliberately NOT score-descending
    const view = mergeRecordsView(top10, []);
    expect(view.top10).toEqual([
      { name: 'LUC', score: 900, achievedAt: '2026-09-03T00:00:00.000Z', confirmed: true },
      { name: 'LUC', score: 1500, achievedAt: '2026-09-03T00:00:00.000Z', confirmed: true },
    ]);
  });

  it('appends a still-pending record after the server top 10, unconfirmed, with its real score (§8.4)', () => {
    const top10 = [server()];
    const pending = [queued()];
    const view = mergeRecordsView(top10, pending);
    expect(view.top10).toHaveLength(2);
    expect(view.top10[1]).toEqual({ name: 'ABC', score: 500, achievedAt: '2026-09-03T00:05:00.000Z', confirmed: false });
  });

  it('drops a pending record once the server top 10 already reflects its clientId', () => {
    const top10 = [server({ clientId: 'client-2' })];
    const pending = [queued({ clientId: 'client-2' })];
    const view = mergeRecordsView(top10, pending);
    expect(view.top10).toHaveLength(1);
    expect(view.top10[0]?.confirmed).toBe(true);
  });

  it('shows only the pending record when there is no server data yet (offline top 10 read)', () => {
    const view = mergeRecordsView([], [queued()]);
    expect(view.top10).toEqual([{ name: 'ABC', score: 500, achievedAt: '2026-09-03T00:05:00.000Z', confirmed: false }]);
  });

  it('is empty when there is nothing confirmed and nothing pending', () => {
    expect(mergeRecordsView([], [])).toEqual({ top10: [] });
  });
});
