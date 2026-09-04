import type { RecordEntry } from '../types.js';

/**
 * Client-side, best-effort check of whether a score would land in the top
 * 10 — used only to decide whether Game Over routes to name entry or
 * straight to the records table (product-spec.md §4). SUPUESTO: the server
 * remains the real authority once a name is actually submitted
 * (product-spec.md §8); this can be stale under concurrent writes from
 * other devices, which is accepted because the binding check happens
 * server-side, not here.
 *
 * Ties favour the newer entry (product-spec.md §8's tie-break), so a score
 * equal to the current lowest still qualifies.
 */
export function qualifiesForTop10(
  top10: readonly RecordEntry[],
  score: number,
  capacity = 10,
): boolean {
  if (top10.length < capacity) return true;
  const lowest = top10[top10.length - 1];
  return lowest !== undefined && score >= lowest.score;
}
