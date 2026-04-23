import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './utils'
import { AMP_CALIBRATION_TOLERANCE } from '../../context/gameConstants'

export class AmpWaveManager {
  private app: PIXI.Application
  waveGraphics: PIXI.Graphics | null

  constructor(container: PIXI.Container, app: PIXI.Application) {
    this.app = app
    this.waveGraphics = new PIXI.Graphics()
    container.addChild(this.waveGraphics)
  }

  private drawSineWave(
    width: number,
    centerY: number,
    period: number,
    time: number,
    strokeOptions: PIXI.StrokeStyle
  ) {
    if (!this.waveGraphics) return

    const firstY = centerY + Math.sin(0 / period + time) * 100
    this.waveGraphics.moveTo(0, firstY)

    for (let x = 5; x < width; x += 5) {
      const y = centerY + Math.sin(x / period + time) * 100
      this.waveGraphics.lineTo(x, y)
    }

    this.waveGraphics.stroke(strokeOptions)
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
    this.drawSineWave(width, centerY, targetPeriod, time, {
      width: 2,
      color: targetColor,
      alpha: isMatching ? 0.8 : 0.5
    })

    // Draw Current Wave (Always Green)
    const currentPeriod = width / (currentFreq / 50 + 1)
    this.drawSineWave(width, centerY, currentPeriod, time, {
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
