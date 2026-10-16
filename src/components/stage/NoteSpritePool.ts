import { Sprite, Texture } from 'pixi.js'
import { BaseSpritePool } from './pool/BaseSpritePool'
import { getSafeRandom } from '../../utils/crypto'
import type { NoteTextures } from './NoteTextureManager'

const NOTE_JITTER_RANGE = 10
const NOTE_SPRITE_SIZE = 80
const NOTE_FALLBACK_WIDTH = 90
const NOTE_FALLBACK_HEIGHT = 20
const NOTE_INITIAL_Y = -50
/**
 * Centering offset applied when positioning note sprites.
 */
export const NOTE_CENTER_OFFSET = 50
const NOTE_LIGHTNING_LANE_INDEX = 1

type LaneData = {
  color: number
  renderX?: number
}

/**
 * Sprite instance plus metadata managed by the rhythm note sprite pool.
 */
export type NoteSprite = Sprite & {
  isFallback: boolean
  jitterOffset: number
}

/**
 * Pools reusable Pixi note sprites for rhythm rendering.
 */
export class NoteSpritePool extends BaseSpritePool<NoteSprite> {
  protected maxPoolSize = 64
  noteTextures: NoteTextures = { skull: null, lightning: null }

  acquireSpriteFromPool(lane: LaneData, laneIndex: number): NoteSprite {
    const useLightning = laneIndex === NOTE_LIGHTNING_LANE_INDEX
    const desiredTexture = useLightning
      ? this.noteTextures.lightning
      : this.noteTextures.skull
    const fallbackTexture = useLightning
      ? this.noteTextures.skull
      : this.noteTextures.lightning

    const effectiveTexture = desiredTexture || fallbackTexture
    const texture = effectiveTexture || Texture.WHITE
    let sprite = this.spritePool.pop()
    if (!sprite) {
      sprite = new Sprite(texture) as NoteSprite
      sprite.anchor.set(0.5)
    }
    sprite.visible = true
    sprite.alpha = 1

    const randomVal = getSafeRandom()
    sprite.jitterOffset = (randomVal - 0.5) * NOTE_JITTER_RANGE

    if (sprite.texture !== texture) {
      sprite.texture = texture
    }
    sprite.isFallback = !effectiveTexture

    sprite.tint = lane.color
    sprite.x = (lane.renderX ?? 0) + NOTE_CENTER_OFFSET
    sprite.y = NOTE_INITIAL_Y

    if (sprite.isFallback) {
      sprite.width = NOTE_FALLBACK_WIDTH
      sprite.height = NOTE_FALLBACK_HEIGHT
    } else {
      sprite.width = NOTE_SPRITE_SIZE
      sprite.height = NOTE_SPRITE_SIZE
    }
    return sprite
  }

  destroyNoteSprite(sprite: NoteSprite | null | undefined): void {
    if (!sprite) return

    if (this.container) {
      this.container.removeChild(sprite)
    }

    this.releaseSpriteToPool(sprite)
  }
}
