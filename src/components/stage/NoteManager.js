import * as PIXI from 'pixi.js'
import { handleError } from '../../utils/errorHandler.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { calculateNoteY } from '../../utils/pixiStageUtils.js'

const NOTE_SPAWN_LEAD_MS = 2000
const NOTE_JITTER_RANGE = 10
const NOTE_SPRITE_SIZE = 80
const NOTE_FALLBACK_WIDTH = 90
const NOTE_FALLBACK_HEIGHT = 20
const NOTE_INITIAL_Y = -50
const NOTE_CENTER_OFFSET = 50

export class NoteManager {
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
    this.spritePool = []
    this.noteTexture = null
  }

  init() {
    this.container = new PIXI.Container()
    this.parentContainer.addChild(this.container)
  }

  async loadAssets() {
    const noteTextureUrl = getGenImageUrl(IMG_PROMPTS.NOTE_SKULL)
    try {
      this.noteTexture = await PIXI.Assets.load(noteTextureUrl)
    } catch (error) {
      this.noteTexture = null
      handleError(error, {
        fallbackMessage: 'Note texture konnte nicht geladen werden.'
      })
    }
  }

  update(state, elapsed, laneLayout) {
    const targetY = laneLayout?.hitLineY ?? 0
    const notes = state.notes

    // Reset render index if notes were reset (e.g. restart)
    if (this.nextRenderIndex >= notes.length && notes.length > 0) {
      // Crude heuristic: if elapsed is very small but index is high, we reset
      if (elapsed < 100) {
        this.nextRenderIndex = 0
        // Clean up sprites that might be stale
        const notesToRemove = Array.from(this.noteSprites.keys())
        for (const note of notesToRemove) {
          this.destroyNoteSprite(note)
        }
      }
    }

    while (this.nextRenderIndex < notes.length) {
      const note = notes[this.nextRenderIndex]

      if (elapsed >= note.time - NOTE_SPAWN_LEAD_MS) {
        if (note.visible && !note.hit) {
          const lane = state.lanes[note.laneIndex]
          const sprite = this.acquireSpriteFromPool(lane)
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

      if (sprite instanceof PIXI.Sprite) {
        sprite.x =
          state.lanes[note.laneIndex].renderX +
          NOTE_CENTER_OFFSET +
          jitterOffset
      } else {
        // Fallback graphics are positioned differently (renderX + 5)
        // We only update Y for them to avoid jumping
        sprite.x = state.lanes[note.laneIndex].renderX + 5
      }
    }
  }

  acquireSpriteFromPool(lane) {
    let sprite
    if (this.spritePool.length > 0) {
      sprite = this.spritePool.pop()
    } else {
      sprite = this.createNoteSprite()
    }

    this.initializeNoteSprite(sprite, lane)
    return sprite
  }

  createNoteSprite() {
    if (this.noteTexture) {
      const sprite = new PIXI.Sprite(this.noteTexture)
      sprite.anchor.set(0.5)
      return sprite
    }

    return new PIXI.Graphics()
  }

  initializeNoteSprite(sprite, lane) {
    sprite.visible = true
    sprite.alpha = 1
    sprite.jitterOffset = (Math.random() - 0.5) * NOTE_JITTER_RANGE

    if (sprite instanceof PIXI.Sprite) {
      sprite.tint = lane.color
      sprite.x = lane.renderX + NOTE_CENTER_OFFSET
      sprite.y = NOTE_INITIAL_Y
      sprite.width = NOTE_SPRITE_SIZE
      sprite.height = NOTE_SPRITE_SIZE
    } else if (sprite instanceof PIXI.Graphics) {
      sprite.clear()
      sprite.rect(0, 0, NOTE_FALLBACK_WIDTH, NOTE_FALLBACK_HEIGHT)
      sprite.fill({ color: lane.color })
      sprite.x = lane.renderX + 5
      sprite.y = NOTE_INITIAL_Y
      sprite.scale.set(1)
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
    this.spritePool.push(sprite)
  }

  dispose() {
    const notesToRemove = Array.from(this.noteSprites.keys())
    for (const note of notesToRemove) {
      this.destroyNoteSprite(note)
    }
    this.noteSprites.clear()
    this.nextRenderIndex = 0

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
