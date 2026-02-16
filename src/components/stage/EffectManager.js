import * as PIXI from 'pixi.js'

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
  }

  init() {
    this.container = new PIXI.Container()
    this.parentContainer.addChild(this.container)
  }

  spawnHitEffect(x, y, color) {
    if (!this.container) return

    const effect = new PIXI.Graphics()
    effect.circle(0, 0, 40)
    effect.fill({ color: 0xffffff, alpha: 0.8 }) // Core white flash
    effect.stroke({ width: 4, color: color }) // Colored ring
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
