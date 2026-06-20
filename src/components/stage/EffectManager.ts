import { Application, Container } from 'pixi.js'
import { EffectTextureManager } from './EffectTextureManager'
import { EffectSprite, EffectSpritePool } from './EffectSpritePool'

/**
 * Manages Effect rendering resources and state.
 */
export class EffectManager {
  static MAX_ACTIVE_EFFECTS = 50
  app: Application
  parentContainer: Container
  container: Container | null
  textureManager: EffectTextureManager
  activeEffects: Array<EffectSprite | null>
  effectCount: number
  headIndex: number
  tailIndex: number
  spritePool: EffectSpritePool

  /**
   * Initializes the manager with circular buffer pooling and assigns parent rendering resources.
   * @param app - The host Pixi application instance managing the rendering loop.
   * @param parentContainer - The parent Pixi container where effect sprites will be injected.
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
    this.spritePool = new EffectSpritePool()
  }

  init(): void {
    this.container = new Container()
    this.parentContainer.addChild(this.container)
    this.spritePool.setContainer(this.container)
  }

  async loadAssets(): Promise<void> {
    await this.textureManager.loadAssets()
  }

  /**
   * Releases an effect sprite to the underlying sprite pool.
   *
   * @remarks
   * This method must ONLY be used for effects NOT currently tracked in the circular buffer (`activeEffects`),
   * otherwise the buffer state tracking will become permanently inconsistent.
   *
   * @param effect - The effect sprite to release.
   */
  releaseEffectToPool(effect: EffectSprite | null): void {
    this.spritePool.releaseSprite(effect)
  }

  _evictOldestEffect(): void {
    // O(1) removal of the oldest effect (which is always at headIndex)
    const oldest = this.activeEffects[this.headIndex]
    this.spritePool.releaseSprite(oldest ?? null)
    this.activeEffects[this.headIndex] = null

    this.headIndex = (this.headIndex + 1) % EffectManager.MAX_ACTIVE_EFFECTS
    this.effectCount--
  }

  /**
   * Spawns a new visual hit effect at the specified world coordinates.
   *
   * @remarks
   * This method manages a circular buffer. If the maximum capacity of active effects
   * is reached, it deterministically evicts the oldest effect in O(1) time without shifting.
   *
   * @param x - The x-coordinate location to spawn the effect.
   * @param y - The y-coordinate location to spawn the effect.
   * @param color - The hexadecimal color value to tint the spawned effect.
   */
  spawnHitEffect(x: number, y: number, color: number): void {
    if (!this.container) return

    // Cap active effects using MAX_ACTIVE_EFFECTS
    if (this.effectCount >= EffectManager.MAX_ACTIVE_EFFECTS) {
      this._evictOldestEffect()
    }

    const texture = this.textureManager.resolveHitTexture(color)
    const effect = this.spritePool.getSprite(texture)

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

      this.activeEffects[idx] = lastEffect ?? null
      this.activeEffects[lastValidIdx] = null

      this.tailIndex = lastValidIdx
      this.effectCount--
      return count - 1
      // Don't increment i, we need to process the swapped element
    }
  }

  /**
   * Advances the animation timeline and opacity decay for all currently active effect sprites.
   *
   * @remarks
   * This update loop skips destroyed or released effects. If an effect decays below visibility,
   * it is automatically released back to the local object pool and cleared from the buffer.
   *
   * @param deltaMS - The elapsed time since the last frame in milliseconds.
   */
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
        this.spritePool.releaseSprite(effect)
        this.activeEffects[idx] = null

        count = this._handleDeadEffect(idx, i, count)
      } else {
        effect.alpha = newLife
        effect.scale.set(0.5 + (1.0 - newLife) * 1.5) // Expand from 0.5 to 2.0
        i++
      }
    }
  }

  /**
   * Purges all active effect sprites, clears tracked rendering resources, and destroys
   * the underlying texture managers and sprite pools.
   */
  dispose(): void {
    this.activeEffects = new Array(EffectManager.MAX_ACTIVE_EFFECTS)
    this.effectCount = 0
    this.headIndex = 0
    this.tailIndex = 0

    this.spritePool.dispose()

    this.textureManager.dispose()

    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
