/**
 * Builds the displayed records view (spec §8.4–§8.5). Pure and total: given
 * a server top 10 and this game's still-pending queue entries, produce the
 * list the shell renders.
 */
import type { QueuedRecord, RecordEntry, RecordsView, ServerRecordSummary } from './types.js';

/**
 * Rule §8.5: "el servidor es la autoridad del orden" — `serverTop10` is
 * reproduced exactly as received, never re-sorted or re-capped here. Rule
 * §8.4: any of this game's queue entries not yet reflected in that list are
 * appended, unconfirmed, with their real score, so the player sees their own
 * record even with no connection.
 *
 * SUPUESTO — neither §8 nor `product-spec.md` says where a still-pending
 * entry belongs in the displayed order; the server is the only thing that
 * could rank it, and it hasn't seen it yet. Appending after the confirmed
 * top 10, in queue order, is the simplest reading that doesn't invent a
 * client-side ranking.
 */
export function mergeRecordsView(
  serverTop10: readonly ServerRecordSummary[],
  pendingForGame: readonly QueuedRecord[],
): RecordsView {
  const confirmed: RecordEntry[] = serverTop10.map((r) => ({
    name: r.name,
    score: r.score,
    achievedAt: r.createdAt,
    confirmed: true,
  }));

  const alreadyConfirmed = new Set(serverTop10.map((r) => r.clientId));
  const pending: RecordEntry[] = pendingForGame
    .filter((r) => !alreadyConfirmed.has(r.clientId))
    .map((r) => ({ name: r.name, score: r.score, achievedAt: r.queuedAt, confirmed: false }));

  return { top10: [...confirmed, ...pending] };
}
