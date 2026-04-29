/*
 * (#1) Actual Updates: Extracted withTimeout utility to utils.js.
 * (#2) Next Steps: Continue monitoring class size.
 * (#3) Found Errors + Solutions: None.
 */
import type { Container } from 'pixi.js'
import { ToxicFilterManager } from './stage/ToxicFilterManager'
import { BaseStageController } from './stage/BaseStageController'
import { CrowdManager } from './stage/CrowdManager'
import { LaneManager } from './stage/LaneManager'
import { EffectManager } from './stage/EffectManager'
import { NoteManager } from './stage/NoteManager'
import { getGigTimeMs } from '../utils/audio/audioEngine'
import { withTimeout } from './stage/utils'
import type { StageControllerOptions } from '../types/components'
import type { RhythmGameRefState } from '../types/rhythmGame'

/**
 * Manages Pixi.js stage lifecycle and rendering updates.
 */
class PixiStageController extends BaseStageController<RhythmGameRefState> {
  // Getters and Setters for backward compatibility with existing tests
  get colorMatrix() {
    return this.toxicFilterManager?.colorMatrix ?? null
  }

  set colorMatrix(value) {
    if (this.toxicFilterManager) {
      this.toxicFilterManager.colorMatrix = value
    }
  }

  get toxicFilters() {
    return this.toxicFilterManager?.toxicFilters ?? null
  }

  set toxicFilters(value) {
    if (this.toxicFilterManager) {
      this.toxicFilterManager.toxicFilters = value
    }
  }

  get isToxicActive() {
    return this.toxicFilterManager?.isToxicActive ?? false
  }

  set isToxicActive(value) {
    if (this.toxicFilterManager) {
      this.toxicFilterManager.isToxicActive = value
    }
  }
  stageContainer: Container | null
  crowdManager: CrowdManager | null
  laneManager: LaneManager | null
  effectManager: EffectManager | null
  noteManager: NoteManager | null
  toxicFilterManager: ToxicFilterManager | null

  /**
   * @param {object} params - Controller dependencies.
   */
  constructor(params: StageControllerOptions<RhythmGameRefState>) {
    super(params)
    this.stageContainer = null

    // Managers
    this.crowdManager = null
    this.laneManager = null
    this.effectManager = null
    this.noteManager = null
    this.toxicFilterManager = null
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
   * Initializes stage container and toxic filters.
   * @private
   */
  _initFilters() {
    this.stageContainer = this.container
    this.toxicFilterManager = new ToxicFilterManager()
  }

  /**
   * Initializes managers and starts asset loading.
   * @returns {Promise[]} Array of asset loading promises.
   * @private
   */
  _initManagersAndStartLoading() {
    // Initialize Managers and start loading assets in parallel
    this.crowdManager = new CrowdManager(this.app!, this.stageContainer)
    const crowdLoad = withTimeout(
      this.crowdManager.loadAssets(),
      'Crowd Assets'
    )

    this.laneManager = new LaneManager(
      this.app!,
      this.stageContainer,
      this.gameStateRef
    )
    this.laneManager.init()

    // Rhythm container is needed for effects and notes.
    // LaneManager owns the rhythm container.
    const rhythmContainer = this.laneManager.container

    this.effectManager = new EffectManager(this.app!, rhythmContainer)
    const effectLoad = withTimeout(
      this.effectManager.loadAssets(),
      'Effect Assets'
    )

    this.noteManager = new NoteManager(
      this.app!,
      rhythmContainer,
      this.gameStateRef,
      (x: number, y: number, color: number) =>
        this.effectManager.spawnHitEffect(x, y, color)
    )
    const noteLoad = withTimeout(this.noteManager.loadAssets(), 'Note Assets')

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
  manualUpdate(deltaMS: number) {
    if (!this.app || this.isDisposed) return
    // @ts-expect-error PIXI ticker payload includes deltaMS; shape matches runtime use in handleTicker.
    this.handleTicker({ deltaMS })
  }

  /**
   * Handles ticker updates from Pixi.js.
   * Called by BaseStageController.handleTicker().
   * @param {number} deltaMS - Time delta.
   */
  update(deltaMS: number) {
    if (!this._canUpdate()) {
      return
    }

    const state = this.gameStateRef?.current

    if (!state || state.isGameOver) {
      return
    }
    const stageContainer = this.stageContainer
    if (!stageContainer) {
      return
    }
    const toxic = this.toxicFilterManager
    if (!toxic) {
      return
    }

    const elapsed = getGigTimeMs()

    toxic.update(state, elapsed, stageContainer)

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
      this.toxicFilterManager &&
      this.toxicFilterManager.isReady()
    )
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
    this.toxicFilterManager?.dispose()

    this.noteManager = null
    this.effectManager = null
    this.laneManager = null
    this.crowdManager = null
    this.toxicFilterManager = null

    if (this.stageContainer) {
      this.stageContainer.filters = null
      this.stageContainer.destroy({ children: true })
      this.stageContainer = null
    }

    super.dispose()
  }
}

/**
 * Factory for PixiStageController instances.
 * @param {object} params - Controller dependencies.
 * @returns {PixiStageController} Controller instance.
 */
export const createPixiStageController = (
  params: StageControllerOptions<RhythmGameRefState>
) => new PixiStageController(params)
