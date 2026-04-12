import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './utils'
import { BaseStageController } from './BaseStageController'
import { AMP_CALIBRATION_TOLERANCE } from '../../context/gameConstants'

export class AmpStageController extends BaseStageController {
  constructor(options) {
    super(options)

    this.waveGraphics = null
    this.bg = null
    this.targetFreq = 500
    this.currentFreq = 500
    this.time = 0
  }

  async setup() {
    this.bg = new PIXI.Graphics()
    this.container.addChildAt(this.bg, 0)

    this.waveGraphics = new PIXI.Graphics()
    this.container.addChild(this.waveGraphics)

    this.syncState()
    this.drawBackground()
    this.drawWaves()
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
          const boundedCurrentFreq = Math.max(0, Math.min(1000, sanitizedCurrent))
          this.currentFreq = boundedCurrentFreq
        }
      }
    }
  }

  drawBackground() {
    if (!this.bg || !this.app) return
    this.bg.clear()
    this.bg.rect(0, 0, this.app.screen.width, this.app.screen.height)
    this.bg.fill({ color: getPixiColorFromToken('--void-black'), alpha: 1 })
  }

  update(dt) {
    this.syncState()

    this.time += dt * 0.1
    this.drawWaves()
  }

  drawWaves() {
    if (!this.waveGraphics || !this.app || !this.app.screen) return

    this.waveGraphics.clear()

    const width = this.app.screen.width
    const height = this.app.screen.height

    if (width <= 0 || height <= 0) return

    const centerY = height / 2

    // Determine if frequencies match within tolerance
    const diff = Math.abs(this.targetFreq - this.currentFreq)
    const isMatching = diff <= AMP_CALIBRATION_TOLERANCE

    const targetColor = isMatching
      ? getPixiColorFromToken('--toxic-green')
      : getPixiColorFromToken('--blood-red')

    // Draw Target Wave
    const targetPeriod = width / (this.targetFreq / 50 + 1)
    const firstTargetY = centerY + Math.sin(0 / targetPeriod + this.time) * 100
    this.waveGraphics.moveTo(0, firstTargetY)

    for (let x = 5; x < width; x += 5) {
      const y = centerY + Math.sin(x / targetPeriod + this.time) * 100
      this.waveGraphics.lineTo(x, y)
    }
    this.waveGraphics.stroke({ width: 2, color: targetColor, alpha: isMatching ? 0.8 : 0.5 })

    // Draw Current Wave (Always Green)
    const currentPeriod = width / (this.currentFreq / 50 + 1)
    const firstCurrentY = centerY + Math.sin(0 / currentPeriod + this.time) * 100
    this.waveGraphics.moveTo(0, firstCurrentY)

    for (let x = 5; x < width; x += 5) {
      const y = centerY + Math.sin(x / currentPeriod + this.time) * 100
      this.waveGraphics.lineTo(x, y)
    }
    this.waveGraphics.stroke({ width: 4, color: getPixiColorFromToken('--toxic-green'), alpha: 0.8 })
  }

  draw() {
    this.drawBackground()
    this.drawWaves()
  }

  dispose() {
    if (this.waveGraphics) {
      this.waveGraphics.destroy({ children: true })
      this.waveGraphics = null
    }
    if (this.bg) {
      this.bg.destroy({ children: true })
      this.bg = null
    }
    super.dispose()
  }
}

export const createAmpStageController = params => new AmpStageController(params)
