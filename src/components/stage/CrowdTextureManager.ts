import type { Texture } from 'pixi.js'
import {
  getGenImageUrl,
  IMG_PROMPTS,
  isImageGenerationAvailable,
  getGeneratedImageFallbackUrl
} from '../../utils/imageGen'
import { handleError } from '../../utils/errorHandler'
import { loadTextures } from './stageRenderUtils'

export type CrowdTextures = {
  idle: Texture | null
  mosh: Texture | null
}

export class CrowdTextureManager {
  textures: CrowdTextures

  constructor() {
    this.textures = { idle: null, mosh: null }
  }

  async loadAssets(): Promise<void> {
    try {
      const urls = {
        idle: isImageGenerationAvailable()
          ? getGenImageUrl(IMG_PROMPTS.CROWD_IDLE)
          : getGeneratedImageFallbackUrl(),
        mosh: isImageGenerationAvailable()
          ? getGenImageUrl(IMG_PROMPTS.CROWD_MOSH)
          : getGeneratedImageFallbackUrl()
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          handleError(error, { fallbackMessage, silent: true })
        }
      )

      if (loadedTextures.idle) this.textures.idle = loadedTextures.idle
      if (loadedTextures.mosh) this.textures.mosh = loadedTextures.mosh
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading crowd textures.',
        silent: true
      })
    }
  }

  getTargetTexture(shouldMosh: boolean): Texture | null {
    return shouldMosh && this.textures.mosh
      ? this.textures.mosh
      : this.textures.idle
  }

  dispose(): void {
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
