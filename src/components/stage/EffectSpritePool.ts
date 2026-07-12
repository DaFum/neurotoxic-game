import { Sprite, Texture } from 'pixi.js'
import { BaseSpritePool } from './pool/BaseSpritePool'

/**
 * Represents a specialized sprite used for rendering visual effects.
 *
 * @remarks
 * This type extends the base PixiJS `Sprite` to include lifecycle and pooling metadata,
 * allowing the effect manager to track how long an effect should persist and safely recycle it.
 */
export type EffectSprite = Sprite & {
  isSprite: boolean
  life: number
}

/**
 * Manages a reusable pool of effect sprites to minimize memory allocation overhead.
 *
 * @remarks
 * Reuses `EffectSprite` instances and creates them on demand. By pulling from this pool instead
 * of instantiating new sprites for every visual effect, garbage collection pressure is
 * significantly reduced during high-intensity sequences.
 */
export class EffectSpritePool extends BaseSpritePool<EffectSprite> {
  protected maxPoolSize = 50

  /**
   * Initializes a new effect sprite pool.
   */
  constructor() {
    super()
  }

  /**
   * Retrieves an available effect sprite from the pool or creates a new one if the pool is empty.
   *
   * @remarks
   * Note that pooled lifecycle state (such as `life`) must be reset by callers, as this method
   * only updates the texture and anchor for pooled sprites.
   *
   * @param texture - The texture to apply to the sprite, or null to use a default white texture.
   * @returns An effect sprite from the pool or newly created on demand.
   */
  getSprite(texture: Texture | null): EffectSprite {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop() as EffectSprite
      sprite.texture = texture || Texture.WHITE
      sprite.anchor.set(0.5)
      return sprite
    }

    const effect = new Sprite(texture || Texture.WHITE) as EffectSprite
    effect.isSprite = true
    effect.life = 1
    effect.anchor.set(0.5)
    return effect
  }

  /**
   * Returns a finished effect sprite back to the pool for future reuse.
   *
   * @remarks
   * If the sprite is a standard poolable sprite, it is hidden, removed from its container,
   * and added back to the pool queue. If it is an unmanaged display object, it is destroyed completely.
   *
   * @param effect - The effect sprite to release.
   */
  releaseSprite(effect: EffectSprite | null): void {
    if (!effect) return

    if (this.container) {
      this.container.removeChild(effect)
    }

    effect.visible = false

    if (effect.isSprite) {
      this.releaseSpriteToPool(effect)
    } else {
      effect.destroy()
    }
  }
}
