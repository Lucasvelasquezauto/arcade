/**
 * Rolling 1-second window of loop metrics for the diagnostics screen
 * (core.md §9). apps/arcade owns this — not `@arcade/core` — because it
 * only needs to observe the same `GameLoop` this app already drives, by
 * counting how many times its `sampleInput` runs per animation frame; no
 * new primitive in the core is needed for that.
 *
 * SUPUESTO: "ticks perdidos" is approximated as the count of frames whose
 * tick count hit `MAX_TICKS_PER_FRAME` — the cap the accumulator enforces
 * (docs/specs/core.md §2.1) — rather than the exact number of discarded
 * milliseconds, which `GameLoop` does not expose. A frame that legitimately
 * needed exactly the cap and dropped nothing is indistinguishable from one
 * that dropped time; this over-counts by at most one frame per second and is
 * good enough for the diagnostic's purpose (spot a device that cannot keep up).
 */
export class FrameMetrics {
  private frameCount = 0;
  private tickCount = 0;
  private cappedFrames = 0;
  private windowStartMs: number | null = null;
  private fps = 0;
  private ticksPerSecond = 0;
  private droppedTicks = 0;

  /** Call once per animation frame with how many ticks that frame ran. */
  recordFrame(nowMs: number, ticksThisFrame: number, hitCap: boolean): void {
    if (this.windowStartMs === null) this.windowStartMs = nowMs;
    this.frameCount += 1;
    this.tickCount += ticksThisFrame;
    if (hitCap) this.cappedFrames += 1;

    const elapsedMs = nowMs - this.windowStartMs;
    if (elapsedMs >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsedMs);
      this.ticksPerSecond = Math.round((this.tickCount * 1000) / elapsedMs);
      this.droppedTicks = this.cappedFrames;
      this.frameCount = 0;
      this.tickCount = 0;
      this.cappedFrames = 0;
      this.windowStartMs = nowMs;
    }
  }

  snapshot(): { fps: number; ticksPerSecond: number; droppedTicks: number } {
    return { fps: this.fps, ticksPerSecond: this.ticksPerSecond, droppedTicks: this.droppedTicks };
  }
}
