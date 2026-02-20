import * as PIXI from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { logger } from '../../utils/logger.js'

export class EffectManager {
  /**
   * @param {PIXI.Application} app
   * @param {PIXI.Container} parentContainer
   */
  constructor(app, parentContainer) {
    this.app = app
    this.parentContainer = parentContainer
    this.container = null
    this.activeEffects = []
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

    // Determine texture based on color (Red component dominance)
    // color is number (e.g. 0xCC0000). R is (color >> 16) & 0xFF
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
      effect = new PIXI.Sprite(texture)
      effect.anchor.set(0.5)
      effect.tint = color
    } else {
      effect = new PIXI.Graphics()
      effect.circle(0, 0, 40)
      effect.fill({ color: 0xffffff, alpha: 0.8 })
      effect.stroke({ width: 4, color: color })
    }

    effect.x = x
    effect.y = y
    effect.alpha = 1
    effect.scale.set(0.5)

    // Store animation state
    effect.life = 1.0 // 1.0 to 0.0

    this.container.addChild(effect)
    this.activeEffects.push(effect)

    // Cap active effects to prevent memory growth during long gigs
    if (this.activeEffects.length > 50) {
      const oldest = this.activeEffects.shift()
      oldest.destroy()
    }
  }

  update(deltaMS) {
    const deltaSec = deltaMS / 1000
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]
      effect.life -= deltaSec * 3 // Fade out speed

      if (effect.life <= 0) {
        effect.destroy()
        this.activeEffects.splice(i, 1)
      } else {
        effect.alpha = effect.life
        effect.scale.set(0.5 + (1.0 - effect.life) * 1.5) // Expand from 0.5 to 2.0
      }
    }
  }

  dispose() {
    this.activeEffects = []
    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
