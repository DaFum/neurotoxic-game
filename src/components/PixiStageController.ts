import type { Container } from 'pixi.js'
import { ToxicFilterManager } from './stage/ToxicFilterManager'
import { BaseStageController } from './stage/BaseStageController'
import { CrowdManager } from './stage/CrowdManager'
import { LaneManager } from './stage/LaneManager'
import { EffectManager } from './stage/EffectManager'
import { NoteManager } from './stage/NoteManager'
import { toneAudioEngine } from '../utils/audio/audioEngineInterface'
import type { IAudioEngine } from '../utils/audio/audioEngineInterface'
import { withTimeout } from './stage/stageRenderUtils'
import type { StageControllerOptions } from '../types/components'
import type { RhythmGameRefState } from '../types/rhythmGame'

/**
 * Manages Pixi.js stage lifecycle and rendering updates.
 *
 * @typeParam TState - Rhythm game ref state consumed by stage managers.
 */
class PixiStageController<
  TState extends RhythmGameRefState = RhythmGameRefState
> extends BaseStageController<TState> {
  /**
   * The root Pixi.js container housing all stage visuals.
   */
  stageContainer: Container | null

  /**
   * Manages the rendering and animations of the crowd audience.
   */
  crowdManager: CrowdManager | null

  /**
   * Manages rhythm lane layouts and lane-specific visuals.
   */
  laneManager: LaneManager | null

  /**
   * Spawns and manages transient visual effects (like hit sparks).
   */
  effectManager: EffectManager | null

  /**
   * Manages the lifecycle and rendering of rhythm notes scrolling down the lanes.
   */
  noteManager: NoteManager | null

  /**
   * Manages global post-processing filters, including the toxic visual effect.
   */
  toxicFilterManager: ToxicFilterManager | null

  /**
   * Gig-audio engine supplying the stage clock.
   */
  audioEngine: IAudioEngine

  /**
   * @param params - Controller dependencies.
   */
  constructor(params: StageControllerOptions<TState>) {
    super(params)
    this.audioEngine = params.audioEngine ?? toneAudioEngine
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
   *
   * @remarks Called by BaseStageController.init().
   * @returns A promise that resolves when setup completes.
   */
  async setup() {
    this._initFilters()
    const loadPromises = this._initManagersAndStartLoading()
    await Promise.all(loadPromises)
    this._finalizeInit()
  }

  /**
   * Initializes stage container and toxic filters.
   *
   * @returns Void.
   */
  _initFilters() {
    this.stageContainer = this.container
    this.toxicFilterManager = new ToxicFilterManager()
  }

  /**
   * Initializes managers and starts asset loading.
   * @returns Array of asset loading promises.
   */
  _initManagersAndStartLoading() {
    const app = this.app
    const stageContainer = this.stageContainer
    if (!app || !stageContainer) {
      return []
    }
    // Initialize Managers and start loading assets in parallel
    this.crowdManager = new CrowdManager(app, stageContainer)
    const crowdLoad = withTimeout(
      this.crowdManager.loadAssets(),
      'Crowd Assets'
    )

    this.laneManager = new LaneManager(app, stageContainer, this.gameStateRef)
    this.laneManager.init()

    // Rhythm container is needed for effects and notes.
    // LaneManager owns the rhythm container.
    const rhythmContainer = this.laneManager.container
    if (!rhythmContainer) {
      return [crowdLoad]
    }

    this.effectManager = new EffectManager(app, rhythmContainer)
    const effectLoad = withTimeout(
      this.effectManager.loadAssets(),
      'Effect Assets'
    )

    this.noteManager = new NoteManager(
      app,
      rhythmContainer,
      this.gameStateRef,
      (x: number, y: number, color: number) => {
        this.effectManager?.spawnHitEffect(x, y, color)
      }
    )
    const noteLoad = withTimeout(this.noteManager.loadAssets(), 'Note Assets')

    return [crowdLoad, effectLoad, noteLoad]
  }

  /**
   * Finalizes manager initialization after assets are loaded.
   *
   * @returns Void.
   */
  _finalizeInit() {
    if (this.isDisposed) return
    if (!this.crowdManager || !this.effectManager || !this.noteManager) return

    // Initialize managers now that assets are loaded
    this.crowdManager.init()
    this.effectManager.init()
    this.noteManager.init()
  }

  /**
   * Manually runs a single update frame, useful for testing without a real ticker.
   * @param deltaMS - Time delta in milliseconds.
   */
  manualUpdate(deltaMS: number) {
    if (!this.app || this.isDisposed) return
    this.handleTicker({ deltaMS })
  }

  /**
   * Handles ticker updates from Pixi.js.
   * Called by BaseStageController.handleTicker().
   * @param deltaMS - Time delta.
   */
  update(deltaMS: number) {
    if (
      !this.app ||
      this.isDisposed ||
      !this.stageContainer ||
      !this.laneManager ||
      !this.crowdManager ||
      !this.noteManager ||
      !this.effectManager ||
      !this.toxicFilterManager?.isReady()
    ) {
      return
    }

    const state = this.gameStateRef?.current

    if (!state || state.isGameOver) {
      return
    }

    const elapsed = this.audioEngine.getGigTimeMs()

    if (state.isCorruptionBurstActive) {
      // Deterministic small shake
      this.stageContainer.x = state.rng() * 10 - 5
      this.stageContainer.y = state.rng() * 10 - 5
    } else {
      this.stageContainer.x = 0
      this.stageContainer.y = 0
    }

    this.toxicFilterManager.update(state, elapsed, this.stageContainer)

    this.laneManager.update(state)
    this.crowdManager.update(
      state.combo ?? 0,
      state.isToxicMode ?? false,
      elapsed
    )
    const laneLayout = this.laneManager.layout
    if (!laneLayout) return
    this.noteManager.update(state, elapsed, laneLayout)
    this.effectManager.update(deltaMS)
  }

  /**
   * Disposes Pixi resources and removes the canvas.
   *
   * @returns Void.
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
 * Creates a rhythm-game Pixi stage controller for the shared React stage host.
 *
 * @typeParam TState - Rhythm game ref state consumed by the controller.
 * @param params - Container, state ref, and update callback used by the stage lifecycle.
 * @returns Controller instance owned by the caller until disposed.
 */
export const createPixiStageController = <
  TState extends RhythmGameRefState = RhythmGameRefState
>(
  params: StageControllerOptions<TState>
) => new PixiStageController<TState>(params)
