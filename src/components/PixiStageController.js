import * as PIXI from 'pixi.js'
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

/**
 * Manages Pixi.js stage lifecycle and rendering updates.
 */
export class PixiStageController {
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
    this.noteTexture = null
    this.laneLayout = null
    this.lastLayoutKey = null
    this.lastLaneActive = []
    this.isDisposed = false
    this.initPromise = null
    this.handleTicker = this.handleTicker.bind(this)
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
        this.app = new PIXI.Application()
        await this.app.init({
          backgroundAlpha: 0,
          resizeTo: this.containerRef.current,
          antialias: true
        })

        const container = this.containerRef.current
        if (this.isDisposed || !container || !this.app) {
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
    try {
      // NOTE: Using a hardcoded reliable image or base64 data URI here is safer than external generators for PIXI textures.
      // But if we must use the generator, we accept that PIXI might complain about format parsing if extension is missing.
      // As a fix for "PixiJS Warning: ... could not be loaded as we don't know how to parse it":
      // We can treat it as a generic image resource or fallback to drawing.
      // For now, let's just use the fallback drawing if loading fails, which the catch block handles.
      // To suppress the warning, we might need to specify loadParser, but imageGen URLs are dynamic.

      // Simply relying on fallback for now to avoid the specific parsing warning spam if possible,
      // or just ignore it as we have a fallback.
      // Ideally:
      // this.noteTexture = await PIXI.Assets.load({ src: url, format: 'png' });

      const noteTextureUrl = getGenImageUrl(IMG_PROMPTS.NOTE_SKULL)
      // We rely on the standard loader behavior here and fall back to drawing if loading fails.
      try {
        this.noteTexture = await PIXI.Texture.fromURL(noteTextureUrl)
      } catch {
        this.noteTexture = null
      }
    } catch (error) {
      this.noteTexture = null
      // console.warn('[PixiStageController] Note texture unavailable, using fallback.');
      // Suppressing full stack trace for known asset issues to clean up logs
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
      const laneX = startX + lane.x

      // Create separate graphics for static background and dynamic elements
      const staticGraphics = new PIXI.Graphics()
      const dynamicGraphics = new PIXI.Graphics()

      // Draw static background once
      staticGraphics.rect(laneX, 0, laneWidth, laneHeight)
      staticGraphics.fill({ color: 0x000000, alpha: 0.8 })
      staticGraphics.stroke({ width: laneStrokeWidth, color: 0x333333 })

      this.rhythmContainer.addChild(staticGraphics)
      this.rhythmContainer.addChild(dynamicGraphics)

      lane.renderX = laneX
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

    state.notes.forEach(note => {
      if (
        note.visible &&
        !note.hit &&
        !note.sprite &&
        elapsed >= note.time - NOTE_SPAWN_LEAD_MS
      ) {
        const lane = state.lanes[note.laneIndex]
        note.sprite = this.createNoteSprite(lane)
        this.noteContainer.addChild(note.sprite)
      }

      if (!note.sprite) {
        return
      }

      if (!note.visible || note.hit) {
        this.destroyNoteSprite(note)
        return
      }

      note.sprite.visible = true
      const jitterOffset = state.modifiers.noteJitter
        ? (Math.random() - 0.5) * NOTE_JITTER_RANGE
        : 0
      note.sprite.y = calculateNoteY({
        elapsed,
        noteTime: note.time,
        targetY,
        speed: state.speed
      })
      note.sprite.x =
        state.lanes[note.laneIndex].renderX + NOTE_CENTER_OFFSET + jitterOffset
    })
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
    if (!note.sprite) {
      return
    }
    if (this.noteContainer) {
      this.noteContainer.removeChild(note.sprite)
    }
    if (note.sprite.destroy) {
      note.sprite.destroy()
    }
    note.sprite = null
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
    this.gameStateRef.current.lanes.forEach(lane => {
      lane.renderX = this.laneLayout.startX + lane.x
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

    // Stop updating if game is over or fully stopped
    if (state.isGameOver || (!state.running && !state.pauseTime)) {
      return
    }

    const now = Date.now()
    const elapsed = now - state.startTime

    if (stats?.isToxicMode) {
      this.colorMatrix.hue(Math.sin(now / 100) * 180, false)
      this.stageContainer.filters = [this.colorMatrix]
    } else {
      this.stageContainer.filters = []
    }

    this.updateLaneGraphics(state)
    this.updateCrowd(stats?.combo ?? 0, stats?.isToxicMode, now)
    this.updateNotes(state, elapsed)
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
    }

    if (this.gameStateRef?.current?.notes) {
      this.gameStateRef.current.notes.forEach(note => {
        this.destroyNoteSprite(note)
      })
    }

    this.laneGraphics = []
    this.crowdMembers = []

    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true
      })
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
