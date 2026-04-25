/*
 * REVIEW.md
 * (#1) Actual Updates:
 * - Extracted texture loading, generation, and resolution from EffectManager into EffectTextureManager.
 * - Added correct .destroy(true) calls for blood and toxic textures in dispose().
 * - Corrected JSDoc type definitions for the PixiJS Application parameter.
 * (#2) Next Steps:
 * - Consider creating dedicated asset bundles or pre-generating particle textures for all specific lane colors (red, green, blue) to remove the fallback-to-toxic behavior.
 * (#3) Found Errors + Solutions:
 * - Error: Memory leak when disposing EffectManager. Solution: Added .destroy(true) for textures before nulling them out.
 * - Error: Accidentally changed bass lane hit effect logic during refactor. Solution: Reverted the \`g > r && g > b\` logic to the original \`this.textures.toxic\` fallback so non-red colors (like blue bass and white fallback) render the toxic texture as originally designed.
 */
import { Graphics, Texture } from 'pixi.js'
import type { Application } from 'pixi.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { logger } from '../../utils/logger'
import {
  loadTextures,
  getPixiColorFromToken,
  getOptimalResolution
} from './utils'

/**
 * Safely destroys a texture if it exists and has a destroy method.
 */
function safeDestroyTexture(texture: Texture | null): void {
  if (
    texture &&
    texture !== Texture.WHITE &&
    typeof texture.destroy === 'function'
  ) {
    texture.destroy(true)
  }
}

/**
 * Creates a generic hit texture using PixiJS Graphics.
 */
function createGenericHitTexture(app: Application): Texture | null {
  const graphics = new Graphics()
  const whiteColor = getPixiColorFromToken('--star-white')

  graphics.circle(0, 0, 40)
  graphics.fill({ color: whiteColor, alpha: 0.8 })
  graphics.stroke({ width: 4, color: whiteColor, alpha: 1.0 })

  let texture: Texture | null = null

  try {
    const renderer = app.renderer
    const rendererRecord = renderer as unknown as Record<string, unknown>

    if (
      Object.hasOwn(rendererRecord, 'textureGenerator') &&
      typeof (rendererRecord.textureGenerator as Record<string, unknown>)
        ?.generateTexture === 'function'
    ) {
      const textureGenerator = rendererRecord.textureGenerator as {
        generateTexture: (options: unknown) => Texture
      }
      texture = textureGenerator.generateTexture({
        target: graphics,
        resolution: getOptimalResolution(),
        antialias: true
      })
    } else if (typeof renderer.generateTexture === 'function') {
      const generateTexture = renderer.generateTexture as (
        graphics: Graphics
      ) => Texture
      texture = generateTexture.call(renderer, graphics)
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

  return texture
}

export class EffectTextureManager {
  private app: Application
  private textures: { blood: Texture | null; toxic: Texture | null }
  private genericHitTexture: Texture | null

  constructor(app: Application) {
    this.app = app
    this.textures = { blood: null, toxic: null }
    this.genericHitTexture = null
  }

  async loadAssets(): Promise<void> {
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
      logger.warn(
        'EffectTextureManager',
        'Effect textures failed to load',
        error
      )
    }
  }

  private _createGenericHitTexture(): void {
    if (this.genericHitTexture) return
    this.genericHitTexture = createGenericHitTexture(this.app) || Texture.WHITE
  }

  resolveHitTexture(color: number): Texture | null {
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff

    if (r > g && r > b && this.textures.blood) {
      return this.textures.blood
    } else if (this.textures.toxic) {
      return this.textures.toxic
    }

    if (!this.genericHitTexture) {
      this._createGenericHitTexture()
    }
    return this.genericHitTexture
  }

  dispose(): void {
    safeDestroyTexture(this.genericHitTexture)
    this.genericHitTexture = null

    safeDestroyTexture(this.textures.blood)
    safeDestroyTexture(this.textures.toxic)
    this.textures = { blood: null, toxic: null }
  }
}
