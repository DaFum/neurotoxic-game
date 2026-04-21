import { Application, Container, Texture } from 'pixi.js'
import { handleError } from '../../utils/errorHandler'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { calculateNoteY, loadTextures } from './utils'
import {
  NoteSpritePool,
  NOTE_CENTER_OFFSET,
  type NoteSprite
} from './NoteSpritePool'

const NOTE_SPAWN_LEAD_MS = 2000

type StageLane = { color: number; renderX: number }
type StageNote = {
  time: number
  visible: boolean
  hit: boolean
  laneIndex: number
}
type StageState = {
  notes: StageNote[]
  notesVersion?: number
  lanes: StageLane[]
  modifiers?: { noteJitter?: boolean }
  speed: number
}
type LaneLayout = { hitLineY?: number }
type ActiveNoteEntity = { note: StageNote; sprite: NoteSprite }
type NoteTextures = { skull: Texture | null; lightning: Texture | null }

export class NoteManager {
  app: Application
  parentContainer: Container
  gameStateRef: Record<string, unknown>
  onHit: ((x: number, y: number, color: number) => void) | null
  container: Container | null
  pool: NoteSpritePool | null
  activeEntities: ActiveNoteEntity[]
  nextRenderIndex: number
  lastNotesVersion: number | null
  noteTextures: NoteTextures

  /**
   * @param {Application} app
   * @param {Container} parentContainer
   * @param {object} gameStateRef
   * @param {Function} onHit - Callback when a note is hit (x, y, color)
   */
  constructor(
    app: Application,
    parentContainer: Container,
    gameStateRef: Record<string, unknown>,
    onHit: ((x: number, y: number, color: number) => void) | null
  ) {
    this.app = app
    this.parentContainer = parentContainer
    this.gameStateRef = gameStateRef
    this.onHit = onHit
    this.container = null
    this.pool = null
    this.activeEntities = [] // Track active {note, sprite} pairs for fast iteration
    this.nextRenderIndex = 0
    this.lastNotesVersion = null // Tracks game-state notesVersion for song-transition resets
    this.noteTextures = { skull: null, lightning: null }
  }

  init(): void {
    this.container = new Container()
    this.parentContainer.addChild(this.container)
    this.pool = new NoteSpritePool(this.container)
    // Pass loaded textures to the pool
    this.pool.noteTextures = this.noteTextures
  }

  async loadAssets(): Promise<void> {
    try {
      const urls = {
        skull: getGenImageUrl(IMG_PROMPTS.NOTE_SKULL),
        lightning: getGenImageUrl(IMG_PROMPTS.NOTE_LIGHTNING)
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          handleError(error, { fallbackMessage })
        }
      )

      if (loadedTextures.skull) {
        this.noteTextures.skull = loadedTextures.skull
        if (this.pool) this.pool.noteTextures.skull = loadedTextures.skull
      }
      if (loadedTextures.lightning) {
        this.noteTextures.lightning = loadedTextures.lightning
        if (this.pool)
          this.pool.noteTextures.lightning = loadedTextures.lightning
      }
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading note textures.'
      })
    }
  }

  update(state: StageState, elapsed: number, laneLayout: LaneLayout): void {
    const targetY = laneLayout?.hitLineY ?? 0

    this._handleSongTransitions(state)
    this._spawnNewNotes(state, elapsed)
    this._updateActiveNotes(state, elapsed, targetY)
  }

  _handleSongTransitions(state: StageState): void {
    // Detect song transitions via the notesVersion counter that the audio hook
    // increments every time it replaces the notes array. This is more reliable
    // than the old elapsed < 100 heuristic which only worked for full restarts.
    const notesVersion = state.notesVersion ?? 0
    if (notesVersion !== this.lastNotesVersion) {
      this.lastNotesVersion = notesVersion
      this.nextRenderIndex = 0
      for (let i = 0; i < this.activeEntities.length; i++) {
        this.pool?.destroyNoteSprite(this.activeEntities[i]?.sprite)
      }
      this.activeEntities.length = 0
    }
  }

  _spawnNewNotes(state: StageState, elapsed: number): void {
    const notes = state.notes
    while (this.nextRenderIndex < notes.length) {
      const note = notes[this.nextRenderIndex]
      if (!note) break

      if (elapsed >= note.time - NOTE_SPAWN_LEAD_MS) {
        if (note.visible && !note.hit) {
          const lane = state.lanes[note.laneIndex]
          if (lane && this.pool && this.container) {
            const sprite = this.pool.acquireSpriteFromPool(lane, note.laneIndex)
            this.container.addChild(sprite)
            this.activeEntities.push({ note, sprite })
          }
        }
        this.nextRenderIndex++
      } else {
        break
      }
    }
  }

  _updateActiveNotes(
    state: StageState,
    elapsed: number,
    targetY: number
  ): void {
    let writeIdx = 0
    for (let i = 0; i < this.activeEntities.length; i++) {
      const entity = this.activeEntities[i]
      if (!entity) continue
      const note = entity.note
      const sprite = entity.sprite

      if (note.hit) {
        const laneColor = state.lanes?.[note.laneIndex]?.color || 0xffffff
        if (this.onHit) {
          this.onHit(sprite.x, sprite.y, laneColor)
        }
        this.pool?.destroyNoteSprite(sprite)
        continue
      }

      if (!note.visible) {
        this.pool?.destroyNoteSprite(sprite)
        continue
      }

      const jitterOffset = state.modifiers?.noteJitter ? sprite.jitterOffset : 0

      sprite.y = calculateNoteY(elapsed, note.time, targetY, state.speed)

      // Unified positioning logic for both texture and fallback sprites
      // Fallback sprites (isFallback=true) do not jitter and are centered at renderX + 50
      // Normal sprites jitter and are also centered at renderX + 50
      const lane = state.lanes[note.laneIndex]
      if (!lane) {
        this.pool?.destroyNoteSprite(sprite)
        continue
      }
      sprite.x =
        lane.renderX +
        NOTE_CENTER_OFFSET +
        (sprite.isFallback ? 0 : jitterOffset)

      this.activeEntities[writeIdx++] = entity
    }

    // Trim the array to the actual number of active notes remaining
    this.activeEntities.length = writeIdx
  }

  dispose(): void {
    for (let i = 0; i < this.activeEntities.length; i++) {
      this.pool?.destroyNoteSprite(this.activeEntities[i]?.sprite)
    }
    this.activeEntities = []
    this.nextRenderIndex = 0
    this.lastNotesVersion = null

    if (this.pool) {
      this.pool.dispose()
      this.pool = null
    }

    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
  }
}
