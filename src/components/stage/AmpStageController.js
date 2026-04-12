import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './utils'
import { BaseStageController } from './BaseStageController'

export class AmpStageController extends BaseStageController {
  constructor(options) {
    super(options)

    this.waveGraphics = null
    this.targetFreq = 500
    this.currentFreq = 500
    this.time = 0
  }

  async setup() {
    this.waveGraphics = new PIXI.Graphics()
    this.container.addChild(this.waveGraphics)

    // Background
    const bg = new PIXI.Graphics()
    bg.rect(0, 0, this.app.screen.width, this.app.screen.height)
    bg.fill({ color: getPixiColorFromToken('--void-black'), alpha: 1 })
    this.container.addChildAt(bg, 0)

    this.drawWaves()
  }

  update(dt) {
    // Read state from gameStateRef directly
    if (this.gameStateRef && this.gameStateRef.current) {
      const state = this.gameStateRef.current
      if (state.targetValue !== undefined) {
        let sanitizedTarget = Number(state.targetValue)
        if (Number.isFinite(sanitizedTarget)) {
          this.targetFreq = Math.max(0, Math.min(1000, sanitizedTarget))
        }
      }
      if (state.dialValue !== undefined) {
        let sanitizedCurrent = Number(state.dialValue)
        if (Number.isFinite(sanitizedCurrent)) {
          this.currentFreq = Math.max(0, Math.min(1000, sanitizedCurrent))
        }
      }
    }

    this.time += dt * 0.1
    this.drawWaves()
  }

  drawWaves() {
    if (!this.waveGraphics || !this.app) return

    this.waveGraphics.clear()
    const width = this.app.screen.width
    const height = this.app.screen.height
    const centerY = height / 2

    // Draw Target Wave (Red-ish)
    this.waveGraphics.moveTo(0, centerY)
    this.waveGraphics.stroke({ width: 2, color: getPixiColorFromToken('--blood-red'), alpha: 0.5 })

    const targetPeriod = width / (this.targetFreq / 50 + 1)
    for (let x = 0; x < width; x += 5) {
      const y = centerY + Math.sin(x / targetPeriod + this.time) * 100
      this.waveGraphics.lineTo(x, y)
    }

    // Draw Current Wave (Green)
    this.waveGraphics.moveTo(0, centerY)
    this.waveGraphics.stroke({ width: 4, color: getPixiColorFromToken('--toxic-green'), alpha: 0.8 })

    const currentPeriod = width / (this.currentFreq / 50 + 1)
    for (let x = 0; x < width; x += 5) {
      const y = centerY + Math.sin(x / currentPeriod + this.time) * 100
      this.waveGraphics.lineTo(x, y)
    }
  }

  draw() {
    this.drawWaves()
  }
}

export const createAmpStageController = params => new AmpStageController(params)
