import * as PIXI from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { logger } from '../../utils/logger.js'
import { getPixiColorFromToken } from './utils.js'

export class EffectManager {
  static MAX_POOL_SIZE = 50
  static MAX_ACTIVE_EFFECTS = 50

  /**
   * @param {PIXI.Application} app
   * @param {PIXI.Container} parentContainer
   */
  constructor(app, parentContainer) {
    this.app = app
    this.parentContainer = parentContainer
    this.container = null
    this.activeEffects = []

    // Separate pools for Sprites and Graphics
    this.spritePool = []
    this.graphicsPool = []

    this.textures = { blood: null, toxic: null }
  }

  init() {
    this.container = new PIXI.Container()
    this.parentContainer.addChild(this.container)
  }

  async loadAssets() {
    try {
      const results = await Promise.allSettled([
        PIXI.Assets.load(getGenImageUrl(IMG_PROMPTS.HIT_BLOOD)),
        PIXI.Assets.load(getGenImageUrl(IMG_PROMPTS.HIT_TOXIC))
      ])

      if (results[0].status === 'fulfilled')
        this.textures.blood = results[0].value
      if (results[1].status === 'fulfilled')
        this.textures.toxic = results[1].value
    } catch (error) {
      logger.warn('EffectManager', 'Effect textures failed to load', error)
    }
  }

  spawnHitEffect(x, y, color) {
    if (!this.container) return

    // Cap active effects using MAX_ACTIVE_EFFECTS
    while (this.activeEffects.length >= EffectManager.MAX_ACTIVE_EFFECTS) {
      const oldest = this.activeEffects.shift()
      this.releaseEffectToPool(oldest)
    }

    // Determine texture based on color (Red component dominance)
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff

    let texture = null
    if (r > g && r > b && this.textures.blood) {
      texture = this.textures.blood
    } else if (this.textures.toxic) {
      texture = this.textures.toxic
    }

    let effect
    if (texture) {
      // Try sprite pool
      if (this.spritePool.length > 0) {
        effect = this.spritePool.pop()
      } else {
        effect = new PIXI.Sprite(texture)
        effect.anchor.set(0.5)
      }

      // Ensure texture is correct
      if (effect.texture !== texture) {
        effect.texture = texture
      }
      effect.tint = color
    } else {
      // Try graphics pool
      if (this.graphicsPool.length > 0) {
        effect = this.graphicsPool.pop()
      } else {
        effect = new PIXI.Graphics()
      }

      const whiteColor = getPixiColorFromToken('--star-white')
      effect.clear()
      effect.circle(0, 0, 40)
      effect.fill({ color: whiteColor, alpha: 0.8 })
      effect.stroke({ width: 4, color: color })
    }

    effect.x = x
    effect.y = y
    effect.alpha = 1
    effect.scale.set(0.5)
    effect.visible = true

    // Store animation state
    effect.life = 1.0 // 1.0 to 0.0

    this.container.addChild(effect)
    this.activeEffects.push(effect)
  }

  update(deltaMS) {
    const deltaSec = deltaMS / 1000
    // Iterate backwards to allow removal
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]
      effect.life -= deltaSec * 3 // Fade out speed

      if (effect.life <= 0) {
        this.activeEffects.splice(i, 1)
        this.releaseEffectToPool(effect)
      } else {
        effect.alpha = effect.life
        effect.scale.set(0.5 + (1.0 - effect.life) * 1.5) // Expand from 0.5 to 2.0
      }
    }
  }

  releaseEffectToPool(effect) {
    if (!effect) return

    if (this.container) {
      this.container.removeChild(effect)
    }

    effect.visible = false

    if (effect instanceof PIXI.Sprite) {
      if (this.spritePool.length < EffectManager.MAX_POOL_SIZE) {
        this.spritePool.push(effect)
      } else {
        effect.destroy()
      }
    } else {
      if (this.graphicsPool.length < EffectManager.MAX_POOL_SIZE) {
        this.graphicsPool.push(effect)
      } else {
        effect.destroy()
      }
    }
  }

  dispose() {
    this.activeEffects = []

    // Destroy pools
    for (const sprite of this.spritePool) {
      sprite.destroy()
    }
    this.spritePool = []

    for (const graphics of this.graphicsPool) {
      graphics.destroy()
    }
    this.graphicsPool = []

    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
