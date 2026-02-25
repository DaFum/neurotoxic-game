import * as PIXI from 'pixi.js'
import { BaseStageController } from './stage/BaseStageController.js'
import { CrowdManager } from './stage/CrowdManager.js'
import { LaneManager } from './stage/LaneManager.js'
import { EffectManager } from './stage/EffectManager.js'
import { NoteManager } from './stage/NoteManager.js'
import { logger } from '../utils/logger.js'
import { getGigTimeMs } from '../utils/audioEngine.js'

/**
 * Manages Pixi.js stage lifecycle and rendering updates.
 */
class PixiStageController extends BaseStageController {
  /**
   * @param {object} params - Controller dependencies.
   */
  constructor(params) {
    super(params)
    this.colorMatrix = null
    this.stageContainer = null

    // Managers
    this.crowdManager = null
    this.laneManager = null
    this.effectManager = null
    this.noteManager = null

    this.toxicFilters = null
    this.emptyFilters = []
    this.isToxicActive = false
  }

  /**
   * Initializes the Pixi application and stage objects.
   * Called by BaseStageController.init().
   */
  async setup() {
    this.isToxicActive = false

    this.colorMatrix = new PIXI.ColorMatrixFilter()
    this.toxicFilters = [this.colorMatrix]
    this.stageContainer = this.container

    // Initialize Managers and start loading assets in parallel
    this.crowdManager = new CrowdManager(this.app, this.stageContainer)
    const crowdLoad = this.withTimeout(this.crowdManager.loadAssets(), 'Crowd Assets')

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
    const effectLoad = this.withTimeout(this.effectManager.loadAssets(), 'Effect Assets')

    this.noteManager = new NoteManager(
      this.app,
      rhythmContainer,
      this.gameStateRef,
      (x, y, color) => this.effectManager.spawnHitEffect(x, y, color)
    )
    const noteLoad = this.withTimeout(this.noteManager.loadAssets(), 'Note Assets')

    // Await all loads in parallel
    await Promise.all([crowdLoad, effectLoad, noteLoad])

    if (this.isDisposed) return

    // Initialize managers now that assets are loaded
    this.crowdManager.init()
    this.effectManager.init()
    this.noteManager.init()
  }

  /**
   * Wraps a promise with a timeout to prevent indefinite hanging.
   * @param {Promise} promise - The promise to wrap.
   * @param {string} label - Label for logging.
   * @returns {Promise} The wrapped promise.
   */
  async withTimeout(promise, label) {
    let timerId
    const timeout = new Promise((resolve) => {
      timerId = setTimeout(() => {
        logger.warn('PixiStageController', `${label} load timed out, proceeding with fallbacks.`)
        resolve(null)
      }, 10000)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId))
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
   * Called by BaseStageController.handleTicker().
   * @param {number} deltaMS - Time delta.
   */
  update(deltaMS) {
    // Defensive guards for async init or disposal race conditions
    if (
      !this.app ||
      this.isDisposed ||
      !this.stageContainer ||
      !this.laneManager ||
      !this.crowdManager ||
      !this.noteManager ||
      !this.effectManager ||
      !this.toxicFilters
    ) {
      return
    }

    const state = this.gameStateRef?.current

    if (!state || state.isGameOver) {
      return
    }

    const elapsed = getGigTimeMs()

    if (state.isToxicMode) {
      if (this.colorMatrix) {
        this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
      }
      if (!this.isToxicActive) {
        this.stageContainer.filters = this.toxicFilters
        this.isToxicActive = true
      }
    } else {
      if (this.isToxicActive) {
        this.stageContainer.filters = this.emptyFilters
        this.isToxicActive = false
      }
    }

    this.laneManager.update(state)
    this.crowdManager.update(
      state.combo ?? 0,
      state.isToxicMode ?? false,
      elapsed
    )
    this.noteManager.update(state, elapsed, this.laneManager.layout)
    this.effectManager.update(deltaMS)
  }

  /**
   * Disposes Pixi resources and removes the canvas.
   * @returns {void}
   */
  dispose() {
    this.noteManager?.dispose()
    this.effectManager?.dispose()
    this.laneManager?.dispose()
    this.crowdManager?.dispose()

    this.noteManager = null
    this.effectManager = null
    this.laneManager = null
    this.crowdManager = null

    // Clear filters from container explicitly to release the array references
    if (this.stageContainer) {
      this.stageContainer.filters = null
      this.stageContainer.removeChildren()
      this.stageContainer.destroy({ children: true })
      this.stageContainer = null
    }

    // Destroy color matrix filter to free GPU memory
    if (this.colorMatrix) {
      this.colorMatrix.destroy()
      this.colorMatrix = null
    }

    this.toxicFilters = null
    this.emptyFilters = null

    super.dispose()
  }
}

/**
 * Factory for PixiStageController instances.
 * @param {object} params - Controller dependencies.
 * @returns {PixiStageController} Controller instance.
 */
export const createPixiStageController = params =>
  new PixiStageController(params)
