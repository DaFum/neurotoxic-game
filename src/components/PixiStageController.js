/*
 * (#1) Actual Updates: Extracted withTimeout utility to utils.js.
 * (#2) Next Steps: Continue monitoring class size.
 * (#3) Found Errors + Solutions: None.
 */
import { ColorMatrixFilter } from 'pixi.js'
import { BaseStageController } from './stage/BaseStageController.js'
import { CrowdManager } from './stage/CrowdManager.js'
import { LaneManager } from './stage/LaneManager.js'
import { EffectManager } from './stage/EffectManager.js'
import { NoteManager } from './stage/NoteManager.js'
import { logger } from '../utils/logger.js'
import { getGigTimeMs } from '../utils/audioEngine.js'
import { withTimeout } from './stage/utils.js'

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
    this.isToxicActive = false
  }

  /**
   * Initializes the Pixi application and stage objects.
   * Called by BaseStageController.init().
   */
  async setup() {
    this._initFilters()
    const loadPromises = this._initManagersAndStartLoading()
    await Promise.all(loadPromises)
    this._finalizeInit()
  }

  /**
   * Initializes filters and stage containers.
   * @private
   */
  _initFilters() {
    this.isToxicActive = false
    this.colorMatrix = new ColorMatrixFilter()
    this.toxicFilters = [this.colorMatrix]
    this.stageContainer = this.container
  }

  /**
   * Initializes managers and starts asset loading.
   * @returns {Promise[]} Array of asset loading promises.
   * @private
   */
  _initManagersAndStartLoading() {
    // Initialize Managers and start loading assets in parallel
    this.crowdManager = new CrowdManager(this.app, this.stageContainer)
    const crowdLoad = withTimeout(
      this.crowdManager.loadAssets(),
      'Crowd Assets'
    )

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
    const effectLoad = withTimeout(
      this.effectManager.loadAssets(),
      'Effect Assets'
    )

    this.noteManager = new NoteManager(
      this.app,
      rhythmContainer,
      this.gameStateRef,
      (x, y, color) => this.effectManager.spawnHitEffect(x, y, color)
    )
    const noteLoad = withTimeout(
      this.noteManager.loadAssets(),
      'Note Assets'
    )

    return [crowdLoad, effectLoad, noteLoad]
  }

  /**
   * Finalizes manager initialization after assets are loaded.
   * @private
   */
  _finalizeInit() {
    if (this.isDisposed) return

    // Initialize managers now that assets are loaded
    this.crowdManager.init()
    this.effectManager.init()
    this.noteManager.init()
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
    if (!this._canUpdate()) {
      return
    }

    const state = this.gameStateRef?.current

    if (!state || state.isGameOver) {
      return
    }

    const elapsed = getGigTimeMs()

    this._updateToxicMode(state, elapsed)

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
   * Checks if the controller is ready to update.
   * @returns {boolean} True if ready to update.
   * @private
   */
  _canUpdate() {
    return !!(
      this.app &&
      !this.isDisposed &&
      this.stageContainer &&
      this.laneManager &&
      this.crowdManager &&
      this.noteManager &&
      this.effectManager &&
      this.toxicFilters
    )
  }

  /**
   * Updates toxic mode filter effects based on game state.
   * @param {object} state - The game state.
   * @param {number} elapsed - The elapsed gig time.
   * @private
   */
  _updateToxicMode(state, elapsed) {
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
        this.stageContainer.filters = null
        this.isToxicActive = false
      }
    }
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
