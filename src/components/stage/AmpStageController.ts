import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './stageRenderUtils'
import { BaseStageController } from './BaseStageController'
import { getSafeRandom } from '../../utils/crypto'
import type {
  StageControllerOptions,
  AmpStageOptions
} from '../../types/components'
import { AmpWaveManager } from './AmpWaveManager'
import { getSafeRandom } from '../../utils/crypto'

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

  async setup() {
    if (!this.container || !this.app) return
    this.bg = new PIXI.Graphics()
    this.container.addChildAt(this.bg, 0)

    this.waveManager = new AmpWaveManager(this.container, this.app)

    this.syncState()
    this.drawBackground()
    this.waveManager.drawWaves(
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

  syncState() {
    if (this.gameStateRef && this.gameStateRef.current) {
      const state = this.gameStateRef.current
      if (Object.hasOwn(state, 'targetValue')) {
        const sanitizedTarget = Number(state.targetValue)
        if (Number.isFinite(sanitizedTarget)) {
          const boundedTargetFreq = Math.max(0, Math.min(1000, sanitizedTarget))
          this.targetFreq = boundedTargetFreq
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
          this.interference = Math.max(0, Math.min(100, sanitizedInterference))
        }
      }
      if (Object.hasOwn(state, 'isHijackActive')) {
        this.isHijackActive = Boolean(state.isHijackActive)
      }
    }
  }

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

  draw() {
    this.drawBackground()
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

export const createAmpStageController = (
  params: StageControllerOptions<AmpStageOptions>
) => new AmpStageController(params)
