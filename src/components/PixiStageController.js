import * as PIXI from 'pixi.js'
import { CrowdManager } from './stage/CrowdManager.js'
import { LaneManager } from './stage/LaneManager.js'
import { EffectManager } from './stage/EffectManager.js'
import { NoteManager } from './stage/NoteManager.js'
import { logger } from '../utils/logger.js'
import { getGigTimeMs } from '../utils/audioEngine.js'

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

    // Managers
    this.crowdManager = null
    this.laneManager = null
    this.effectManager = null
    this.noteManager = null

    this.isDisposed = false
    this.initPromise = null
    this.handleTicker = this.handleTicker.bind(this)

    this.toxicFilters = null
    this.emptyFilters = []
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
          this.initPromise = null
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
        this.toxicFilters = [this.colorMatrix]
        this.stageContainer = new PIXI.Container()
        this.app.stage.addChild(this.stageContainer)

        // Initialize Managers
        this.crowdManager = new CrowdManager(this.app, this.stageContainer)
        await this.crowdManager.loadAssets()
        this.crowdManager.init()

        this.laneManager = new LaneManager(
          this.app,
          this.stageContainer,
          this.gameStateRef
        )
        this.laneManager.init()

        // Rhythm container is needed for effects and notes.
        // LaneManager owns the rhythm container.
        const rhythmContainer = this.laneManager.container

        this.effectManager = new EffectManager(this.app, rhythmContainer)
        await this.effectManager.loadAssets()
        this.effectManager.init()

        this.noteManager = new NoteManager(
          this.app,
          rhythmContainer,
          this.gameStateRef,
          (x, y, color) => this.effectManager.spawnHitEffect(x, y, color)
        )
        this.noteManager.init()

        await this.noteManager.loadAssets()

        if (this.isDisposed) {
          this.dispose()
          return
        }

        this.app.ticker.add(this.handleTicker)
      } catch (error) {
        logger.error(
          'PixiStageController',
          'Failed to initialize stage.',
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
   * Handles ticker updates from Pixi.js.
   * @param {PIXI.Ticker} ticker - Pixi ticker instance.
   * @returns {void}
   */
  handleTicker(ticker) {
    if (this.isDisposed) return

    if (this.updateRef.current) {
      this.updateRef.current(ticker.deltaMS)
    }

    const state = this.gameStateRef.current
    const stats = this.statsRef.current

    if (state.isGameOver) {
      return
    }

    const elapsed = getGigTimeMs()

    if (stats?.isToxicMode) {
      this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
      this.stageContainer.filters = this.toxicFilters
    } else {
      this.stageContainer.filters = this.emptyFilters
    }

    this.laneManager.update(state)
    this.crowdManager.update(
      stats?.combo ?? 0,
      stats?.isToxicMode ?? false,
      elapsed
    )
    this.noteManager.update(state, elapsed, this.laneManager.layout)
    this.effectManager.update(ticker.deltaMS)
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

    this.noteManager?.dispose()
    this.effectManager?.dispose()
    this.laneManager?.dispose()
    this.crowdManager?.dispose()

    this.noteManager = null
    this.effectManager = null
    this.laneManager = null
    this.crowdManager = null

    // Destroy color matrix filter to free GPU memory
    if (this.colorMatrix) {
      this.colorMatrix.destroy()
      this.colorMatrix = null
    }

    if (this.app) {
      try {
        if (this.app.renderer || this.app.stage) {
          this.app.destroy(true, {
            children: true,
            texture: true,
            textureSource: true
          })
        }
      } catch (e) {
        logger.warn('PixiStageController', 'Pixi App destroy failed', e)
      }
      this.app = null
    }

    if (this.containerRef?.current) {
      this.containerRef.current.textContent = ''
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
