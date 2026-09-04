/**
 * The real network adapter (spec §8: submit + re-read the top 10), over the
 * official Supabase client (`docs/stack-proposal.md`: "Cliente oficial JS" —
 * the one third-party dependency this task is allowed to add). Untested
 * here, same reason as `WebAudioPlayer`: it is wiring around a third-party
 * client and a real network, not decidable logic.
 *
 * SUPUESTO — depends on the `client_id` column and its uniqueness
 * constraint from `docs/specs/walking-skeleton.md` §5 v1.1, which is NOT
 * applied yet (`supabase/migrations/20260903193452_create_scores.sql` is
 * still v1.0, no `client_id`). Until that migration lands, `submitScore`
 * will fail (the column doesn't exist to write to) and every returned
 * `clientId` is meaningless. See `docs/handoff/1.9-core-records.md`.
 *
 * SUPUESTO — idempotent retry via `insert` + catch-the-unique-violation
 * (Postgres error code `23505`), NOT `.upsert()`. The migration only grants
 * `anon`/`authenticated` INSERT and SELECT (`scores_insert_public`,
 * `scores_select_public`) — no UPDATE policy — and Supabase's `.upsert()`
 * compiles to `INSERT ... ON CONFLICT DO UPDATE`, which Postgres RLS
 * evaluates against the UPDATE policy on the conflict branch. Without one,
 * an upsert that actually hits a conflict is rejected. A plain `insert`
 * that fails with `23505` means "a previous attempt already got through
 * before its response reached us" — the fix is to read that row back with
 * the public SELECT policy, not to write again.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RecordsNetworkClient, ServerRecordSummary } from './types.js';

export interface SupabaseRecordsClientConfig {
  readonly url: string;
  readonly anonKey: string;
}

const TABLE = 'scores';
const TOP_SCORES_RPC = 'get_top_scores';
const DEFAULT_TOP_LIMIT = 10;
const UNIQUE_VIOLATION = '23505';

interface ScoreRow {
  readonly id: string;
  readonly client_id: string;
  readonly game_id: string;
  readonly name: string;
  readonly score: number;
  readonly created_at: string;
}

function toSummary(row: ScoreRow): ServerRecordSummary {
  return { id: row.id, clientId: row.client_id, gameId: row.game_id, name: row.name, score: row.score, createdAt: row.created_at };
}

export function createSupabaseRecordsClient(config: SupabaseRecordsClientConfig): RecordsNetworkClient {
  const client: SupabaseClient = createClient(config.url, config.anonKey);

  return {
    async submitScore(input) {
      const inserted = await client
        .from(TABLE)
        .insert({ client_id: input.clientId, game_id: input.gameId, name: input.name, score: input.score })
        .select()
        .single();

      if (inserted.error === null) return toSummary(inserted.data as ScoreRow);
      if (inserted.error.code !== UNIQUE_VIOLATION) throw inserted.error;

      const existing = await client.from(TABLE).select().eq('client_id', input.clientId).single();
      if (existing.error !== null) throw existing.error;
      return toSummary(existing.data as ScoreRow);
    },

    async getTopScores(gameId, limit = DEFAULT_TOP_LIMIT) {
      const { data, error } = await client.rpc(TOP_SCORES_RPC, { p_game_id: gameId, p_limit: limit });
      if (error !== null) throw error;
      return ((data as ScoreRow[] | null) ?? []).map(toSummary);
    },
  };
}
