import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { logger } from '../../utils/logger.js'
import { loadTexture, getPixiColorFromToken } from './utils.js'

export class EffectManager {
  static MAX_POOL_SIZE = 50
  static MAX_ACTIVE_EFFECTS = 50

  /**
   * @param {Application} app
   * @param {Container} parentContainer
   */
  constructor(app, parentContainer) {
    this.app = app
    this.parentContainer = parentContainer
    this.container = null

    // Use an array with index tracking to implement a fast Circular Buffer
    // This allows O(1) removals of the oldest effect without shifting.
    this.activeEffects = new Array(EffectManager.MAX_ACTIVE_EFFECTS)
    this.effectCount = 0
    this.headIndex = 0
    this.tailIndex = 0

    // Pool for Sprites (no longer need separate graphics pool)
    this.spritePool = []

    this.textures = { blood: null, toxic: null }
    this.genericHitTexture = null
  }

  init() {
    this.container = new Container()
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

    const graphics = new Graphics()
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
        this.genericHitTexture =
          this.app.renderer.textureGenerator.generateTexture({
            target: graphics,
            resolution: 1,
            antialias: true
          })
      } else if (this.app?.renderer?.generateTexture) {
        this.genericHitTexture = this.app.renderer.generateTexture(graphics)
      } else {
        logger.warn(
          'EffectManager',
          'Renderer not available for texture generation'
        )
      }
    } catch (error) {
      logger.warn(
        'EffectManager',
        'Failed to generate generic hit texture',
        error
      )
    } finally {
      graphics.destroy()
    }
  }

  _evictOldestEffect() {
    // O(1) removal of the oldest effect (which is always at headIndex)
    const oldest = this.activeEffects[this.headIndex]
    this.releaseEffectToPool(oldest)
    this.activeEffects[this.headIndex] = null

    this.headIndex = (this.headIndex + 1) % EffectManager.MAX_ACTIVE_EFFECTS
    this.effectCount--
  }

  _resolveHitTexture(color) {
    // Determine texture based on color (Red component dominance)
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff

    if (r > g && r > b && this.textures.blood) {
      return this.textures.blood
    } else if (this.textures.toxic) {
      return this.textures.toxic
    }

    // Use generic texture for fallback
    if (!this.genericHitTexture) {
      this.createGenericHitTexture()
    }
    return this.genericHitTexture
  }

  _getSpriteFromPool(texture) {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop()
      sprite.texture = texture || Texture.WHITE
      sprite.anchor.set(0.5)
      return sprite
    }

    // Create sprite, using generic texture if specific one is missing/not loaded
    // If texture is still null (generation failed), use Texture.WHITE as absolute fallback
    const effect = new Sprite(texture || Texture.WHITE)
    effect.anchor.set(0.5)
    return effect
  }

  spawnHitEffect(x, y, color) {
    if (!this.container) return

    // Cap active effects using MAX_ACTIVE_EFFECTS
    if (this.effectCount >= EffectManager.MAX_ACTIVE_EFFECTS) {
      this._evictOldestEffect()
    }

    const texture = this._resolveHitTexture(color)
    const effect = this._getSpriteFromPool(texture)

    effect.tint = color
    effect.x = x
    effect.y = y
    effect.alpha = 1
    effect.scale.set(0.5)
    effect.visible = true

    // Store animation state
    effect.life = 1.0 // 1.0 to 0.0

    this.container.addChild(effect)

    // Add to circular buffer
    this.activeEffects[this.tailIndex] = effect
    this.tailIndex = (this.tailIndex + 1) % EffectManager.MAX_ACTIVE_EFFECTS
    this.effectCount++
  }

  _handleDeadEffect(idx, i, count) {
    // If it's the head (oldest), we can easily advance head
    if (i === 0) {
      this.headIndex = (this.headIndex + 1) % EffectManager.MAX_ACTIVE_EFFECTS
      this.effectCount--
      return count - 1
      // Don't increment i because the new head is now at "relative index 0"
    } else {
      // It died naturally but isn't the head. This shouldn't happen
      // because they decay uniformly, but if it does (e.g. edge case),
      // use swap-and-pop with the tail element to maintain density.

      // The actual tail index of the last valid element:
      const lastValidIdx =
        (this.headIndex + count - 1) % EffectManager.MAX_ACTIVE_EFFECTS
      const lastEffect = this.activeEffects[lastValidIdx]

      this.activeEffects[idx] = lastEffect
      this.activeEffects[lastValidIdx] = null

      this.tailIndex = lastValidIdx
      this.effectCount--
      return count - 1
      // Don't increment i, we need to process the swapped element
    }
  }

  update(deltaMS) {
    const deltaSec = deltaMS / 1000
    const decay = deltaSec * 3

    // Iterate through the circular buffer
    let i = 0
    let count = this.effectCount

    while (i < count) {
      // Index relative to head
      const idx = (this.headIndex + i) % EffectManager.MAX_ACTIVE_EFFECTS
      const effect = this.activeEffects[idx]

      const newLife = effect.life - decay // Fade out speed
      effect.life = newLife

      if (newLife <= 0) {
        this.releaseEffectToPool(effect)
        this.activeEffects[idx] = null

        count = this._handleDeadEffect(idx, i, count)
      } else {
        effect.alpha = newLife
        effect.scale.set(0.5 + (1.0 - newLife) * 1.5) // Expand from 0.5 to 2.0
        i++
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
    if (effect instanceof Sprite) {
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
    this.activeEffects = new Array(EffectManager.MAX_ACTIVE_EFFECTS)
    this.effectCount = 0
    this.headIndex = 0
    this.tailIndex = 0

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
