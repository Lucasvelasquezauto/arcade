/**
 * A `CoreHandle` with no real core behind it, used only to exercise this
 * package end to end before `@arcade/core` exists. Nothing here is
 * fidelity-relevant — it just has to behave plausibly enough to drive the
 * screens: a score that ticks, a countdown, a records table with a
 * "pending" entry that confirms after a delay.
 */
import type { CoreHandle, DiagnosticsView, RecordEntry, RecordsView, SessionStatus, SessionView } from '../types.js';

type Listener<T> = (value: T) => void;

/** SUPUESTO — umbral de fin de partida y cadencia de puntaje, sin research previa; solo para ejercitar la UI. */
const FIXTURE_GAME_OVER_SCORE = 500;
const FIXTURE_SCORE_STEP = 10;
const FIXTURE_SCORE_INTERVAL_MS = 500;
const FIXTURE_COUNTDOWN_STEP_MS = 700;
const FIXTURE_CONFIRM_DELAY_MS = 1500;

export function createFixtureCoreHandle(): CoreHandle {
  let score = 0;
  let status: SessionStatus = 'countdown';
  let countdown: number | null = 3;
  let scoreTimer: number | null = null;
  let countdownTimer: number | null = null;
  let paintRaf: number | null = null;

  const sessionListeners = new Set<Listener<SessionView>>();
  const recordsByGame = new Map<string, RecordEntry[]>();
  const recordsListeners = new Map<string, Set<Listener<RecordsView>>>();

  function currentSessionView(): SessionView {
    return { score, status, countdown, gameStatus: score >= FIXTURE_GAME_OVER_SCORE ? 'over' : 'playing' };
  }

  function publishSession(): void {
    const view = currentSessionView();
    for (const listener of sessionListeners) listener(view);
  }

  function publishRecords(gameId: string): void {
    const listeners = recordsListeners.get(gameId);
    if (!listeners) return;
    const top10 = (recordsByGame.get(gameId) ?? []).slice(0, 10);
    for (const listener of listeners) listener({ top10 });
  }

  function clearTimers(): void {
    if (scoreTimer !== null) {
      window.clearInterval(scoreTimer);
      scoreTimer = null;
    }
    if (countdownTimer !== null) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown(): void {
    status = 'countdown';
    countdown = 3;
    publishSession();
    countdownTimer = window.setInterval(() => {
      countdown = (countdown ?? 1) - 1;
      if (countdown <= 0) {
        if (countdownTimer !== null) window.clearInterval(countdownTimer);
        countdownTimer = null;
        countdown = null;
        status = 'running';
      }
      publishSession();
    }, FIXTURE_COUNTDOWN_STEP_MS);
  }

  return {
    attachCanvas(canvas) {
      const ctx = canvas.getContext('2d');
      let x = 0;
      function paint(): void {
        const { width, height } = canvas;
        if (ctx && width > 0 && height > 0) {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#0ff';
          x = (x + 2) % width;
          ctx.fillRect(x, height / 2 - 8, 16, 16);
        }
        paintRaf = requestAnimationFrame(paint);
      }
      paintRaf = requestAnimationFrame(paint);
    },
    detachCanvas() {
      if (paintRaf !== null) {
        cancelAnimationFrame(paintRaf);
        paintRaf = null;
      }
    },

    subscribeSession(listener) {
      const isFirst = sessionListeners.size === 0;
      sessionListeners.add(listener);
      if (isFirst) {
        score = 0;
        startCountdown();
        scoreTimer = window.setInterval(() => {
          if (status === 'running') {
            score += FIXTURE_SCORE_STEP;
            publishSession();
          }
        }, FIXTURE_SCORE_INTERVAL_MS);
      } else {
        listener(currentSessionView());
      }
      return () => {
        sessionListeners.delete(listener);
        if (sessionListeners.size === 0) clearTimers();
      };
    },

    setStick() {
      // Fixture: no simulation to steer.
    },
    setButton() {
      // Fixture: no simulation to trigger.
    },

    pauseManually() {
      status = 'paused';
      publishSession();
    },
    resumeManually() {
      startCountdown();
    },

    submitScore(gameId, name) {
      const entry: RecordEntry = { name, score, achievedAt: new Date().toISOString(), confirmed: false };
      const next = [...(recordsByGame.get(gameId) ?? []), entry].sort((a, b) => b.score - a.score);
      recordsByGame.set(gameId, next);
      publishRecords(gameId);
      window.setTimeout(() => {
        const confirmed = (recordsByGame.get(gameId) ?? []).map((r) => (r === entry ? { ...r, confirmed: true } : r));
        recordsByGame.set(gameId, confirmed);
        publishRecords(gameId);
      }, FIXTURE_CONFIRM_DELAY_MS);
    },
    subscribeRecords(gameId, listener) {
      const listeners = recordsListeners.get(gameId) ?? new Set();
      listeners.add(listener);
      recordsListeners.set(gameId, listeners);
      listener({ top10: (recordsByGame.get(gameId) ?? []).slice(0, 10) });
      return () => listeners.delete(listener);
    },

    setMuted() {
      // Fixture: no audio pipeline to mute — the real core owns Web Audio.
    },

    subscribeDiagnostics(listener) {
      const view: DiagnosticsView = {
        fps: 60,
        ticksPerSecond: 60,
        droppedTicks: 0,
        recordsQueueSize: 0,
        online: true,
        pauseLog: [],
      };
      const timer = window.setInterval(() => listener(view), 1000);
      listener(view);
      return () => window.clearInterval(timer);
    },
  };
}
