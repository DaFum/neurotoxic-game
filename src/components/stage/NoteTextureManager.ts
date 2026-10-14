import type { Texture } from 'pixi.js'
import { handleError } from '../../utils/errorHandler'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../utils/imageGen'
import { loadTextures } from './stageRenderUtils'

/**
 * Texture bundle used for rhythm note sprites and lane-specific variants.
 */
export type NoteTextures = { skull: Texture | null; lightning: Texture | null }

/**
 * Manages Note Texture rendering resources and state.
 */
export class NoteTextureManager {
  noteTextures: NoteTextures
  private isDisposed: boolean

  constructor() {
    this.noteTextures = { skull: null, lightning: null }
    this.isDisposed = false
  }

  async loadAssets(): Promise<void> {
    if (this.isDisposed) return

    try {
      const urls = {
        skull: resolveGenImageUrl(IMG_PROMPTS.NOTE_SKULL),
        lightning: resolveGenImageUrl(IMG_PROMPTS.NOTE_LIGHTNING)
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          handleError(error, { fallbackMessage })
        }
      )

      // loadTextures returns cache-owned textures shared by other stage users.
      // A disposed manager must drop the late results without destroying them.
      if (this.isDisposed) return

      if (loadedTextures.skull) {
        this.noteTextures.skull = loadedTextures.skull
      }
      if (loadedTextures.lightning) {
        this.noteTextures.lightning = loadedTextures.lightning
      }
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading note textures.'
      })
    }
  }

  dispose(): void {
    this.isDisposed = true
    this.noteTextures = { skull: null, lightning: null }
  }
}
