/**
 * apps/arcade — the real `CoreHandle` (packages/shell/src/types.ts) that
 * wires `@arcade/core`'s platform pieces to a session of whatever game
 * `@arcade/catalog` resolves. This file is the one place in the app that
 * turns "attach this canvas for this gameId" into an actually running
 * `GameLoop`; the shell never sees any of it (Art. 3.7), and the core never
 * knows a game exists until this file hands it one (Art. 3.8).
 */
import { WebAudioPlayer } from '@arcade/core';
import type { CoreHandle, DiagnosticsView, RecordsView, SessionView } from '@arcade/shell';
import { findCatalogEntry } from '@arcade/catalog';
import { GameSession } from './game-session.js';

const IDLE_SESSION_VIEW: SessionView = { score: 0, status: 'countdown', countdown: null, gameStatus: 'playing' };
const IDLE_RECORDS_VIEW: RecordsView = { top10: [] };

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

  let session: GameSession | null = null;
  const sessionListeners = new Set<(view: SessionView) => void>();

  function publishSession(): void {
    const view = session?.view() ?? IDLE_SESSION_VIEW;
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
      /**
       * PUNTO DE CONEXIÓN PARA RÉCORDS — `@arcade/core` todavía no expone un
       * cliente de récords (docs/specs/core.md §8, en construcción en
       * paralelo por otro agente; ver docs/handoff/1.11-cableado.md). Cuando
       * exista, este método debe delegar en él (encolar en IndexedDB,
       * reintentar en segundo plano, releer el top 10 del servidor) en vez de
       * no hacer nada. Deliberadamente NO se inventa aquí un cliente de
       * récords propio — la tarea lo prohíbe explícitamente.
       */
      void gameId;
      void name;
    },

    subscribeRecords(_gameId, listener) {
      // Mismo punto de conexión que submitScore: hasta que el núcleo tenga
      // récords, la tabla se muestra siempre vacía, nunca rota.
      listener(IDLE_RECORDS_VIEW);
      return () => {};
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
          recordsQueueSize: 0, // SUPUESTO — sin cola de récords todavía; ver submitScore.
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
