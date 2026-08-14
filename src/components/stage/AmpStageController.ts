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

      const readNum = (key: string, clampFn: (val: number) => number) => {
        if (Object.hasOwn(state, key)) {
          const val = Number((state as unknown as Record<string, unknown>)[key])
          if (Number.isFinite(val)) return clampFn(val)
        }
        return undefined
      }

      const readBool = (key: string) => {
        if (Object.hasOwn(state, key)) {
          return Boolean((state as unknown as Record<string, unknown>)[key])
        }
        return undefined
      }

      const target = readNum('targetValue', clampAmpDial)
      if (target !== undefined) this.targetFreq = target

      const current = readNum('dialValue', clampAmpDial)
      if (current !== undefined) this.currentFreq = current

      const overdrive = readBool('isOverdriveActive')
      if (overdrive !== undefined) this.isOverdriveActive = overdrive

      const overheat = readBool('isOverheat')
      if (overheat !== undefined) this.isOverheat = overheat

      const anomaly = readBool('isAnomalyActive')
      if (anomaly !== undefined) this.isAnomalyActive = anomaly

      const int = readNum('interference', clamp0to100)
      if (int !== undefined) this.interference = int

      const hijack = readBool('isHijackActive')
      if (hijack !== undefined) this.isHijackActive = hijack
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
