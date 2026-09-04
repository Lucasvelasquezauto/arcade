/**
 * apps/arcade — the real `CoreHandle` (packages/shell/src/types.ts) that
 * wires `@arcade/core`'s platform pieces to a session of whatever game
 * `@arcade/catalog` resolves. This file is the one place in the app that
 * turns "attach this canvas for this gameId" into an actually running
 * `GameLoop`; the shell never sees any of it (Art. 3.7), and the core never
 * knows a game exists until this file hands it one (Art. 3.8).
 */
import {
  WebAudioPlayer,
  RecordsService,
  createRecordQueueStore,
  createSupabaseRecordsClient,
  attachAutoFlush,
  type RecordsNetworkClient,
} from '@arcade/core';
import type { CoreHandle, DiagnosticsView, SessionView } from '@arcade/shell';
import { findCatalogEntry } from '@arcade/catalog';
import { GameSession } from './game-session.js';

const IDLE_SESSION_VIEW: SessionView = { score: 0, status: 'countdown', countdown: null, gameStatus: 'playing' };

// core.md §8.8: credentials arrive as env vars, never hardcoded. `@arcade/core`
// deliberately does not read `import.meta.env` itself (that would couple the
// platform to Vite, docs/handoff/1.9-core-records.md §2) — apps/arcade, as the
// composition root, is the one place that reads them and hands them over.
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

// REPORTADO (docs/handoff/1.13-cierre-m1.md): `@arcade/core`'s `index.ts`
// does not re-export `realGenerateClientId`/`realNowIso` from `env.ts` (only
// `records/*` and `diagnostics/*` are barrel-exported), even though
// docs/handoff/1.9-core-records.md §3's own recipe imports both from
// `@arcade/core`. Not a `packages/core` change I'm allowed to make here, and
// these are trivial standard-Web-API one-liners with no core-internal
// coupling, so they are provided locally instead of blocking on it.
const generateClientId = (): string => crypto.randomUUID();
const nowIso = (): string => new Date().toISOString();

/**
 * §8.6 ("un fallo de red nunca puede bloquear el juego") also covers
 * construction, not just calls: `createSupabaseRecordsClient` validates its
 * config synchronously and throws if the URL is missing/malformed
 * (`supabaseUrl is required`), and `createRealCoreHandle` runs before the
 * shell ever renders a single frame — an uncaught throw here would blank the
 * whole cabinet before a player could even pick a game, which is a worse
 * failure than "no records today". Falling back to a network client that
 * always rejects keeps the local queue and the rest of the app working;
 * `RecordsQueue.flush` already swallows a rejection per record (§8.6).
 */
function createRecordsNetworkClient(): RecordsNetworkClient {
  try {
    return createSupabaseRecordsClient({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
  } catch (error) {
    console.error('CoreHandle: no se pudo construir el cliente de récords de Supabase; la cola local sigue activa.', error);
    return {
      submitScore: () => Promise.reject(new Error('Records network client unavailable')),
      getTopScores: () => Promise.resolve([]),
    };
  }
}

export function createRealCoreHandle(): CoreHandle {
  const audioPlayer = new WebAudioPlayer();
  // core.md §6.2: unlocked by the player's first gesture anywhere in the app
  // — the mute toggle and the selection screen are reachable before any game
  // starts, so this cannot wait for a canvas to attach.
  document.addEventListener('pointerdown', () => audioPlayer.unlock());

  let online = navigator.onLine;
  window.addEventListener('online', () => {
    online = true;
  });
  window.addEventListener('offline', () => {
    online = false;
  });

  // docs/handoff/1.9-core-records.md §3: assembled exactly as that recipe
  // describes. §8.6: `submit`/`flush` never await the network on the caller's
  // path, so nothing here can make a player wait on Supabase.
  const recordsService = new RecordsService({
    store: createRecordQueueStore(),
    network: createRecordsNetworkClient(),
    generateClientId,
    now: nowIso,
  });
  // §8.3: three of the four flush triggers (open, focus, online) — the
  // fourth (end of game) has no event in @arcade/core to hang off, since
  // that package has no notion of a running session; wired below, in
  // publishSession, where this composition root already observes it.
  attachAutoFlush(recordsService);

  let recordsQueueSize = 0;
  recordsService.subscribeQueueSize((size) => {
    recordsQueueSize = size;
  });

  let session: GameSession | null = null;
  let lastKnownScore = 0;
  let previousGameStatus: 'playing' | 'over' = 'playing';
  const sessionListeners = new Set<(view: SessionView) => void>();

  function publishSession(): void {
    const view = session?.view() ?? IDLE_SESSION_VIEW;
    if (session !== null) {
      lastKnownScore = view.score;
      // §8.3 "al terminar cada partida": the one flush trigger `attachAutoFlush`
      // cannot cover. Fires once, on the playing->over edge, never on every
      // frame the game stays over.
      if (previousGameStatus === 'playing' && view.gameStatus === 'over') void recordsService.flush();
      previousGameStatus = view.gameStatus;
    }
    for (const listener of sessionListeners) listener(view);
  }

  function endSession(): void {
    session?.destroy();
    session = null;
  }

  return {
    attachCanvas(canvas, gameId) {
      endSession();
      const entry = findCatalogEntry(gameId);
      if (!entry) throw new Error(`CoreHandle.attachCanvas: id de juego desconocido en el catálogo: "${gameId}"`);
      previousGameStatus = 'playing';
      session = new GameSession(canvas, entry, audioPlayer, publishSession);
      publishSession();
    },

    detachCanvas() {
      endSession();
      publishSession();
    },

    subscribeSession(listener) {
      sessionListeners.add(listener);
      listener(session?.view() ?? IDLE_SESSION_VIEW);
      return () => {
        sessionListeners.delete(listener);
      };
    },

    setStick(x, y) {
      session?.setStick(x, y);
    },

    setButton(id, down) {
      session?.setButton(id, down);
    },

    pauseManually() {
      session?.pauseManually();
    },

    resumeManually() {
      session?.resumeManually();
    },

    submitScore(gameId, name) {
      // The score comes from the session that just ended, not from this call
      // (CoreHandle.submitScore only takes gameId/name — see shell/src/types.ts)
      // — by the time NameEntryScreen calls this, GameScreen has already
      // unmounted and detachCanvas destroyed the session. §8.6: fire-and-forget,
      // never awaited, so a slow or failed network never blocks this call.
      void recordsService.submit(gameId, name, lastKnownScore);
    },

    subscribeRecords(gameId, listener) {
      return recordsService.subscribeRecords(gameId, listener);
    },

    setMuted(muted) {
      audioPlayer.setMuted(muted);
    },

    subscribeDiagnostics(listener) {
      function emit(): void {
        const metrics = session?.diagnosticsSnapshot() ?? { fps: 0, ticksPerSecond: 0, droppedTicks: 0, pauseLog: [] };
        const view: DiagnosticsView = {
          fps: metrics.fps,
          ticksPerSecond: metrics.ticksPerSecond,
          droppedTicks: metrics.droppedTicks,
          recordsQueueSize,
          online,
          pauseLog: metrics.pauseLog,
        };
        listener(view);
      }
      emit();
      const timer = window.setInterval(emit, 1000);
      return () => window.clearInterval(timer);
    },
  };
}
