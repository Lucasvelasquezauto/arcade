/**
 * `DrawSurface` over Canvas 2D (spec §5). The real adapter: it touches a
 * canvas element and a 2D context, so — like `GameLoop.start()` and
 * `attachBrowserLifecycle()` — it has no unit tests of its own. What IS
 * unit-tested is `computeCanvasLayout` (`layout.ts`), the pure geometry this
 * class applies.
 *
 * `CanvasLike`/`Context2DLike` are narrow structural interfaces, not the real
 * DOM types: this package's shared `tsconfig` has no DOM lib (see `env.ts`),
 * and unlike `env.ts` this file never touches `globalThis` — the canvas and
 * its context are handed in by the caller (the shell, which owns the
 * cabinet's screen element), so no cast is needed at all. Any real
 * `HTMLCanvasElement`/`CanvasRenderingContext2D` satisfies these structurally.
 */
import type { DrawSurface, Resolution, SpriteId, SpriteOptions, TextOptions } from '@arcade/contracts';
import { computeCanvasLayout, type CanvasLayout } from './layout.js';
import type { CanvasImageSourceLike, SpriteAtlas } from './sprite-atlas.js';

export interface Context2DLike {
  imageSmoothingEnabled: boolean;
  fillStyle: string;
  font: string;
  textAlign: string;
  textBaseline: string;
  globalCompositeOperation: string;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  translate(x: number, y: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  drawImage(
    image: CanvasImageSourceLike,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void;
}

export interface CanvasLike {
  width: number;
  height: number;
  readonly style: { width: string; height: string };
  getContext(contextId: '2d'): Context2DLike | null;
}

/**
 * SUPUESTO — sin fuente bitmap: igual que `SpriteAtlas`, no hay manifiesto de
 * assets que declare una fuente bitmap por juego (render.ts dice "dibuja con
 * la fuente bitmap propia del juego, declarada en su manifiesto de assets",
 * pero ese manifiesto no existe). `drawText` usa una fuente monoespaciada del
 * sistema a un tamaño fijo en píxeles lógicos en su lugar. Es una desviación
 * visible: no tendrá el borde duro de una fuente de píxeles real, y el
 * antialiasing de texto de Canvas 2D no lo apaga `imageSmoothingEnabled`
 * (esa bandera solo afecta a `drawImage`). Reemplazar esto por una fuente
 * bitmap real, una vez exista el manifiesto, es un cambio local a este
 * archivo.
 */
const FALLBACK_FONT_PX = 8;
const FALLBACK_FONT_FAMILY = 'monospace';

export class CanvasDrawSurface implements DrawSurface {
  readonly width: number;
  readonly height: number;
  private readonly canvas: CanvasLike;
  private readonly ctx: Context2DLike;
  private readonly spriteAtlas: SpriteAtlas | undefined;

  constructor(canvas: CanvasLike, logical: Resolution, spriteAtlas?: SpriteAtlas) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('CanvasDrawSurface: canvas 2D context unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = logical.width;
    this.height = logical.height;
    this.spriteAtlas = spriteAtlas;
  }

  /**
   * Applies integer-scale letterboxing for the CSS pixels currently
   * available (spec §5.1–§5.4). Call once at startup and again whenever the
   * available area changes (resize, orientation change). Setting
   * `canvas.width`/`height` resets ALL context state per the Canvas spec —
   * `imageSmoothingEnabled` included — so both are reapplied here every time,
   * and the transform is reset explicitly first rather than relying on that
   * behaviour, in case a browser skips the reset when the size is unchanged.
   */
  resize(availableCssPx: Resolution, devicePixelRatio: number): CanvasLayout {
    const layout = computeCanvasLayout({ width: this.width, height: this.height }, availableCssPx, devicePixelRatio);
    this.canvas.width = layout.canvasWidthPx;
    this.canvas.height = layout.canvasHeightPx;
    this.canvas.style.width = `${layout.cssWidthPx}px`;
    this.canvas.style.height = `${layout.cssHeightPx}px`;
    this.ctx.imageSmoothingEnabled = false; // spec §5.2, never deform/blur pixel art
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(layout.scale, layout.scale); // spec §5.1 — the game draws in its own logical pixels from here on
    return layout;
  }

  clear(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  fillRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawSprite(id: SpriteId, x: number, y: number, options?: SpriteOptions): void {
    const frame = this.spriteAtlas?.getFrame(id);
    if (frame === undefined) {
      throw new Error(
        `CanvasDrawSurface.drawSprite: no hay sprite registrado para "${id}" ` +
          '(SUPUESTO: no existe todavía un manifiesto de assets, ver renderer/sprite-atlas.ts)',
      );
    }
    const flipX = options?.flipX ?? false;
    this.ctx.save();
    this.ctx.translate(x, y);
    if (flipX) {
      this.ctx.scale(-1, 1);
      this.ctx.translate(-frame.sw, 0);
    }
    this.ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
    if (options?.tint !== undefined) {
      // Standard Canvas 2D tint recipe for monochrome art: paint the tint colour
      // only where the sprite already drew something.
      this.ctx.globalCompositeOperation = 'source-atop';
      this.ctx.fillStyle = options.tint;
      this.ctx.fillRect(0, 0, frame.sw, frame.sh);
      this.ctx.globalCompositeOperation = 'source-over';
    }
    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, options: TextOptions): void {
    this.ctx.font = `${FALLBACK_FONT_PX}px ${FALLBACK_FONT_FAMILY}`;
    this.ctx.textAlign = options.align ?? 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = options.color;
    this.ctx.fillText(text, x, y);
  }
}
