import { Application, Container } from 'pixi.js'
import type { RefObject } from 'react'
import {
  calculateLaneX,
  calculateNoteY,
  getPixiColorFromToken
} from './stageRenderUtils'
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
export type LaneLayout = {
  hitLineY?: number
  startX?: number
  laneWidth?: number
  laneGap?: number
  laneXPositions?: number[]
}
type ActiveNoteEntity = { note: StageNote; sprite: NoteSprite }

/**
 * Resolves the horizontal X position for a lane using render layout coordinates.
 *
 * @param laneIndex - The zero-based index of the lane.
 * @param layout - Optional rhythm stage layout metrics.
 * @param laneXPositions - Optional precalculated array of lane X coordinates.
 * @param fallbackLane - Optional fallback lane object for test compatibility.
 * @returns The resolved X coordinate.
 */
export const getLaneX = (
  laneIndex: number,
  layout?: LaneLayout | null,
  laneXPositions?: number[] | null,
  fallbackLane?: StageLane | null
): number => {
  if (laneXPositions && typeof laneXPositions[laneIndex] === 'number') {
    return laneXPositions[laneIndex]
  }
  if (
    layout?.laneXPositions &&
    typeof layout.laneXPositions[laneIndex] === 'number'
  ) {
    return layout.laneXPositions[laneIndex]
  }
  if (
    layout &&
    typeof layout.startX === 'number' &&
    typeof layout.laneWidth === 'number'
  ) {
    return calculateLaneX(
      layout.startX,
      layout.laneWidth,
      layout.laneGap,
      laneIndex
    )
  }
  if (fallbackLane && typeof fallbackLane.renderX === 'number') {
    return fallbackLane.renderX
  }
  return 0
}

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
  entityPool: ActiveNoteEntity[]
  nextRenderIndex: number
  lastNotesVersion: number | null
  textureManager: NoteTextureManager
  starWhiteColor: number

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
    this.entityPool = [] // Pool for active note entity wrappers to avoid allocation on spawn
    this.nextRenderIndex = 0
    this.lastNotesVersion = null // Tracks game-state notesVersion for song-transition resets
    this.textureManager = new NoteTextureManager()
    this.starWhiteColor = getPixiColorFromToken('--star-white')
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

  update(
    state: StageState,
    elapsed: number,
    laneLayout: LaneLayout,
    laneXPositions?: number[]
  ): void {
    const targetY = laneLayout?.hitLineY ?? 0

    this._handleSongTransitions(state)
    this._spawnNewNotes(state, elapsed, laneLayout, laneXPositions)
    this._updateActiveNotes(state, elapsed, targetY, laneLayout, laneXPositions)
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
        const entity = this.activeEntities[i]
        if (entity) {
          this.pool?.destroyNoteSprite(entity.sprite)
          this.entityPool.push(entity)
        }
      }
      this.activeEntities.length = 0
    }
  }

  _spawnNewNotes(
    state: StageState,
    elapsed: number,
    laneLayout?: LaneLayout,
    laneXPositions?: number[]
  ): void {
    const notes = state.notes
    while (this.nextRenderIndex < notes.length) {
      const note = notes[this.nextRenderIndex]
      if (!note) break

      if (elapsed >= note.time - NOTE_SPAWN_LEAD_MS) {
        if (note.visible && !note.hit) {
          const lane = state.lanes[note.laneIndex]
          if (lane && this.pool && this.container) {
            // ⚡ BOLT OPTIMIZATION: Pass lane directly to acquireSpriteFromPool instead of creating a shallow clone
            // Why: Prevents creating `{ ...lane, renderX }` object allocations on every note spawn during active gameplay.
            // Impact: Eliminates object allocation and garbage collection pressure for every spawned rhythm note.
            const laneX = getLaneX(
              note.laneIndex,
              laneLayout,
              laneXPositions,
              lane
            )
            const sprite = this.pool.acquireSpriteFromPool(
              lane,
              note.laneIndex,
              laneX
            )
            this.container.addChild(sprite)

            // ⚡ BOLT OPTIMIZATION: Recycle wrapper objects from entityPool instead of instantiating `{ note, sprite }`
            // Why: Prevents creating fresh wrapper object allocations for every spawned note during 60 FPS gameplay.
            // Impact: Eliminates object allocation and GC pressure for active note entity tracking during gigs.
            const entity = this.entityPool.pop() ?? { note, sprite }
            entity.note = note
            entity.sprite = sprite
            this.activeEntities.push(entity)
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
    targetY: number,
    laneLayout?: LaneLayout,
    laneXPositions?: number[]
  ): void {
    let writeIdx = 0
    for (let i = 0; i < this.activeEntities.length; i++) {
      const entity = this.activeEntities[i]
      if (!entity) continue
      const note = entity.note
      const sprite = entity.sprite

      if (note.hit) {
        // ⚡ BOLT OPTIMIZATION: Read cached starWhiteColor instance property instead of calling getPixiColorFromToken.
        // What: Replaced DOM/style CSS variable lookup on note hit inside the 60 FPS update loop.
        // Why: getPixiColorFromToken performs map lookups and DOM style queries every time a note is hit without a lane color.
        // Impact: Prevents DOM/style queries and function call overhead inside 60 FPS update loop.
        const laneColor =
          state.lanes?.[note.laneIndex]?.color ?? this.starWhiteColor
        if (this.onHit) {
          this.onHit(sprite.x, sprite.y, laneColor)
        }
        this.pool?.destroyNoteSprite(sprite)
        this.entityPool.push(entity)
        continue
      }

      if (!note.visible) {
        this.pool?.destroyNoteSprite(sprite)
        this.entityPool.push(entity)
        continue
      }

      const jitterOffset = state.modifiers?.noteJitter ? sprite.jitterOffset : 0

      sprite.y = calculateNoteY(elapsed, note.time, targetY, state.speed)

      // Unified positioning logic for both texture and fallback sprites
      // Fallback sprites (isFallback=true) do not jitter and are centered at laneX + 50
      // Normal sprites jitter and are also centered at laneX + 50
      const lane = state.lanes[note.laneIndex]
      if (!lane) {
        this.pool?.destroyNoteSprite(sprite)
        this.entityPool.push(entity)
        continue
      }
      const laneX = getLaneX(note.laneIndex, laneLayout, laneXPositions, lane)
      sprite.x =
        laneX + NOTE_CENTER_OFFSET + (sprite.isFallback ? 0 : jitterOffset)

      this.activeEntities[writeIdx++] = entity
    }

    // Trim the array to the actual number of active notes remaining
    this.activeEntities.length = writeIdx
  }

  dispose(): void {
    for (let i = 0; i < this.activeEntities.length; i++) {
      const entity = this.activeEntities[i]
      if (entity) {
        this.pool?.destroyNoteSprite(entity.sprite)
      }
    }
    this.activeEntities = []
    this.entityPool = []
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
