/**
 * The drawing surface a game receives.
 *
 * Coordinates are the game's own logical pixels — the resolution of its
 * reference version, not the phone's. The core owns the mapping to real pixels,
 * including integer scaling and letterboxing (product-spec §5), so a game never
 * knows how big the screen is.
 *
 * This is an interface, not an implementation: `contracts` never touches a
 * canvas. The Canvas 2D implementation lives in the core, behind this contract,
 * so it can be replaced without touching a single game.
 */
export interface Resolution {
  readonly width: number;
  readonly height: number;
}

/** Sprite identifier, resolved by the core from the game's asset manifest. */
export type SpriteId = string;

export interface SpriteOptions {
  /** Mirror horizontally. Cheaper than shipping a mirrored sprite. */
  readonly flipX?: boolean;
  /** Tint applied to a monochrome sprite, as a CSS colour string. */
  readonly tint?: string;
}

export interface TextOptions {
  readonly color: string;
  readonly align?: 'left' | 'center' | 'right';
}

export interface DrawSurface {
  readonly width: number;
  readonly height: number;
  clear(color: string): void;
  fillRect(x: number, y: number, width: number, height: number, color: string): void;
  drawSprite(id: SpriteId, x: number, y: number, options?: SpriteOptions): void;
  /** Draws with the game's own bitmap font, declared in its asset manifest. */
  drawText(text: string, x: number, y: number, options: TextOptions): void;
}
