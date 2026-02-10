import * as PIXI from 'pixi.js'
import { handleError } from '../utils/errorHandler'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import {
  buildRhythmLayout,
  calculateCrowdY,
  calculateNoteY,
  CROWD_LAYOUT
} from '../utils/pixiStageUtils'

const NOTE_SPAWN_LEAD_MS = 2000
const NOTE_JITTER_RANGE = 10
const NOTE_SPRITE_SIZE = 80
const NOTE_FALLBACK_WIDTH = 90
const NOTE_FALLBACK_HEIGHT = 20
const NOTE_INITIAL_Y = -50
const NOTE_CENTER_OFFSET = 50
const LANE_GAP = 20

/**
 * Manages Pixi.js stage lifecycle and rendering updates.
 */
class PixiStageController {
  /**
   * @param {object} params - Controller dependencies.
   * @param {React.MutableRefObject<HTMLElement|null>} params.containerRef - DOM container ref.
   * @param {React.MutableRefObject<object>} params.gameStateRef - Mutable game state ref.
   * @param {React.MutableRefObject<Function|null>} params.updateRef - Update callback ref.
   * @param {React.MutableRefObject<object>} params.statsRef - Stats ref for UI-driven effects.
   */
  constructor({ containerRef, gameStateRef, updateRef, statsRef }) {
    this.containerRef = containerRef
    this.gameStateRef = gameStateRef
    this.updateRef = updateRef
    this.statsRef = statsRef
    this.app = null
    this.colorMatrix = null
    this.stageContainer = null
    this.rhythmContainer = null
    this.crowdMembers = []
    this.laneGraphics = [] // Stores { static: Graphics, dynamic: Graphics }
    this.noteContainer = null
    this.effectsContainer = null
    this.activeEffects = []
    this.noteTexture = null
    this.laneLayout = null
    this.lastLayoutKey = null
    this.lastLaneActive = []
    this.isDisposed = false
    this.initPromise = null
    this.handleTicker = this.handleTicker.bind(this)

    // O(N) Rendering Optimizations
    this.noteSprites = new Map() // Map<note, Sprite>
    this.nextRenderIndex = 0 // Tracks the next note to spawn
    this.spritePool = [] // Object pool for reusable sprites
  }

  /**
   * Initializes the Pixi application and stage objects.
   * @returns {Promise<void>} Resolves when initialization completes.
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      try {
        this.isDisposed = false

        const container = this.containerRef.current
        if (!container) {
          return
        }

        this.app = new PIXI.Application()
        await this.app.init({
          backgroundAlpha: 0,
          resizeTo: container,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        })

        if (this.isDisposed || !this.containerRef.current || !this.app) {
          this.dispose()
          return
        }

        container.appendChild(this.app.canvas)
        this.colorMatrix = new PIXI.ColorMatrixFilter()
        this.stageContainer = new PIXI.Container()
        this.app.stage.addChild(this.stageContainer)

        await this.loadAssets()
        if (this.isDisposed) {
          this.dispose()
          return
        }
        this.createCrowd()
        this.createLanes()
        this.createNoteContainer()
        this.createEffectsContainer()
        this.app.ticker.add(this.handleTicker)
      } catch (error) {
        console.error(
          '[PixiStageController] Failed to initialize stage.',
          error
        )
        this.dispose()
        throw error
      }
    })()

    return this.initPromise
  }

  /**
   * Manually runs a single update frame, useful for testing without a real ticker.
   * @param {number} deltaMS - Time delta in milliseconds.
   */
  manualUpdate(deltaMS) {
    if (!this.app || this.isDisposed) return
    this.handleTicker({ deltaMS })
  }

  /**
   * Loads textures used by the renderer.
   * @returns {Promise<void>} Resolves when assets are loaded.
   */
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

  /**
   * Builds the crowd sprites and adds them to the stage.
   * @returns {void}
   */
  createCrowd() {
    const crowdContainer = new PIXI.Container()
    crowdContainer.y = this.app.screen.height * CROWD_LAYOUT.containerYRatio
    this.stageContainer.addChild(crowdContainer)

    for (let i = 0; i < CROWD_LAYOUT.memberCount; i += 1) {
      const crowd = new PIXI.Graphics()
      const radius =
        CROWD_LAYOUT.minRadius + Math.random() * CROWD_LAYOUT.radiusVariance
      crowd.circle(0, 0, radius)
      crowd.fill(0x333333)
      crowd.x = Math.random() * this.app.screen.width
      crowd.y =
        Math.random() * (this.app.screen.height * CROWD_LAYOUT.yRangeRatio)
      crowd.baseY = crowd.y
      crowd.radius = radius
      crowd.currentFillColor = 0x333333
      crowdContainer.addChild(crowd)
      this.crowdMembers.push(crowd)
    }
  }

  /**
   * Creates lane graphics and caches their positions.
   * @returns {void}
   */
  createLanes() {
    this.rhythmContainer = new PIXI.Container()
    this.laneLayout = buildRhythmLayout({
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height
    })
    this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    this.stageContainer.addChild(this.rhythmContainer)

    const startX = this.laneLayout.startX
    const laneWidth = this.laneLayout.laneWidth
    const laneHeight = this.laneLayout.laneHeight
    const laneStrokeWidth = this.laneLayout.laneStrokeWidth

    this.gameStateRef.current.lanes.forEach((lane, index) => {
      const laneX = startX + index * (laneWidth + LANE_GAP)
      lane.renderX = laneX

      // Create separate graphics for static background and dynamic elements
      const staticGraphics = new PIXI.Graphics()
      const dynamicGraphics = new PIXI.Graphics()

      // Draw static background once
      staticGraphics.rect(laneX, 0, laneWidth, laneHeight)
      staticGraphics.fill({ color: 0x000000, alpha: 0.8 })
      staticGraphics.stroke({ width: laneStrokeWidth, color: 0x333333 })

      this.rhythmContainer.addChild(staticGraphics)
      this.rhythmContainer.addChild(dynamicGraphics)

      this.laneGraphics[index] = {
        static: staticGraphics,
        dynamic: dynamicGraphics
      }
    })
  }

  /**
   * Creates a container for note sprites.
   * @returns {void}
   */
  createNoteContainer() {
    this.noteContainer = new PIXI.Container()
    if (this.rhythmContainer) {
      this.rhythmContainer.addChild(this.noteContainer)
    } else {
      this.stageContainer.addChild(this.noteContainer)
    }
  }

  /**
   * Creates a container for visual effects.
   * @returns {void}
   */
  createEffectsContainer() {
    this.effectsContainer = new PIXI.Container()
    if (this.rhythmContainer) {
      this.rhythmContainer.addChild(this.effectsContainer)
    } else {
      this.stageContainer.addChild(this.effectsContainer)
    }
  }

  /**
   * Spawns a hit effect at the given coordinates.
   * @param {number} x
   * @param {number} y
   * @param {number} color
   */
  spawnHitEffect(x, y, color) {
    if (!this.effectsContainer) return

    const effect = new PIXI.Graphics()
    effect.circle(0, 0, 40)
    effect.fill({ color: 0xffffff, alpha: 0.8 }) // Core white flash
    effect.stroke({ width: 4, color: color }) // Colored ring
    effect.x = x
    effect.y = y
    effect.alpha = 1
    effect.scale.set(0.5)

    // Store animation state
    effect.life = 1.0 // 1.0 to 0.0

    this.effectsContainer.addChild(effect)
    this.activeEffects.push(effect)
  }

  /**
   * Updates active visual effects.
   * @param {number} deltaMS
   */
  updateEffects(deltaMS) {
    const deltaSec = deltaMS / 1000
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]
      effect.life -= deltaSec * 3 // Fade out speed

      if (effect.life <= 0) {
        effect.destroy()
        this.activeEffects.splice(i, 1)
      } else {
        effect.alpha = effect.life
        effect.scale.set(0.5 + (1.0 - effect.life) * 1.5) // Expand from 0.5 to 2.0
      }
    }
  }

  /**
   * Updates lane visuals based on input state.
   * @param {object} state - Current game state ref.
   * @returns {void}
   */
  updateLaneGraphics(state) {
    const layoutUpdated = this.updateLaneLayout()
    const layout = this.laneLayout

    state.lanes.forEach((lane, index) => {
      const graphicsSet = this.laneGraphics[index]
      if (!graphicsSet) {
        return
      }

      // Redraw static graphics only if layout updated
      if (layoutUpdated) {
        const { static: staticGraphics } = graphicsSet
        staticGraphics.clear()
        staticGraphics.rect(
          lane.renderX,
          0,
          layout.laneWidth,
          layout.laneHeight
        )
        staticGraphics.fill({ color: 0x000000, alpha: 0.8 })
        staticGraphics.stroke({
          width: layout.laneStrokeWidth,
          color: 0x333333
        })
      }

      const wasActive = this.lastLaneActive[index]

      // Update dynamic graphics if layout changed OR activity changed
      if (layoutUpdated || wasActive !== lane.active) {
        this.lastLaneActive[index] = lane.active

        const { dynamic: dynamicGraphics } = graphicsSet
        dynamicGraphics.clear()

        dynamicGraphics.rect(
          lane.renderX,
          layout.hitLineY,
          layout.laneWidth,
          layout.hitLineHeight
        )
        if (lane.active) {
          dynamicGraphics.fill({ color: lane.color, alpha: 0.8 })
          dynamicGraphics.stroke({
            width: layout.hitLineStrokeWidth,
            color: 0xffffff
          })
        } else {
          dynamicGraphics.stroke({
            width: layout.hitLineStrokeWidth,
            color: lane.color
          })
        }
      }
    })
  }

  /**
   * Updates crowd visuals based on combo and mode.
   * @param {number} combo - Current combo count.
   * @param {boolean} isToxicMode - Toxic mode state.
   * @param {number} timeMs - Current time in ms.
   * @returns {void}
   */
  updateCrowd(combo, isToxicMode, timeMs) {
    this.crowdMembers.forEach(member => {
      member.y = calculateCrowdY({ baseY: member.baseY, combo, timeMs })
      const nextColor = isToxicMode
        ? 0x00ff41
        : combo > 20
          ? 0xffffff
          : 0x555555
      if (member.currentFillColor !== nextColor) {
        member.currentFillColor = nextColor
        member.clear()
        member.circle(0, 0, member.radius)
        member.fill(nextColor)
      }
    })
  }

  /**
   * Creates or updates note sprites.
   * @param {object} state - Current game state ref.
   * @param {number} elapsed - Elapsed time since start in ms.
   * @returns {void}
   */
  updateNotes(state, elapsed) {
    const targetY = this.laneLayout?.hitLineY ?? 0
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
          this.noteContainer.addChild(sprite)
          this.noteSprites.set(note, sprite)
        }
        this.nextRenderIndex++
      } else {
        break
      }
    }

    // Safe iteration: snapshot entries to avoid issues with map mutation during iteration
    const activeNotes = Array.from(this.noteSprites.entries())

    for (const [note, sprite] of activeNotes) {
      if (note.hit) {
        const laneColor = state.lanes?.[note.laneIndex]?.color || 0xffffff
        this.spawnHitEffect(sprite.x, sprite.y, laneColor)
        this.destroyNoteSprite(note)
        continue
      }

      if (!note.visible) {
        this.destroyNoteSprite(note)
        continue
      }

      const jitterOffset = state.modifiers.noteJitter
        ? (Math.random() - 0.5) * NOTE_JITTER_RANGE
        : 0

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

  /**
   * Acquires a sprite from the pool or creates a new one.
   * @param {object} lane - Lane configuration.
   * @returns {PIXI.DisplayObject} Note sprite instance.
   */
  acquireSpriteFromPool(lane) {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop()
      sprite.visible = true

      if (sprite instanceof PIXI.Sprite) {
        sprite.tint = lane.color
        sprite.x = lane.renderX + NOTE_CENTER_OFFSET
        sprite.y = NOTE_INITIAL_Y
        sprite.alpha = 1
        sprite.scale.set(0.5) // Assuming scale is reset to base
      } else if (sprite instanceof PIXI.Graphics) {
        sprite.clear()
        sprite.rect(0, 0, NOTE_FALLBACK_WIDTH, NOTE_FALLBACK_HEIGHT)
        sprite.fill({ color: lane.color })
        sprite.x = lane.renderX + 5
        sprite.y = NOTE_INITIAL_Y
        sprite.alpha = 1
        sprite.scale.set(1)
      }
      return sprite
    }
    return this.createNoteSprite(lane)
  }

  /**
   * Creates a note sprite with a texture fallback.
   * @param {object} lane - Lane configuration.
   * @returns {PIXI.DisplayObject} Note sprite instance.
   */
  createNoteSprite(lane) {
    if (this.noteTexture) {
      const sprite = new PIXI.Sprite(this.noteTexture)
      sprite.width = NOTE_SPRITE_SIZE
      sprite.height = NOTE_SPRITE_SIZE
      sprite.anchor.set(0.5)
      sprite.x = lane.renderX + NOTE_CENTER_OFFSET
      sprite.y = NOTE_INITIAL_Y
      sprite.tint = lane.color
      return sprite
    }

    const rect = new PIXI.Graphics()
    rect.rect(0, 0, NOTE_FALLBACK_WIDTH, NOTE_FALLBACK_HEIGHT)
    rect.fill({ color: lane.color })
    rect.x = lane.renderX + 5
    rect.y = NOTE_INITIAL_Y
    return rect
  }

  /**
   * Removes a note sprite from the stage and releases its resources.
   * @param {object} note - Note data entry.
   * @returns {void}
   */
  destroyNoteSprite(note) {
    const sprite = this.noteSprites.get(note)
    if (!sprite) return

    if (this.noteContainer) {
      this.noteContainer.removeChild(sprite)
    }

    // Release to pool instead of destroying
    this.releaseSpriteToPool(sprite)
    this.noteSprites.delete(note)
  }

  /**
   * Releases a sprite back to the pool.
   * @param {PIXI.DisplayObject} sprite - The sprite to release.
   */
  releaseSpriteToPool(sprite) {
    sprite.visible = false
    this.spritePool.push(sprite)
  }

  /**
   * Updates lane layout when the screen size changes.
   * @returns {boolean} Whether the layout was updated.
   */
  updateLaneLayout() {
    const layoutKey = `${this.app.screen.width}x${this.app.screen.height}`
    if (layoutKey === this.lastLayoutKey) {
      return false
    }
    this.lastLayoutKey = layoutKey
    this.laneLayout = buildRhythmLayout({
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height
    })
    if (this.rhythmContainer) {
      this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    }
    const startX = this.laneLayout.startX

    this.gameStateRef.current.lanes.forEach((lane, index) => {
      lane.renderX = startX + index * (this.laneLayout.laneWidth + LANE_GAP)
    })
    return true
  }

  /**
   * Handles ticker updates from Pixi.js.
   * @param {PIXI.Ticker} ticker - Pixi ticker instance.
   * @returns {void}
   */
  handleTicker(ticker) {
    if (this.updateRef.current) {
      this.updateRef.current(ticker.deltaMS)
    }

    const state = this.gameStateRef.current
    const stats = this.statsRef.current

    if (state.isGameOver || (!state.running && !state.pauseTime)) {
      return
    }

    const elapsed = state.elapsed ?? 0

    if (stats?.isToxicMode) {
      this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
      this.stageContainer.filters = [this.colorMatrix]
    } else {
      this.stageContainer.filters = []
    }

    this.updateLaneGraphics(state)
    this.updateCrowd(stats?.combo ?? 0, stats?.isToxicMode, elapsed)
    this.updateNotes(state, elapsed)
    this.updateEffects(ticker.deltaMS)
  }

  /**
   * Disposes Pixi resources and removes the canvas.
   * @returns {void}
   */
  dispose() {
    this.isDisposed = true
    this.initPromise = null
    if (this.app && this.app.ticker) {
      this.app.ticker.remove(this.handleTicker)
      this.app.ticker.stop()
    }

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

    this.laneGraphics = []
    this.crowdMembers = []

    this.activeEffects.forEach(effect => {
      effect.destroy?.()
    })
    this.activeEffects = []
    this.effectsContainer = null

    if (this.app) {
      try {
        if (this.app.renderer && this.app.stage) {
          this.app.destroy(true, {
            children: true,
            texture: true
          })
        }
      } catch (e) {
        console.warn('Pixi App destroy failed:', e)
      }
      this.app = null
    }

    if (this.containerRef?.current) {
      this.containerRef.current.innerHTML = ''
    }
  }
}

/**
 * Factory for PixiStageController instances.
 * @param {object} params - Controller dependencies.
 * @returns {PixiStageController} Controller instance.
 */
export const createPixiStageController = params =>
  new PixiStageController(params)
