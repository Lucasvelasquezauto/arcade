/**
 * The exact boundary between shell and core (spec §2): everything the shell
 * is allowed to know about a running game, and nothing else. No field here
 * may hold game state — only read-only summaries the core publishes and thin
 * commands the shell sends back. This file is the props interface referenced
 * in `docs/handoff/1.7-shell.md`; keep it in sync with that document.
 */
import type { AnyGameModule, Axis, ControlPanel, Resolution } from '@arcade/contracts';

/** Metadata the selection screen and the cabinet accent need — nothing the
 *  game's own logic, render or audio require. Deliberately a subset of
 *  `AnyGameModule` so the catalog can hand the shell exactly this without
 *  the shell ever touching `createState`/`step`/`draw`. */
export type GameCatalogEntry = Pick<
  AnyGameModule,
  'id' | 'title' | 'accentColor' | 'resolution' | 'panel'
>;

/** Presentation status of the running session. Distinct from
 *  `GameModule.GameStatus` ('playing' | 'over'): this one also names the two
 *  states that only exist between the shell and the core — counting down
 *  and manually/automatically paused — per spec §6. */
export type SessionStatus = 'countdown' | 'running' | 'paused';

export interface SessionView {
  readonly score: number;
  readonly status: SessionStatus;
  /** Seconds left in the countdown (3, 2, 1), or null outside a countdown. */
  readonly countdown: number | null;
  /** Mirrors `GameModule.readStatus`; 'over' is what sends the shell to game-over. */
  readonly gameStatus: 'playing' | 'over';
}

export interface RecordEntry {
  readonly name: string;
  readonly score: number;
  /** ISO 8601. Server time once confirmed (walking-skeleton.md §5: `created_at`). */
  readonly achievedAt: string;
  /** product-spec.md §8 — pending local writes show marked as unconfirmed. */
  readonly confirmed: boolean;
}

export interface RecordsView {
  readonly top10: readonly RecordEntry[];
}

export interface DiagnosticsView {
  readonly fps: number;
  readonly ticksPerSecond: number;
  readonly droppedTicks: number;
  readonly recordsQueueSize: number;
  readonly online: boolean;
  readonly pauseLog: readonly { readonly startedAt: string; readonly durationMs: number }[];
}

/**
 * Everything the shell needs FROM the core, and the only thing it is allowed
 * to read or command (spec §2). The shell never imports game logic, never
 * reads `AnyGameModule.step`/`draw` itself, and never keeps a copy of this
 * data inside a Preact signal that anything but the current screen's paint
 * depends on.
 *
 * SUPUESTO — the core package does not exist yet (M1.4/M1.5, per
 * docs/execution-plan.md); this interface is the shell's request for what it
 * needs, built entirely against `@arcade/contracts` and the approved specs.
 * It is fed by `fixtures/fakeCore.ts` inside this package until then.
 */
export interface CoreHandle {
  /**
   * Mounts the game's canvas exactly once for this session. The returned
   * element becomes core's from that point on — the core's fixed-step loop
   * paints it directly at 60 Hz, entirely outside Preact's render tree.
   * `GameScreen` calls this exactly once per session and never re-renders
   * the canvas node afterwards (spec §1, §2).
   *
   * Takes `gameId`, not an `AnyGameModule` — the shell only ever knows a
   * game as a `GameCatalogEntry` (Art. 3.8). Resolving the id to its full
   * module is the core's job, alongside whoever assembles `@arcade/catalog`.
   */
  attachCanvas(canvas: HTMLCanvasElement, gameId: string): void;
  /** Ends the session and stops driving the canvas. Idempotent. */
  detachCanvas(): void;

  /** Presentation snapshot. Called at most once per animation frame. */
  subscribeSession(listener: (view: SessionView) => void): () => void;

  /**
   * Digital stick input, already resolved to -1/0/1 by the shell's touch
   * handling (see `controls/touch.ts`) — SUPUESTO: the shell owns the
   * continuous-drag-to-digital-axis math (including the dead zone) because
   * it alone knows the drawn geometry of the control it renders; the core
   * only samples this value once per tick and resolves button edges
   * (`InputState.pressed`), per core.md §4. Rejected alternative: shipping
   * raw pixel deltas to the core, which would leak shell layout into a
   * package that must stay ignorant of it (Art. 3.7).
   */
  setStick(x: Axis, y: Axis): void;
  setButton(id: string, down: boolean): void;

  /** Manual pause from the cabinet (spec §6, product-spec.md §9). */
  pauseManually(): void;
  resumeManually(): void;

  /** Submits a top-10 name (product-spec.md §8). `name` is 1–5 chars, already validated by NameEntryScreen. */
  submitScore(gameId: string, name: string): void;
  subscribeRecords(gameId: string, listener: (view: RecordsView) => void): () => void;

  /**
   * One-way command. The shell is the sole owner of the persisted
   * preference (`mute.ts`) and pushes it to the core; the core has no
   * independent reason to mute itself, so there is no read-back here.
   */
  setMuted(muted: boolean): void;

  /** Long-press-on-marquee diagnostics (spec §8, core.md §9). */
  subscribeDiagnostics(listener: (view: DiagnosticsView) => void): () => void;
}

/** Root props for the shell's `App`. `apps/arcade` assembles this from
 *  `@arcade/catalog` and a real `CoreHandle`; today only fixtures provide it. */
export interface AppProps {
  readonly catalog: readonly GameCatalogEntry[];
  readonly core: CoreHandle;
}

export type { Axis, ControlPanel, Resolution };
