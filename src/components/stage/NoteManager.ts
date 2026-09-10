import { Application, Container } from 'pixi.js'
import type { RefObject } from 'react'
import { calculateNoteY, getPixiColorFromToken } from './stageRenderUtils'
import {
  NoteSpritePool,
  NOTE_CENTER_OFFSET,
  type NoteSprite
} from './NoteSpritePool'
import { NoteTextureManager } from './NoteTextureManager'

const NOTE_SPAWN_LEAD_MS = 2000

type StageLane = { color: number; renderX?: number }
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

/**
 * Manages Note rendering resources and state.
 */
export class NoteManager {
  app: Application
  parentContainer: Container
  gameStateRef: RefObject<StageState>
  onHit: ((x: number, y: number, color: number) => void) | null
  container: Container | null
  pool: NoteSpritePool | null
  activeEntities: ActiveNoteEntity[]
  nextRenderIndex: number
  lastNotesVersion: number | null
  textureManager: NoteTextureManager

  /**
   * @param app - App.
   * @param parentContainer - Parent container.
   * @param gameStateRef - Game state ref.
   * @param onHit - Callback when a note is hit (x, y, color)
   */
  constructor(
    app: Application,
    parentContainer: Container,
    gameStateRef: RefObject<StageState>,
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
    this.textureManager = new NoteTextureManager()
  }

  init(): void {
    this.container = new Container()
    this.parentContainer.addChild(this.container)
    this.pool = new NoteSpritePool(this.container)
    // Pass loaded textures to the pool
    this.pool.noteTextures = this.textureManager.noteTextures
  }

  async loadAssets(): Promise<void> {
    await this.textureManager.loadAssets()
    if (this.pool) {
      this.pool.noteTextures = this.textureManager.noteTextures
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
            // ⚡ BOLT OPTIMIZATION: Pass lane directly without allocating intermediate renderLane object.
            // Why: Prevents object allocation churn on every spawned note in the 60fps game loop.
            // Impact: Eliminates GC allocations during note spawning.
            const sprite = this.pool.acquireSpriteFromPool(
              lane,
              note.laneIndex
            )
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
    // ⚡ BOLT OPTIMIZATION: Hoist loop-invariant state references to avoid property access in hot loop.
    // Why: state.modifiers?.noteJitter, state.lanes, and state.speed are invariant across active notes in a single frame.
    // Impact: Saves repeated property lookups on every active note in the 60fps render loop.
    const activeEntities = this.activeEntities
    const lanes = state.lanes
    const isJitter = Boolean(state.modifiers?.noteJitter)
    const speed = state.speed

    for (let i = 0; i < activeEntities.length; i++) {
      const entity = activeEntities[i]
      if (!entity) continue
      const note = entity.note
      const sprite = entity.sprite

      if (note.hit) {
        const laneColor =
          lanes?.[note.laneIndex]?.color ??
          getPixiColorFromToken('--star-white')
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

      const lane = lanes?.[note.laneIndex]
      if (!lane) {
        this.pool?.destroyNoteSprite(sprite)
        continue
      }

      const jitterOffset = isJitter ? sprite.jitterOffset : 0
      sprite.y = calculateNoteY(elapsed, note.time, targetY, speed)

      // Unified positioning logic for both texture and fallback sprites
      // Fallback sprites (isFallback=true) do not jitter and are centered at renderX + 50
      // Normal sprites jitter and are also centered at renderX + 50
      const renderX = lane.renderX ?? 0
      sprite.x =
        renderX +
        NOTE_CENTER_OFFSET +
        (sprite.isFallback ? 0 : jitterOffset)

      activeEntities[writeIdx++] = entity
    }

    // Trim the array to the actual number of active notes remaining
    activeEntities.length = writeIdx
  }

  dispose(): void {
    for (let i = 0; i < this.activeEntities.length; i++) {
      this.pool?.destroyNoteSprite(this.activeEntities[i]?.sprite)
    }
    this.activeEntities = []
    this.nextRenderIndex = 0
    this.lastNotesVersion = null

    this.textureManager.dispose()

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
