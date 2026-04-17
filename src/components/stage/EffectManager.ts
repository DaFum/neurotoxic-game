// TODO: Review this file
import { Application, Container, Sprite, Texture } from 'pixi.js'
import { EffectTextureManager } from './EffectTextureManager'

type EffectSprite = Sprite & {
  isSprite: boolean
  life: number
}

export class EffectManager {
  static MAX_POOL_SIZE = 50
  static MAX_ACTIVE_EFFECTS = 50
  app: Application
  parentContainer: Container
  container: Container | null
  textureManager: EffectTextureManager
  activeEffects: Array<EffectSprite | null>
  effectCount: number
  headIndex: number
  tailIndex: number
  spritePool: EffectSprite[]

  /**
   * @param {Application} app
   * @param {Container} parentContainer
   */
  constructor(app: Application, parentContainer: Container) {
    this.app = app
    this.parentContainer = parentContainer
    this.container = null
    this.textureManager = new EffectTextureManager(app)

    // Use an array with index tracking to implement a fast Circular Buffer
    // This allows O(1) removals of the oldest effect without shifting.
    this.activeEffects = new Array(EffectManager.MAX_ACTIVE_EFFECTS)
    this.effectCount = 0
    this.headIndex = 0
    this.tailIndex = 0

    // Pool for Sprites (no longer need separate graphics pool)
    this.spritePool = []
  }

  init(): void {
    this.container = new Container()
    this.parentContainer.addChild(this.container)
  }

  async loadAssets(): Promise<void> {
    await this.textureManager.loadAssets()
  }

  _evictOldestEffect(): void {
    // O(1) removal of the oldest effect (which is always at headIndex)
    const oldest = this.activeEffects[this.headIndex]
    this.releaseEffectToPool(oldest)
    this.activeEffects[this.headIndex] = null

    this.headIndex = (this.headIndex + 1) % EffectManager.MAX_ACTIVE_EFFECTS
    this.effectCount--
  }

  _getSpriteFromPool(texture: Texture | null): EffectSprite {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop()
      if (!sprite) {
        const fallbackSprite = new Sprite(
          texture || Texture.WHITE
        ) as EffectSprite
        fallbackSprite.isSprite = true
        fallbackSprite.life = 1
        fallbackSprite.anchor.set(0.5)
        return fallbackSprite
      }
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

  spawnHitEffect(x: number, y: number, color: number): void {
    if (!this.container) return

    // Cap active effects using MAX_ACTIVE_EFFECTS
    if (this.effectCount >= EffectManager.MAX_ACTIVE_EFFECTS) {
      this._evictOldestEffect()
    }

    const texture = this.textureManager.resolveHitTexture(color)
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

  _handleDeadEffect(idx: number, i: number, count: number): number {
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

  update(deltaMS: number): void {
    const deltaSec = deltaMS / 1000
    const decay = deltaSec * 3

    // Iterate through the circular buffer
    let i = 0
    let count = this.effectCount

    while (i < count) {
      // Index relative to head
      const idx = (this.headIndex + i) % EffectManager.MAX_ACTIVE_EFFECTS
      const effect = this.activeEffects[idx]
      if (!effect) {
        i++
        continue
      }

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

  releaseEffectToPool(effect: EffectSprite | null): void {
    if (!effect) return

    if (this.container) {
      this.container.removeChild(effect)
    }

    effect.visible = false

    // Only pool Sprites (legacy graphics would be destroyed if they existed)
    if (effect.isSprite) {
      if (this.spritePool.length < EffectManager.MAX_POOL_SIZE) {
        this.spritePool.push(effect)
      } else {
        effect.destroy()
      }
    } else {
      effect.destroy()
    }
  }

  dispose(): void {
    this.activeEffects = new Array(EffectManager.MAX_ACTIVE_EFFECTS)
    this.effectCount = 0
    this.headIndex = 0
    this.tailIndex = 0

    // Destroy pool
    for (let i = 0; i < this.spritePool.length; i++) {
      this.spritePool[i].destroy()
    }
    this.spritePool = []

    this.textureManager.dispose()

    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
