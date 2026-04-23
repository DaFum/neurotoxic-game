import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './utils'
import { AMP_CALIBRATION_TOLERANCE } from '../../context/gameConstants'

export class AmpWaveManager {
  container: any
  app: any
  waveGraphics: PIXI.Graphics | null

  constructor(container: any, app: any) {
    this.container = container
    this.app = app
    this.waveGraphics = new PIXI.Graphics()
    this.container.addChild(this.waveGraphics)
  }

  drawWaves(targetFreq: number, currentFreq: number, time: number) {
    if (!this.waveGraphics || !this.app || !this.app.screen) return

    this.waveGraphics.clear()

    const width = this.app.screen.width
    const height = this.app.screen.height

    if (width <= 0 || height <= 0) return

    const centerY = height / 2

    // Determine if frequencies match within tolerance
    const diff = Math.abs(targetFreq - currentFreq)
    const isMatching = diff <= AMP_CALIBRATION_TOLERANCE

    const targetColor = isMatching
      ? getPixiColorFromToken('--toxic-green')
      : getPixiColorFromToken('--blood-red')

    // Draw Target Wave
    const targetPeriod = width / (targetFreq / 50 + 1)
    const firstTargetY = centerY + Math.sin(0 / targetPeriod + time) * 100
    this.waveGraphics.moveTo(0, firstTargetY)

    for (let x = 5; x < width; x += 5) {
      const y = centerY + Math.sin(x / targetPeriod + time) * 100
      this.waveGraphics.lineTo(x, y)
    }
    this.waveGraphics.stroke({
      width: 2,
      color: targetColor,
      alpha: isMatching ? 0.8 : 0.5
    })

    // Draw Current Wave (Always Green)
    const currentPeriod = width / (currentFreq / 50 + 1)
    const firstCurrentY =
      centerY + Math.sin(0 / currentPeriod + time) * 100
    this.waveGraphics.moveTo(0, firstCurrentY)

    for (let x = 5; x < width; x += 5) {
      const y = centerY + Math.sin(x / currentPeriod + time) * 100
      this.waveGraphics.lineTo(x, y)
    }
    this.waveGraphics.stroke({
      width: 4,
      color: getPixiColorFromToken('--toxic-green'),
      alpha: 0.8
    })
  }

  dispose() {
    if (this.waveGraphics) {
      this.waveGraphics.destroy({ children: true })
      this.waveGraphics = null
    }
  }
}
