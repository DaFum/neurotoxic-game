import type { Texture } from 'pixi.js'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../utils/imageGen'
import { handleError } from '../../utils/errorHandler'
import { loadTextures } from './stageRenderUtils'

/**
 * Represents a bundle of textures used for crowd animation states.
 */
export type CrowdTextures = {
  /** The texture to display when the crowd is in an idle state. */
  idle: Texture | null
  /** The texture to display when the crowd is in an active mosh state. */
  mosh: Texture | null
}

/**
 * Manages PixiJS texture lifecycles for crowd rendering.
 *
 * @remarks
 * This manager isolates texture loading and cleanup from the main crowd controller,
 * ensuring that resources are reliably loaded and safely destroyed without leaking.
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
   * the newly loaded textures are immediately destroyed to guarantee leak-free cleanup.
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

      if (this.isDisposed) {
        if (loadedTextures.idle && typeof loadedTextures.idle.destroy === 'function') {
          loadedTextures.idle.destroy(true)
        }
        if (loadedTextures.mosh && typeof loadedTextures.mosh.destroy === 'function') {
          loadedTextures.mosh.destroy(true)
        }
        return
      }

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
   * Safely destroys all managed textures to free GPU memory.
   *
   * @remarks
   * Uses a Set to ensure that if multiple states map to the same underlying texture,
   * it is only destroyed once.
   */
  dispose(): void {
    this.isDisposed = true
    const uniqueTextures = new Set<Texture>()

    if (this.textures.idle) {
      uniqueTextures.add(this.textures.idle)
    }
    if (this.textures.mosh) {
      uniqueTextures.add(this.textures.mosh)
    }

    uniqueTextures.forEach(texture => {
      if (typeof texture.destroy === 'function') {
        texture.destroy(true)
      }
    })

    this.textures = { idle: null, mosh: null }
  }
}
