import type { Texture } from 'pixi.js'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../utils/imageGen'
import { handleError } from '../../utils/errorHandler'
import { loadTextures } from './stageRenderUtils'

/**
 * Represents a bundle of textures used for crowd animation states.
 */
type CrowdTextures = {
  /** The texture to display when the crowd is in an idle state. */
  idle: Texture | null
  /** The texture to display when the crowd is in an active mosh state. */
  mosh: Texture | null
}

/**
 * Manages PixiJS texture lifecycles for crowd rendering.
 *
 * @remarks
 * This manager isolates texture loading and cleanup from the main crowd controller.
 * Loaded textures are owned by the shared texture cache and are never destroyed here.
 */
export class CrowdTextureManager {
  /** The current bundle of managed crowd textures. */
  textures: CrowdTextures
  /** Indicates whether this manager has been disposed. */
  isDisposed: boolean

  /**
   * Initializes a new crowd texture manager with empty texture states.
   */
  constructor() {
    this.textures = { idle: null, mosh: null }
    this.isDisposed = false
  }

  /**
   * Loads and caches the idle and mosh crowd textures.
   *
   * @remarks
   * Failures during the loading process are caught and sent to the error handler silently,
   * leaving the target textures as null. If the manager is disposed while assets are loading,
   * the late results are dropped; they are owned by the shared texture cache.
   *
   * @returns A promise that resolves when texture loading is complete.
   */
  async loadAssets(): Promise<void> {
    try {
      const urls = {
        idle: resolveGenImageUrl(IMG_PROMPTS.CROWD_IDLE),
        mosh: resolveGenImageUrl(IMG_PROMPTS.CROWD_MOSH)
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          handleError(error, { fallbackMessage, silent: true })
        }
      )

      // loadTextures returns cache-owned textures shared by other stage users.
      // A disposed manager must drop the late results without destroying them.
      if (this.isDisposed) return

      if (loadedTextures.idle) this.textures.idle = loadedTextures.idle
      if (loadedTextures.mosh) this.textures.mosh = loadedTextures.mosh
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading crowd textures.',
        silent: true
      })
    }
  }

  /**
   * Retrieves the appropriate texture based on the current mosh state.
   *
   * @param shouldMosh - A boolean indicating whether the crowd should display the mosh texture.
   * @returns The resolved texture instance, or null if the texture is not loaded.
   */
  getTargetTexture(shouldMosh: boolean): Texture | null {
    return shouldMosh && this.textures.mosh
      ? this.textures.mosh
      : this.textures.idle
  }

  /**
   * Releases the borrowed crowd textures.
   *
   * @remarks
   * Textures come from the shared texture cache and may be held by another
   * mounted stage, so they are dropped here rather than destroyed.
   */
  dispose(): void {
    this.isDisposed = true
    this.textures = { idle: null, mosh: null }
  }
}
