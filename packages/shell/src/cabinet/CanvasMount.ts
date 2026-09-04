/**
 * THE risk this package exists to manage (spec §2): the game's `<canvas>` is
 * created exactly once and handed to the core, which paints it directly at
 * 60 Hz outside Preact's render tree. Nothing about this component's own
 * re-renders may ever recreate or repaint that element — the effect below
 * only re-runs if `core` or `gameId` change identity, which happens once per
 * session, not on every score tick.
 */
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { CoreHandle } from '../types.js';
import { BEZEL_BG } from '../theme/tokens.js';

export interface CanvasMountProps {
  readonly core: CoreHandle;
  readonly gameId: string;
}

export function CanvasMount({ core, gameId }: CanvasMountProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    core.attachCanvas(canvas, gameId);
    return () => core.detachCanvas();
  }, [core, gameId]);

  return h('canvas', {
    ref: canvasRef,
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      background: BEZEL_BG,
    },
  });
}
