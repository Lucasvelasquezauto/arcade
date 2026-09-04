import { describe, expect, it } from 'vitest';
import { qualifiesForTop10 } from '../src/screens/records.js';
import type { RecordEntry } from '../src/types.js';

function entry(score: number): RecordEntry {
  return { name: 'AAAAA', score, achievedAt: '2026-01-01T00:00:00.000Z', confirmed: true };
}

describe('qualifiesForTop10 (product-spec.md §4, §8)', () => {
  it('always qualifies when the table has room', () => {
    expect(qualifiesForTop10([], 1)).toBe(true);
    expect(qualifiesForTop10([entry(10)], 0)).toBe(true);
  });

  it('qualifies a score higher than the current lowest of a full table', () => {
    const top10 = Array.from({ length: 10 }, (_, i) => entry(100 - i));
    expect(qualifiesForTop10(top10, 92)).toBe(true);
  });

  it('a tie with the lowest still qualifies (recency wins the tie-break)', () => {
    const top10 = Array.from({ length: 10 }, (_, i) => entry(100 - i));
    expect(qualifiesForTop10(top10, 91)).toBe(true);
  });

  it('rejects a score below the current lowest of a full table', () => {
    const top10 = Array.from({ length: 10 }, (_, i) => entry(100 - i));
    expect(qualifiesForTop10(top10, 50)).toBe(false);
  });
});
