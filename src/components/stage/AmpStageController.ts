import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './stageRenderUtils'
import { BaseStageController } from './BaseStageController'
import { getSafeRandom } from '../../utils/crypto'
import { clamp0to100, clampAmpDial } from '../../utils/gameState'
import type {
  StageControllerOptions,
  AmpStageOptions
} from '../../types/components'
import { AmpWaveManager } from './AmpWaveManager'

/**
 * Coordinates Amp stage rendering and lifecycle behavior.
 */
export class AmpStageController extends BaseStageController<AmpStageOptions> {
  waveManager: AmpWaveManager | null
  bg: PIXI.Graphics | null
  targetFreq: number
  currentFreq: number
  time: number
  isOverdriveActive: boolean
  isOverheat: boolean
  isAnomalyActive: boolean
  interference: number
  isHijackActive: boolean

  /**
   * Initializes the AmpStageController with the provided options.
   *
   * @param options - Configuration options for the stage controller.
   */
  constructor(options: StageControllerOptions<AmpStageOptions>) {
    super(options)

    this.waveManager = null
    this.bg = null
    this.targetFreq = 500
    this.currentFreq = 500
    this.time = 0
    this.isOverdriveActive = false
    this.isOverheat = false
    this.isAnomalyActive = false
    this.interference = 0
    this.isHijackActive = false
  }

  /**
   * Prepares the stage by creating the background graphic and initializing the wave manager.
   *
   * @remarks
   * This is called automatically after the Pixi application and container are created.
   * It also performs an initial state sync and render pass.
   */
  async setup() {
    if (!this.container || !this.app) return
    this.bg = new PIXI.Graphics()
    this.container.addChildAt(this.bg, 0)

    this.waveManager = new AmpWaveManager(this.container, this.app)

    this.syncState()
    this.drawBackground()
    this.renderWaves()
  }

  /**
   * Delegates the drawing of the amplifier waves to the wave manager.
   */
  private renderWaves() {
    this.waveManager?.drawWaves(
      this.targetFreq,
      this.currentFreq,
      this.time,
      this.isOverdriveActive,
      this.isOverheat,
      this.isAnomalyActive,
      this.interference,
      this.isHijackActive
    )
  }

  /**
   * Synchronizes the controller's internal state with the external game state reference.
   *
   * @remarks
   * Reads target frequency, current dial value, and various active effect flags
   * (overdrive, overheat, anomaly, hijack, interference) to drive rendering logic.
   */
  syncState() {
    if (this.gameStateRef && this.gameStateRef.current) {
      const state = this.gameStateRef.current
      if (Object.hasOwn(state, 'targetValue')) {
        const sanitizedTarget = Number(state.targetValue)
        if (Number.isFinite(sanitizedTarget)) {
          this.targetFreq = clampAmpDial(sanitizedTarget)
        }
      }
      if (Object.hasOwn(state, 'dialValue')) {
        const sanitizedCurrent = Number(state.dialValue)
        if (Number.isFinite(sanitizedCurrent)) {
          const boundedCurrentFreq = Math.max(
            0,
            Math.min(1000, sanitizedCurrent)
          )
          this.currentFreq = boundedCurrentFreq
        }
      }
      if (Object.hasOwn(state, 'isOverdriveActive')) {
        this.isOverdriveActive = Boolean(state.isOverdriveActive)
      }
      if (Object.hasOwn(state, 'isOverheat')) {
        this.isOverheat = Boolean(state.isOverheat)
      }
      if (Object.hasOwn(state, 'isAnomalyActive')) {
        this.isAnomalyActive = Boolean(state.isAnomalyActive)
      }
      if (Object.hasOwn(state, 'interference')) {
        const sanitizedInterference = Number(state.interference)
        if (Number.isFinite(sanitizedInterference)) {
          this.interference = clamp0to100(sanitizedInterference)
        }
      }
      if (Object.hasOwn(state, 'isHijackActive')) {
        this.isHijackActive = Boolean(state.isHijackActive)
      }
    }
  }

  /**
   * Clears and redraws the background graphic, applying visual tints based on active effects.
   */
  drawBackground() {
    if (!this.bg || !this.app) return
    this.bg.clear()

    // Slight red/yellow tint based on interference
    const tintValue =
      this.interference > 0 ? (this.interference / 100) * 0.2 : 0

    this.bg.rect(0, 0, this.app.screen.width, this.app.screen.height)
    this.bg.fill({ color: getPixiColorFromToken('--void-black'), alpha: 1 })

    if (tintValue > 0) {
      this.bg.rect(0, 0, this.app.screen.width, this.app.screen.height)
      this.bg.fill({
        color: getPixiColorFromToken('--blood-red'),
        alpha: tintValue
      })
    }
  }

  /**
   * Advances the stage's simulation by a given time step.
   *
   * @param dt - Delta time elapsed since the last update frame.
   */
  update(dt: number) {
    if (!this.container) return
    this.syncState()

    this.time += dt * 0.1
    this.drawBackground()

    // Apply jitter to the stage container based on interference
    if (this.interference > 0) {
      this.container.x = (getSafeRandom() - 0.5) * (this.interference / 10)
      this.container.y = (getSafeRandom() - 0.5) * (this.interference / 10)
    } else {
      this.container.x = 0
      this.container.y = 0
    }

    this.renderWaves()
  }

  /**
   * Redraws the stage geometry, including the background and wave visualization.
   */
  draw() {
    this.drawBackground()
    this.renderWaves()
  }

  /**
   * Cleans up Pixi resources specifically allocated by this controller.
   */
  dispose() {
    if (this.waveManager) {
      this.waveManager.dispose()
      this.waveManager = null
    }
    if (this.bg) {
      this.bg.destroy({ children: true })
      this.bg = null
    }
    super.dispose()
  }
}

/**
 * Creates an Amp stage controller instance.
 * @param params - Controller factory dependencies.
 * @returns An initialized stage controller ready to be attached to a Pixi application.
 */
export const createAmpStageController = (
  params: StageControllerOptions<AmpStageOptions>
) => new AmpStageController(params)
