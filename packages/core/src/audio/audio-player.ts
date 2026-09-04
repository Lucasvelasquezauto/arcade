/**
 * The real Web Audio adapter (spec §6). Thin and untested here on purpose —
 * same split as `GameLoop`/`advanceAccumulator`: everything decidable without
 * a browser (which operations a tick's `SoundEvent[]` implies) lives in
 * `reconcile.ts` and is unit-tested; this class only turns that plan into
 * actual Web Audio calls.
 *
 * SUPUESTO — sin manifiesto de audio: `@arcade/contracts` no declara todavía
 * ningún tipo para decir qué archivo de sonido corresponde a un `SoundId`
 * (mismo hueco que `drawSprite`, ver `renderer/sprite-atlas.ts`). Hasta que
 * exista ese contrato, cada `SoundId` se sintetiza como un tono corto y
 * determinista — mismo id, mismo tono, siempre — de modo que la cadena
 * completa (reproducir, loop con `rate` sin reiniciar, detener, silenciar,
 * desbloquear con gesto, cortar en pausa) es real y verificable de punta a
 * punta sin depender de una muestra de audio real. El día que exista un
 * manifiesto, solo `bufferFor`/`renderSineBuffer` cambian — `reconcileSounds`
 * y la interfaz pública `AudioPlayer` no se tocan.
 */
import type { SoundEvent, SoundId } from '@arcade/contracts';
import type { AudioBufferLike, AudioBufferSourceNodeLike, AudioContextLike, GainNodeLike } from '../env.js';
import { realAudioContextFactory, realLocalStorage, type StorageLike } from '../env.js';
import { reconcileSounds, type LoopState } from './reconcile.js';
import { MuteStore } from './mute-store.js';

const ONE_SHOT_DURATION_S = 0.12;
const LOOP_BUFFER_DURATION_S = 0.25;
const SAMPLE_RATE = 44_100;
/** Deterministic tone range so different ids are audibly distinguishable; arbitrary (SUPUESTO). */
const TONE_MIN_HZ = 220;
const TONE_SPAN_HZ = 660;

export interface AudioPlayer {
  /** Call on the first player gesture (spec §6.2) — resumes a context browsers start suspended. */
  unlock(): void;
  /** Plays exactly what this tick's `step()` returned, nothing more (spec §6.3). */
  play(sounds: readonly SoundEvent[]): void;
  isMuted(): boolean;
  /** Toggleable mid-game without pausing, and from the selection screen (spec §6.5). */
  setMuted(muted: boolean): void;
  toggleMuted(): boolean;
  /** All audio, including loops, stops — the pause rule (spec §3 rule 3, §6.6). */
  stopAll(): void;
}

interface ActiveLoop {
  readonly source: AudioBufferSourceNodeLike;
  readonly gainNode: GainNodeLike;
  readonly rate: number;
  readonly gain: number;
}

function toneHz(id: SoundId): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return TONE_MIN_HZ + (Math.abs(hash) % TONE_SPAN_HZ);
}

/** A short sine tone with a linear decay envelope, so a one-shot never clicks at its end. */
function renderToneBuffer(ctx: AudioContextLike, hz: number, durationS: number): AudioBufferLike {
  const length = Math.round(SAMPLE_RATE * durationS);
  const buffer = ctx.createBuffer(1, length, SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = 1 - i / length;
    data[i] = Math.sin(2 * Math.PI * hz * t) * envelope;
  }
  return buffer;
}

export class WebAudioPlayer implements AudioPlayer {
  private readonly ctx: AudioContextLike;
  private readonly masterGain: GainNodeLike;
  private readonly muteStore: MuteStore;
  private readonly loopBufferCache = new Map<SoundId, AudioBufferLike>();
  private readonly activeLoops = new Map<SoundId, ActiveLoop>();

  constructor(
    ctxFactory: () => AudioContextLike = realAudioContextFactory,
    storage: StorageLike | null = realLocalStorage(),
  ) {
    this.ctx = ctxFactory();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.muteStore = new MuteStore(storage);
    this.applyMute();
  }

  unlock(): void {
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  isMuted(): boolean {
    return this.muteStore.isMuted();
  }

  setMuted(muted: boolean): void {
    this.muteStore.setMuted(muted);
    this.applyMute();
  }

  toggleMuted(): boolean {
    const muted = this.muteStore.toggle();
    this.applyMute();
    return muted;
  }

  private applyMute(): void {
    this.masterGain.gain.value = this.muteStore.isMuted() ? 0 : 1;
  }

  play(sounds: readonly SoundEvent[]): void {
    if (sounds.length === 0) return;
    const activeLoopStates = new Map<SoundId, LoopState>();
    for (const [id, loop] of this.activeLoops) activeLoopStates.set(id, { rate: loop.rate, gain: loop.gain });
    const plan = reconcileSounds(activeLoopStates, sounds);

    for (const p of plan.toPlay) this.playOnce(p.id, p.gain);
    for (const s of plan.toStartLoop) this.startLoop(s.id, s.rate, s.gain);
    for (const u of plan.toUpdateLoop) this.updateLoop(u.id, u.rate, u.gain);
    for (const id of plan.toStopLoop) this.stopLoop(id);
  }

  stopAll(): void {
    for (const id of [...this.activeLoops.keys()]) this.stopLoop(id);
  }

  private loopBufferFor(id: SoundId): AudioBufferLike {
    let buffer = this.loopBufferCache.get(id);
    if (buffer === undefined) {
      buffer = renderToneBuffer(this.ctx, toneHz(id), LOOP_BUFFER_DURATION_S);
      this.loopBufferCache.set(id, buffer);
    }
    return buffer;
  }

  private playOnce(id: SoundId, gain: number): void {
    const source = this.ctx.createBufferSource();
    source.buffer = renderToneBuffer(this.ctx, toneHz(id), ONE_SHOT_DURATION_S);
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start();
  }

  private startLoop(id: SoundId, rate: number, gain: number): void {
    const source = this.ctx.createBufferSource();
    source.buffer = this.loopBufferFor(id);
    source.loop = true;
    source.playbackRate.value = rate;
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start();
    this.activeLoops.set(id, { source, gainNode, rate, gain });
  }

  /** Changes speed and/or gain of a loop already playing, WITHOUT restarting it (spec §6.4). */
  private updateLoop(id: SoundId, rate: number, gain: number): void {
    const active = this.activeLoops.get(id);
    if (active === undefined) return;
    active.source.playbackRate.value = rate;
    active.gainNode.gain.value = gain;
    this.activeLoops.set(id, { ...active, rate, gain });
  }

  private stopLoop(id: SoundId): void {
    const active = this.activeLoops.get(id);
    if (active === undefined) return;
    active.source.stop();
    this.activeLoops.delete(id);
  }
}
