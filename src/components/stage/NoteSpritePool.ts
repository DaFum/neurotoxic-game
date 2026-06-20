import { Container, Sprite, Texture } from 'pixi.js'
import { getSafeRandom } from '../../utils/crypto'

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
  renderX: number
}

/**
 * Sprite instance plus metadata managed by the rhythm note sprite pool.
 */
export type NoteSprite = Sprite & {
  isFallback: boolean
  jitterOffset: number
}

type NoteTextures = {
  skull: Texture | null
  lightning: Texture | null
}

/**
 * Factory for creating and initializing note sprites.
 *
 * @remarks
 * This class abstracts the texture selection and fallback logic for note sprites
 * so that NoteSpritePool can focus on pooling semantics.
 */
export class NoteSpriteFactory {
  noteTextures: NoteTextures

  constructor() {
    this.noteTextures = { skull: null, lightning: null }
  }

  /**
   * Retrieves the appropriate texture for a given lane.
   *
   * @param laneIndex - The index of the rhythm lane.
   * @returns The resolved texture or null if none is available.
   */
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

  /**
   * Creates a new uninitialized note sprite for the given lane.
   *
   * @param laneIndex - The index of the rhythm lane.
   * @returns A new sprite instance configured as a note or fallback.
   */
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

  /**
   * Reinitializes a note sprite with fresh state and textures.
   *
   * @param sprite - The sprite instance to reset.
   * @param lane - Visual data for the target lane.
   * @param laneIndex - The index of the rhythm lane.
   */
  initializeNoteSprite(
    sprite: NoteSprite,
    lane: LaneData,
    laneIndex: number
  ): void {
    sprite.visible = true
    sprite.alpha = 1

    const randomVal = getSafeRandom()
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
}

/**
 * Pools reusable Pixi note sprites for rhythm rendering.
 */
export class NoteSpritePool {
  static MAX_POOL_SIZE = 64
  container: Container | null
  spritePool: NoteSprite[]
  factory: NoteSpriteFactory

  constructor(container: Container | null) {
    this.container = container
    this.spritePool = []
    this.factory = new NoteSpriteFactory()
  }

  get noteTextures(): NoteTextures {
    return this.factory.noteTextures
  }

  set noteTextures(value: NoteTextures) {
    this.factory.noteTextures = value
  }

  /**
   * Retrieves an active note sprite from the pool or creates one if empty.
   *
   * @param lane - Visual data for the target lane.
   * @param laneIndex - The index of the rhythm lane.
   * @returns A ready-to-render note sprite.
   */
  acquireSpriteFromPool(lane: LaneData, laneIndex: number): NoteSprite {
    const sprite =
      this.spritePool.pop() ?? this.factory.createNoteSprite(laneIndex)
    this.factory.initializeNoteSprite(sprite, lane, laneIndex)
    return sprite
  }

  /**
   * Returns an active sprite to the pool and removes it from the display list.
   *
   * @param sprite - The sprite to release.
   */
  destroyNoteSprite(sprite: NoteSprite | null | undefined): void {
    if (!sprite) return

    if (this.container) {
      this.container.removeChild(sprite)
    }

    // Release to pool instead of destroying
    this.releaseSpriteToPool(sprite)
  }

  /**
   * Enqueues a sprite back into the internal pool or destroys it if full.
   *
   * @param sprite - The sprite to pool.
   */
  releaseSpriteToPool(sprite: NoteSprite): void {
    sprite.visible = false
    if (this.spritePool.length < NoteSpritePool.MAX_POOL_SIZE) {
      this.spritePool.push(sprite)
    } else {
      sprite.destroy({ children: true, texture: false, textureSource: false })
    }
  }

  /**
   * Destroys all pooled sprites and references to prepare for garbage collection.
   */
  dispose(): void {
    // Destroy pooled sprites
    for (let i = 0; i < this.spritePool.length; i++) {
      this.spritePool[i]?.destroy()
    }
    this.spritePool = []
    this.container = null
  }
}
