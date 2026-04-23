import { Container, Sprite, Texture } from 'pixi.js'

export type EffectSprite = Sprite & {
  isSprite: boolean
  life: number
}

export class EffectSpritePool {
  static MAX_POOL_SIZE = 50
  spritePool: EffectSprite[]
  container: Container | null

  constructor() {
    this.spritePool = []
    this.container = null
  }

  setContainer(container: Container): void {
    this.container = container
  }

  getSprite(texture: Texture | null): EffectSprite {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop() as EffectSprite
      sprite.texture = texture || Texture.WHITE
      sprite.anchor.set(0.5)
      return sprite
    }

    // Create sprite, using generic texture if specific one is missing/not loaded
    // If texture is still null (generation failed), use Texture.WHITE as absolute fallback
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

    effect.visible = false

    // Only pool Sprites (legacy graphics would be destroyed if they existed)
    if (effect.isSprite) {
      if (this.spritePool.length < EffectSpritePool.MAX_POOL_SIZE) {
        this.spritePool.push(effect)
      } else {
        effect.destroy()
      }
    } else {
      effect.destroy()
    }
  }

  dispose(): void {
    // Destroy pool
    for (let i = 0; i < this.spritePool.length; i++) {
      this.spritePool[i].destroy()
    }
    this.spritePool = []
    this.container = null
  }
}
