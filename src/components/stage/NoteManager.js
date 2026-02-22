import * as PIXI from 'pixi.js'
import { handleError } from '../../utils/errorHandler.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { calculateNoteY } from './utils.js'

const NOTE_SPAWN_LEAD_MS = 2000
const NOTE_JITTER_RANGE = 10
const NOTE_SPRITE_SIZE = 80
const NOTE_FALLBACK_WIDTH = 90
const NOTE_FALLBACK_HEIGHT = 20
const NOTE_INITIAL_Y = -50
const NOTE_CENTER_OFFSET = 50
const NOTE_LIGHTNING_LANE_INDEX = 1

export class NoteManager {
  static MAX_POOL_SIZE = 64

  /**
   * @param {PIXI.Application} app
   * @param {PIXI.Container} parentContainer
   * @param {object} gameStateRef
   * @param {Function} onHit - Callback when a note is hit (x, y, color)
   */
  constructor(app, parentContainer, gameStateRef, onHit) {
    this.app = app
    this.parentContainer = parentContainer
    this.gameStateRef = gameStateRef
    this.onHit = onHit
    this.container = null
    this.noteSprites = new Map() // Map<note, Sprite>
    this.nextRenderIndex = 0
    this.lastNotesVersion = null // Tracks game-state notesVersion for song-transition resets
    this.spritePool = []
    this.noteTextures = { skull: null, lightning: null }
  }

  init() {
    this.container = new PIXI.Container()
    this.parentContainer.addChild(this.container)
  }

  async loadAssets() {
    try {
      const results = await Promise.allSettled([
        PIXI.Assets.load(getGenImageUrl(IMG_PROMPTS.NOTE_SKULL)),
        PIXI.Assets.load(getGenImageUrl(IMG_PROMPTS.NOTE_LIGHTNING))
      ])

      if (results[0].status === 'fulfilled') {
        this.noteTextures.skull = results[0].value
      } else {
        handleError(results[0].reason, {
          fallbackMessage: 'Note Skull texture failed to load.'
        })
      }

      if (results[1].status === 'fulfilled') {
        this.noteTextures.lightning = results[1].value
      } else {
        handleError(results[1].reason, {
          fallbackMessage: 'Note Lightning texture failed to load.'
        })
      }
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading note textures.'
      })
    }
  }

  update(state, elapsed, laneLayout) {
    const targetY = laneLayout?.hitLineY ?? 0
    const notes = state.notes

    // Detect song transitions via the notesVersion counter that the audio hook
    // increments every time it replaces the notes array. This is more reliable
    // than the old elapsed < 100 heuristic which only worked for full restarts.
    const notesVersion = state.notesVersion ?? 0
    if (notesVersion !== this.lastNotesVersion) {
      this.lastNotesVersion = notesVersion
      this.nextRenderIndex = 0
      for (const note of this.noteSprites.keys()) {
        this.destroyNoteSprite(note)
      }
    }

    while (this.nextRenderIndex < notes.length) {
      const note = notes[this.nextRenderIndex]

      if (elapsed >= note.time - NOTE_SPAWN_LEAD_MS) {
        if (note.visible && !note.hit) {
          const lane = state.lanes[note.laneIndex]
          const sprite = this.acquireSpriteFromPool(lane, note.laneIndex)
          this.container.addChild(sprite)
          this.noteSprites.set(note, sprite)
        }
        this.nextRenderIndex++
      } else {
        break
      }
    }

    // Direct iteration over the Map is safe even when deleting entries during iteration.
    // This avoids allocating a new array every frame, reducing GC pressure.
    for (const [note, sprite] of this.noteSprites) {
      if (note.hit) {
        const laneColor = state.lanes?.[note.laneIndex]?.color || 0xffffff
        if (this.onHit) {
          this.onHit(sprite.x, sprite.y, laneColor)
        }
        this.destroyNoteSprite(note)
        continue
      }

      if (!note.visible) {
        this.destroyNoteSprite(note)
        continue
      }

      const jitterOffset = state.modifiers.noteJitter ? sprite.jitterOffset : 0

      sprite.y = calculateNoteY({
        elapsed,
        noteTime: note.time,
        targetY,
        speed: state.speed
      })

      // Unified positioning logic for both texture and fallback sprites
      // Fallback sprites (isFallback=true) do not jitter and are centered at renderX + 50
      // Normal sprites jitter and are also centered at renderX + 50
      sprite.x =
        state.lanes[note.laneIndex].renderX +
        NOTE_CENTER_OFFSET +
        (sprite.isFallback ? 0 : jitterOffset)
    }
  }

  acquireSpriteFromPool(lane, laneIndex) {
    let sprite
    if (this.spritePool.length > 0) {
      sprite = this.spritePool.pop()
    } else {
      sprite = this.createNoteSprite(laneIndex)
    }

    this.initializeNoteSprite(sprite, lane, laneIndex)
    return sprite
  }

  createNoteSprite(laneIndex) {
    const useLightning = laneIndex === NOTE_LIGHTNING_LANE_INDEX
    const desiredTexture = useLightning
      ? this.noteTextures.lightning
      : this.noteTextures.skull
    const fallbackTexture = useLightning
      ? this.noteTextures.skull
      : this.noteTextures.lightning

    // Try desired first, then fallback
    const effectiveTexture = desiredTexture || fallbackTexture

    if (effectiveTexture) {
      const sprite = new PIXI.Sprite(effectiveTexture)
      sprite.anchor.set(0.5)
      sprite.isFallback = false
      return sprite
    }

    // Use PIXI.Texture.WHITE for fallback instead of PIXI.Graphics
    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
    sprite.anchor.set(0.5)
    sprite.isFallback = true
    return sprite
  }

  initializeNoteSprite(sprite, lane, laneIndex) {
    sprite.visible = true
    sprite.alpha = 1
    sprite.jitterOffset = (Math.random() - 0.5) * NOTE_JITTER_RANGE

    const useLightning = laneIndex === NOTE_LIGHTNING_LANE_INDEX
    const desiredTexture = useLightning
      ? this.noteTextures.lightning
      : this.noteTextures.skull
    const fallbackTexture = useLightning
      ? this.noteTextures.skull
      : this.noteTextures.lightning

    const effectiveTexture = desiredTexture || fallbackTexture

    if (effectiveTexture) {
      if (sprite.texture !== effectiveTexture) {
        sprite.texture = effectiveTexture
      }
      sprite.isFallback = false
    } else {
      // Ensure we are using white texture for fallback
      if (sprite.texture !== PIXI.Texture.WHITE) {
        sprite.texture = PIXI.Texture.WHITE
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

  destroyNoteSprite(note) {
    const sprite = this.noteSprites.get(note)
    if (!sprite) return

    if (this.container) {
      this.container.removeChild(sprite)
    }

    // Release to pool instead of destroying
    this.releaseSpriteToPool(sprite)
    this.noteSprites.delete(note)
  }

  releaseSpriteToPool(sprite) {
    sprite.visible = false
    if (this.spritePool.length < NoteManager.MAX_POOL_SIZE) {
      this.spritePool.push(sprite)
    } else {
      sprite.destroy()
    }
  }

  dispose() {
    for (const note of this.noteSprites.keys()) {
      this.destroyNoteSprite(note)
    }
    this.noteSprites.clear()
    this.nextRenderIndex = 0
    this.lastNotesVersion = null

    // Destroy pooled sprites
    for (const sprite of this.spritePool) {
      sprite.destroy()
    }
    this.spritePool = []

    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
