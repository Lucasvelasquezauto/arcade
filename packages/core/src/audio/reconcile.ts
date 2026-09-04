/**
 * Pure reconciliation of `SoundEvent[]` against currently-playing loops
 * (spec §6.3–§6.4). This is the part of "audio is data, not action" that can
 * be tested without a browser: given what is already playing and what this
 * tick's events ask for, decide exactly which Web Audio operations the real
 * player must perform. The player (audio-player.ts) is a thin, untested
 * adapter around this — same split as `advanceAccumulator`/`GameLoop`.
 *
 * The one rule this exists to get right: re-emitting `loop` with a different
 * `rate` for an id that is ALREADY playing must produce an update, never a
 * stop+start — restarting would reset playback position and click. That is
 * what lets the Space Invaders march accelerate continuously (§6.4).
 */
import type { SoundEvent, SoundId } from '@arcade/contracts';

export interface LoopState {
  readonly rate: number;
  readonly gain: number;
}

export interface PlayOnce {
  readonly id: SoundId;
  readonly gain: number;
}

export interface StartLoop {
  readonly id: SoundId;
  readonly rate: number;
  readonly gain: number;
}

export interface UpdateLoop {
  readonly id: SoundId;
  readonly rate: number;
  readonly gain: number;
}

export interface AudioReconciliation {
  readonly toPlay: readonly PlayOnce[];
  readonly toStartLoop: readonly StartLoop[];
  readonly toUpdateLoop: readonly UpdateLoop[];
  readonly toStopLoop: readonly SoundId[];
}

const DEFAULT_GAIN = 1;

/**
 * `activeLoops` is the caller's current view of which loop ids are playing
 * (and at what rate/gain) BEFORE this tick's events are applied. The result
 * tells the caller exactly what changed; it does not compute the next
 * `activeLoops` map — the caller derives that from which operations it
 * actually performed, since only it knows whether a Web Audio node exists.
 */
export function reconcileSounds(
  activeLoops: ReadonlyMap<SoundId, LoopState>,
  events: readonly SoundEvent[],
): AudioReconciliation {
  const toPlay: PlayOnce[] = [];
  const toStartLoop: StartLoop[] = [];
  const toUpdateLoop: UpdateLoop[] = [];
  const toStopLoop: SoundId[] = [];

  for (const event of events) {
    if (event.kind === 'play') {
      toPlay.push({ id: event.id, gain: event.gain ?? DEFAULT_GAIN });
      continue;
    }
    if (event.kind === 'stop') {
      if (activeLoops.has(event.id)) toStopLoop.push(event.id);
      continue;
    }
    // event.kind === 'loop'
    const rate = event.rate ?? 1;
    const gain = event.gain ?? DEFAULT_GAIN;
    const current = activeLoops.get(event.id);
    if (current === undefined) {
      toStartLoop.push({ id: event.id, rate, gain });
    } else if (current.rate !== rate || current.gain !== gain) {
      toUpdateLoop.push({ id: event.id, rate, gain });
    }
    // Same id, same rate and gain, already looping: no-op, on purpose — the
    // game re-emits `loop` every tick it wants the sound to keep going
    // (§6.6), so the common case must not touch the node at all.
  }

  return { toPlay, toStartLoop, toUpdateLoop, toStopLoop };
}
