import { Sprite, Texture } from 'pixi.js'
import { BaseSpritePool } from './pool/BaseSpritePool'

export type EffectSprite = Sprite & {
  isSprite: boolean
  life: number
}

export class EffectSpritePool extends BaseSpritePool<EffectSprite> {
  protected maxPoolSize = 50

  constructor() {
    super()
  }

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

  releaseSprite(effect: EffectSprite | null): void {
    if (!effect) return

    if (this.container) {
      this.container.removeChild(effect)
    }

    if (effect.isSprite) {
      this.releaseSpriteToPool(effect)
    } else {
      effect.destroy()
    }
  }
}
