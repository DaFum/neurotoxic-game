import * as PIXI from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { logger } from '../../utils/logger.js'
import { loadTexture, getPixiColorFromToken } from './utils.js'

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

    // Pool for Sprites (no longer need separate graphics pool)
    this.spritePool = []

    this.textures = { blood: null, toxic: null }
    this.genericHitTexture = null
  }

  init() {
    this.container = new PIXI.Container()
    this.parentContainer.addChild(this.container)
  }

  async loadAssets() {
    try {
      const results = await Promise.allSettled([
        loadTexture(getGenImageUrl(IMG_PROMPTS.HIT_BLOOD)),
        loadTexture(getGenImageUrl(IMG_PROMPTS.HIT_TOXIC))
      ])

      if (results[0].status === 'fulfilled')
        this.textures.blood = results[0].value
      if (results[1].status === 'fulfilled')
        this.textures.toxic = results[1].value
    } catch (error) {
      logger.warn('EffectManager', 'Effect textures failed to load', error)
    }
  }

  createGenericHitTexture() {
    if (this.genericHitTexture) return

    const graphics = new PIXI.Graphics()
    const whiteColor = getPixiColorFromToken('--star-white')

    // Draw a white circle with white stroke to create a base texture
    // that can be tinted to any color while preserving opacity variation.
    // Fill alpha is 0.8, stroke alpha is 1.0.
    graphics.circle(0, 0, 40)
    graphics.fill({ color: whiteColor, alpha: 0.8 })
    graphics.stroke({ width: 4, color: whiteColor, alpha: 1.0 })

    try {
      // Handle PixiJS v8 API changes for texture generation
      if (this.app?.renderer?.textureGenerator) {
        this.genericHitTexture = this.app.renderer.textureGenerator.generateTexture({
          target: graphics,
          resolution: 1,
          antialias: true
        })
      } else if (this.app?.renderer?.generateTexture) {
        this.genericHitTexture = this.app.renderer.generateTexture(graphics)
      } else {
        logger.warn('EffectManager', 'Renderer not available for texture generation')
      }
    } catch (error) {
      logger.warn('EffectManager', 'Failed to generate generic hit texture', error)
    } finally {
      graphics.destroy()
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

    let texture
    if (r > g && r > b && this.textures.blood) {
      texture = this.textures.blood
    } else if (this.textures.toxic) {
      texture = this.textures.toxic
    } else {
      // Use generic texture for fallback
      if (!this.genericHitTexture) {
        this.createGenericHitTexture()
      }
      texture = this.genericHitTexture
    }

    let effect
    if (this.spritePool.length > 0) {
      effect = this.spritePool.pop()
    } else {
      // Create sprite, using generic texture if specific one is missing/not loaded
      // If texture is still null (generation failed), use Texture.WHITE as absolute fallback
      effect = new PIXI.Sprite(texture || PIXI.Texture.WHITE)
      effect.anchor.set(0.5)
    }

    // Ensure texture is correct
    if (effect.texture !== texture && texture) {
      effect.texture = texture
    }

    effect.tint = color
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

    // Only pool Sprites (legacy graphics would be destroyed if they existed)
    if (effect instanceof PIXI.Sprite) {
      if (this.spritePool.length < EffectManager.MAX_POOL_SIZE) {
        this.spritePool.push(effect)
      } else {
        effect.destroy()
      }
    } else {
      effect.destroy()
    }
  }

  dispose() {
    this.activeEffects = []

    // Destroy pool
    for (const sprite of this.spritePool) {
      sprite.destroy()
    }
    this.spritePool = []

    if (this.genericHitTexture) {
      this.genericHitTexture.destroy(true)
      this.genericHitTexture = null
    }

    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
