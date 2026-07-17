import { Container, Sprite } from 'pixi.js'

/**
 * Provides an abstract foundation for managing a reusable pool of PixiJS Sprites to minimize
 * memory allocation overhead and garbage collection pressure during continuous rendering.
 *
 * @remarks
 * This class implements a standard object pooling pattern. Instead of instantiating and destroying
 * sprites dynamically, which can cause performance stutters, sprites are deactivated and returned
 * to the pool. When the pool reaches `maxPoolSize`, surplus sprites are fully destroyed.
 * Subclasses must define the `maxPoolSize` based on expected concurrent entity counts.
 *
 * @typeParam T - The expected Sprite class or subclass structure managed by this pool.
 */
export abstract class BaseSpritePool<T extends Sprite> {
  container: Container | null
  spritePool: T[]
  protected abstract maxPoolSize: number

  /**
   * Initializes a new sprite pool.
   *
   * @param container - The optional PixiJS Container where active sprites should reside.
   */
  constructor(container: Container | null = null) {
    this.container = container
    this.spritePool = []
  }

  /**
   * Assigns the parent container used for spatial placement of active sprites.
   *
   * @param container - The PixiJS Container where sprites will be attached.
   */
  setContainer(container: Container): void {
    this.container = container
  }

  /**
   * Returns a sprite to the pool for future reuse, or destroys it if the pool is full.
   *
   * @remarks
   * This handles hiding the sprite from the renderer (`visible = false`). It does not automatically
   * detach the sprite from its parent container, relying instead on visibility culling to save
   * scene graph manipulation overhead.
   *
   * @param sprite - The sprite instance to be recycled or destroyed.
   */
  releaseSpriteToPool(sprite: T): void {
    sprite.visible = false
    if (this.spritePool.length < this.maxPoolSize) {
      this.spritePool.push(sprite)
    } else {
      sprite.destroy({ children: true, texture: false, textureSource: false })
    }
  }

  /**
   * Purges all sprites currently held in the pool and permanently destroys their graphical bounds.
   *
   * @remarks
   * This is typically called during teardown procedures or scene transitions to clean up
   * pooled sprite instances. Note that shared textures are not destroyed by this pool, as they
   * are managed externally by their respective texture managers. Active sprites currently
   * rendered on screen are not tracked by the pool and must be destroyed externally.
   */
  dispose(): void {
    for (let i = 0; i < this.spritePool.length; i++) {
      this.spritePool[i]?.destroy()
    }
    this.spritePool = []
    this.container = null
  }
}
