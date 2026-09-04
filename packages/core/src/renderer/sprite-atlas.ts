/**
 * SUPUESTO — sin manifiesto de assets: `@arcade/contracts` documenta que
 * `SpriteId` "se resuelve por el manifiesto de assets del juego" (render.ts),
 * pero no existe todavía ningún tipo de manifiesto ni ningún campo en
 * `GameModule` para declararlo. Sin ese contrato, `GameModule` no tiene forma
 * de decirle al núcleo dónde vive cada sprite.
 *
 * Este archivo define, solo dentro de `core`, la forma mínima que
 * `CanvasDrawSurface.drawSprite` necesita para resolver un id a una región de
 * imagen: un `SpriteAtlas` inyectado por quien construye la superficie. Es
 * deliberadamente provisional — el día que exista un manifiesto real en
 * `contracts`, lo natural es que ese manifiesto describa exactamente esto
 * (id → imagen + rectángulo) y este archivo se vuelva su implementación, no
 * su reemplazo. Ningún juego de este milestone (`test-pattern`) llama a
 * `drawSprite`, así que esto no bloquea nada del alcance actual — queda listo
 * para el primer juego que sí necesite sprites.
 */
import type { SpriteId } from '@arcade/contracts';

/** Opaque handle passed straight through to `drawImage` — an `HTMLImageElement`, `ImageBitmap`, etc. */
export type CanvasImageSourceLike = unknown;

export interface SpriteFrame {
  readonly image: CanvasImageSourceLike;
  readonly sx: number;
  readonly sy: number;
  readonly sw: number;
  readonly sh: number;
}

export interface SpriteAtlas {
  getFrame(id: SpriteId): SpriteFrame | undefined;
}

/** Trivial in-memory atlas: register frames one at a time, keyed by id. */
export class MapSpriteAtlas implements SpriteAtlas {
  private readonly frames = new Map<SpriteId, SpriteFrame>();

  register(id: SpriteId, frame: SpriteFrame): void {
    this.frames.set(id, frame);
  }

  getFrame(id: SpriteId): SpriteFrame | undefined {
    return this.frames.get(id);
  }
}
