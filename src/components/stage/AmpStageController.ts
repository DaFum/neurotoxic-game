import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './stageRenderUtils'
import { BaseStageController } from './BaseStageController'
import type {
  StageControllerOptions,
  AmpStageOptions
} from '../../types/components'
import { AmpWaveManager } from './AmpWaveManager'

export class AmpStageController extends BaseStageController {
  waveManager: AmpWaveManager | null
  bg: PIXI.Graphics | null
  targetFreq: number
  currentFreq: number
  time: number
  isOverdriveActive: boolean
  isOverheat: boolean

  constructor(options: StageControllerOptions<AmpStageOptions>) {
    super(options)

    this.waveManager = null
    this.bg = null
    this.targetFreq = 500
    this.currentFreq = 500
    this.time = 0
    this.isOverdriveActive = false
    this.isOverheat = false
  }

  async setup() {
    this.bg = new PIXI.Graphics()
    this.container.addChildAt(this.bg, 0)

    this.waveManager = new AmpWaveManager(this.container, this.app)

    this.syncState()
    this.drawBackground()
    this.waveManager.drawWaves(this.targetFreq, this.currentFreq, this.time, this.isOverdriveActive, this.isOverheat)
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
    }
  }

  drawBackground() {
    if (!this.bg || !this.app) return
    this.bg.clear()
    this.bg.rect(0, 0, this.app.screen.width, this.app.screen.height)
    this.bg.fill({ color: getPixiColorFromToken('--void-black'), alpha: 1 })
  }

  update(dt: number) {
    this.syncState()

    this.time += dt * 0.1
    this.waveManager?.drawWaves(this.targetFreq, this.currentFreq, this.time, this.isOverdriveActive, this.isOverheat)
  }

  draw() {
    this.drawBackground()
    this.waveManager?.drawWaves(this.targetFreq, this.currentFreq, this.time, this.isOverdriveActive, this.isOverheat)
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
