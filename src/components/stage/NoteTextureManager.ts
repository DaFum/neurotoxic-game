import { Texture } from 'pixi.js'
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

  constructor() {
    this.noteTextures = { skull: null, lightning: null }
  }

  async loadAssets(): Promise<void> {
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
    const uniqueTextures = new Set<Texture>()
    if (this.noteTextures.skull) uniqueTextures.add(this.noteTextures.skull)
    if (this.noteTextures.lightning)
      uniqueTextures.add(this.noteTextures.lightning)
    uniqueTextures.forEach(t => t.destroy(true))
    this.noteTextures = { skull: null, lightning: null }
  }
}
