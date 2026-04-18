import { Container, Sprite, Texture } from 'pixi.js'
import { handleError } from '../../utils/errorHandler'
import { secureRandom } from '../../utils/crypto'

export const NOTE_JITTER_RANGE = 10
export const NOTE_SPRITE_SIZE = 80
export const NOTE_FALLBACK_WIDTH = 90
export const NOTE_FALLBACK_HEIGHT = 20
export const NOTE_INITIAL_Y = -50
export const NOTE_CENTER_OFFSET = 50
export const NOTE_LIGHTNING_LANE_INDEX = 1

type LaneData = {
  color: number
  renderX: number
}

export type NoteSprite = Sprite & {
  isFallback: boolean
  jitterOffset: number
}

type NoteTextures = {
  skull: Texture | null
  lightning: Texture | null
}

export class NoteSpritePool {
  static MAX_POOL_SIZE = 64
  container: Container | null
  spritePool: NoteSprite[]
  noteTextures: NoteTextures
  rngErrorReported: boolean

  constructor(container: Container | null) {
    this.container = container
    this.spritePool = []
    this.noteTextures = { skull: null, lightning: null }
    this.rngErrorReported = false
  }

  acquireSpriteFromPool(lane: LaneData, laneIndex: number): NoteSprite {
    let sprite: NoteSprite | undefined
    if (this.spritePool.length > 0) {
      sprite = this.spritePool.pop()
    } else {
      sprite = this.createNoteSprite(laneIndex)
    }

    if (!sprite) {
      sprite = this.createNoteSprite(laneIndex)
    }
    this.initializeNoteSprite(sprite, lane, laneIndex)
    return sprite
  }

  _getEffectiveTexture(laneIndex: number): Texture | null {
    const useLightning = laneIndex === NOTE_LIGHTNING_LANE_INDEX
    const desiredTexture = useLightning
      ? this.noteTextures.lightning
      : this.noteTextures.skull
    const fallbackTexture = useLightning
      ? this.noteTextures.skull
      : this.noteTextures.lightning

    return desiredTexture || fallbackTexture
  }

  createNoteSprite(laneIndex: number): NoteSprite {
    const effectiveTexture = this._getEffectiveTexture(laneIndex)

    if (effectiveTexture) {
      const sprite = new Sprite(effectiveTexture) as NoteSprite
      sprite.anchor.set(0.5)
      sprite.isFallback = false
      sprite.jitterOffset = 0
      return sprite
    }

    // Use Texture.WHITE for fallback instead of Graphics
    const sprite = new Sprite(Texture.WHITE) as NoteSprite
    sprite.anchor.set(0.5)
    sprite.isFallback = true
    sprite.jitterOffset = 0
    return sprite
  }

  initializeNoteSprite(
    sprite: NoteSprite,
    lane: LaneData,
    laneIndex: number
  ): void {
    sprite.visible = true
    sprite.alpha = 1

    let randomVal
    try {
      randomVal = secureRandom()
    } catch (e) {
      if (!this.rngErrorReported) {
        this.rngErrorReported = true
        handleError(e, { severity: 'medium', silent: true })
      }
      randomVal = Math.random()
    }
    sprite.jitterOffset = (randomVal - 0.5) * NOTE_JITTER_RANGE

    const effectiveTexture = this._getEffectiveTexture(laneIndex)

    if (effectiveTexture) {
      if (sprite.texture !== effectiveTexture) {
        sprite.texture = effectiveTexture
      }
      sprite.isFallback = false
    } else {
      // Ensure we are using white texture for fallback
      if (sprite.texture !== Texture.WHITE) {
        sprite.texture = Texture.WHITE
      }
      sprite.isFallback = true
    }

    sprite.tint = lane.color
    sprite.x = lane.renderX + NOTE_CENTER_OFFSET
    sprite.y = NOTE_INITIAL_Y

    if (sprite.isFallback) {
      sprite.width = NOTE_FALLBACK_WIDTH
      sprite.height = NOTE_FALLBACK_HEIGHT
    } else {
      sprite.width = NOTE_SPRITE_SIZE
      sprite.height = NOTE_SPRITE_SIZE
    }
  }

  destroyNoteSprite(sprite: NoteSprite | null | undefined): void {
    if (!sprite) return

    if (this.container) {
      this.container.removeChild(sprite)
    }

    // Release to pool instead of destroying
    this.releaseSpriteToPool(sprite)
  }

  releaseSpriteToPool(sprite: NoteSprite): void {
    sprite.visible = false
    if (this.spritePool.length < NoteSpritePool.MAX_POOL_SIZE) {
      this.spritePool.push(sprite)
    } else {
      sprite.destroy({ children: true, texture: false, textureSource: false })
    }
  }

  dispose(): void {
    // Destroy pooled sprites
    for (let i = 0; i < this.spritePool.length; i++) {
      this.spritePool[i].destroy()
    }
    this.spritePool = []
    this.container = null
  }
}
