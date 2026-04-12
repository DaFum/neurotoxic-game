import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './utils'
import { BaseStageController } from './BaseStageController'

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

    this.drawBackground()
    this.drawWaves()
  }

  drawBackground() {
    if (!this.bg || !this.app) return
    this.bg.clear()
    this.bg.rect(0, 0, this.app.screen.width, this.app.screen.height)
    this.bg.fill({ color: getPixiColorFromToken('--void-black'), alpha: 1 })
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

    const targetPeriod = width / (this.targetFreq / 50 + 1)
    for (let x = 0; x < width; x += 5) {
      const y = centerY + Math.sin(x / targetPeriod + this.time) * 100
      this.waveGraphics.lineTo(x, y)
    }
    this.waveGraphics.stroke({ width: 2, color: getPixiColorFromToken('--blood-red'), alpha: 0.5 })

    // Draw Current Wave (Green)
    this.waveGraphics.moveTo(0, centerY)

    const currentPeriod = width / (this.currentFreq / 50 + 1)
    for (let x = 0; x < width; x += 5) {
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
      this.waveGraphics.destroy()
      this.waveGraphics = null
    }
    if (this.bg) {
      this.bg.destroy()
      this.bg = null
    }
    super.dispose()
  }
}

export const createAmpStageController = params => new AmpStageController(params)
