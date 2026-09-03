/**
 * Tick-based timers.
 *
 * Constitution Art. 3.3: game logic may not use `setTimeout`, `setInterval`,
 * `Date.now()` or `performance.now()`. Everything that happens "later" is
 * scheduled here, in ticks, and the whole schedule lives INSIDE the game state.
 *
 * That is what makes the pause requirement work: freezing the state freezes
 * every pending timer with it — the ghosts' frightened timer, the UFO cadence,
 * a piece's lock delay — and restoring the state restores them exactly.
 *
 * The rule exists to be cheap: expressing "in 90 frames, X happens" must cost
 * no more than a `setTimeout` would. If it ever costs more, this primitive is
 * wrong, not the rule.
 */
export interface Timer {
  /** Caller-defined name. Scheduling an existing tag replaces it. */
  readonly tag: string;
  /** Ticks left before it fires. Always >= 1 while pending. */
  readonly remaining: number;
}

export interface Timers {
  readonly pending: readonly Timer[];
}

export interface TimersAdvance {
  readonly timers: Timers;
  /** Tags that reached zero on this tick, in scheduling order. */
  readonly fired: readonly string[];
}

export function createTimers(): Timers {
  return { pending: [] };
}

/**
 * Schedule `tag` to fire after `ticks` ticks. Re-scheduling an existing tag
 * replaces its remaining time, which is what "restart the timer" means.
 */
export function schedule(timers: Timers, tag: string, ticks: number): Timers {
  if (!Number.isInteger(ticks) || ticks < 1) {
    throw new Error(`schedule("${tag}") needs a whole number of ticks >= 1, got ${ticks}`);
  }
  const others = timers.pending.filter((timer) => timer.tag !== tag);
  return { pending: [...others, { tag, remaining: ticks }] };
}

export function cancel(timers: Timers, tag: string): Timers {
  return { pending: timers.pending.filter((timer) => timer.tag !== tag) };
}

/** Ticks left for `tag`, or null when it is not pending. */
export function remaining(timers: Timers, tag: string): number | null {
  return timers.pending.find((timer) => timer.tag === tag)?.remaining ?? null;
}

export function isPending(timers: Timers, tag: string): boolean {
  return remaining(timers, tag) !== null;
}

/** Advance every timer by exactly one tick. Called once per tick by the game. */
export function advanceTimers(timers: Timers): TimersAdvance {
  const pending: Timer[] = [];
  const fired: string[] = [];
  for (const timer of timers.pending) {
    const left = timer.remaining - 1;
    if (left <= 0) fired.push(timer.tag);
    else pending.push({ tag: timer.tag, remaining: left });
  }
  return { timers: { pending }, fired };
}
