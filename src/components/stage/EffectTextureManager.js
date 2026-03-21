import { Graphics } from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { logger } from '../../utils/logger.js'
import { loadTextures, getPixiColorFromToken } from './utils.js'

export class EffectTextureManager {
  /**
   * @param {import('pixi.js').Application} app
   */
  constructor(app) {
    this.app = app
    this.textures = { blood: null, toxic: null }
    this.genericHitTexture = null
  }

  async loadAssets() {
    try {
      const urls = {
        blood: getGenImageUrl(IMG_PROMPTS.HIT_BLOOD),
        toxic: getGenImageUrl(IMG_PROMPTS.HIT_TOXIC)
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          logger.warn('EffectTextureManager', fallbackMessage, error)
        }
      )

      if (loadedTextures.blood) this.textures.blood = loadedTextures.blood
      if (loadedTextures.toxic) this.textures.toxic = loadedTextures.toxic
    } catch (error) {
      logger.warn('EffectTextureManager', 'Effect textures failed to load', error)
    }
  }

  _createGenericHitTexture() {
    if (this.genericHitTexture) return

    const graphics = new Graphics()
    const whiteColor = getPixiColorFromToken('--star-white')

    graphics.circle(0, 0, 40)
    graphics.fill({ color: whiteColor, alpha: 0.8 })
    graphics.stroke({ width: 4, color: whiteColor, alpha: 1.0 })

    try {
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
          'EffectTextureManager',
          'Renderer not available for texture generation'
        )
      }
    } catch (error) {
      logger.warn(
        'EffectTextureManager',
        'Failed to generate generic hit texture',
        error
      )
    } finally {
      graphics.destroy()
    }
  }

  resolveHitTexture(color) {
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff

    if (r > g && r > b && this.textures.blood) {
      return this.textures.blood
    } else if (g > r && g > b && this.textures.toxic) {
      return this.textures.toxic
    }

    if (!this.genericHitTexture) {
      this._createGenericHitTexture()
    }
    return this.genericHitTexture
  }

  dispose() {
    if (this.genericHitTexture) {
      this.genericHitTexture.destroy(true)
      this.genericHitTexture = null
    }
    if (this.textures.blood) {
      this.textures.blood.destroy(true)
    }
    if (this.textures.toxic) {
      this.textures.toxic.destroy(true)
    }
    this.textures = { blood: null, toxic: null }
  }
}
