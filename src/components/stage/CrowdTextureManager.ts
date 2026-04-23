import { Texture } from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { handleError } from '../../utils/errorHandler'
import { loadTextures } from './utils'

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
        idle: getGenImageUrl(IMG_PROMPTS.CROWD_IDLE),
        mosh: getGenImageUrl(IMG_PROMPTS.CROWD_MOSH)
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          handleError(error, { fallbackMessage })
        }
      )

      if (loadedTextures.idle) this.textures.idle = loadedTextures.idle
      if (loadedTextures.mosh) this.textures.mosh = loadedTextures.mosh
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading crowd textures.'
      })
    }
  }

  getTargetTexture(shouldMosh: boolean): Texture | null {
    return shouldMosh && this.textures.mosh ? this.textures.mosh : this.textures.idle
  }

  dispose(): void {
    this.textures = { idle: null, mosh: null }
  }
}
