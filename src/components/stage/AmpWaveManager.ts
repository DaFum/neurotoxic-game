import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './stageRenderUtils'
import { AMP_CALIBRATION_TOLERANCE } from '../../context/gameConstants'
import { getSafeRandom } from '../../utils/crypto'

/**
 * Manages Amp Wave rendering resources and state.
 */
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
    amplitude: number,
    jitter: number,
    strokeOptions: PIXI.StrokeStyle
  ) {
    if (!this.waveGraphics) return

    const firstY =
      centerY +
      Math.sin(0 / period + time) * amplitude +
      (jitter !== 0 ? (getSafeRandom() - 0.5) * jitter : 0)
    this.waveGraphics.moveTo(0, firstY)

    for (let x = 5; x < width; x += 5) {
      const y =
        centerY +
        Math.sin(x / period + time) * amplitude +
        (jitter !== 0 ? (getSafeRandom() - 0.5) * jitter : 0)
      this.waveGraphics.lineTo(x, y)
    }

    this.waveGraphics.stroke(strokeOptions)
  }

  drawWaves(
    targetFreq: number,
    currentFreq: number,
    time: number,
    isOverdriveActive: boolean = false,
    isOverheat: boolean = false,
    isAnomalyActive: boolean = false,
    interference: number = 0,
    isHijackActive: boolean = false
  ) {
    if (!this.waveGraphics || !this.app || !this.app.screen) return

    this.waveGraphics.clear()

    const width = this.app.screen.width
    const height = this.app.screen.height

    if (width <= 0 || height <= 0) return

    const centerY = height / 2

    // Determine if frequencies match within tolerance
    const diff = Math.abs(targetFreq - currentFreq)
    const isMatching = diff <= AMP_CALIBRATION_TOLERANCE

    const targetColor = isAnomalyActive
      ? getPixiColorFromToken('--electric-blue')
      : isMatching
        ? getPixiColorFromToken('--toxic-green')
        : getPixiColorFromToken('--blood-red')

    // Draw Target Wave
    const targetPeriod = width / (targetFreq / 50 + 1)
    let targetAmplitude = 100
    let targetJitter = 0
    let finalTargetColor = targetColor

    if (isOverheat) {
      targetAmplitude = 150
      targetJitter = 40
    } else if (isAnomalyActive) {
      targetAmplitude = 200
      targetJitter = 50
    }

    if (isHijackActive) {
      targetAmplitude = 300
      targetJitter = 100
      finalTargetColor = getPixiColorFromToken('--blood-red')
    }

    if (interference > 0 && getSafeRandom() < interference / 200) {
      targetJitter += interference
      if (!isHijackActive)
        finalTargetColor = getPixiColorFromToken('--warning-yellow')
    }

    this.drawSineWave(
      width,
      centerY,
      targetPeriod,
      time,
      targetAmplitude,
      targetJitter,
      {
        width: isAnomalyActive ? 6 : isOverheat ? 4 : 2,
        color: finalTargetColor,
        alpha: isAnomalyActive ? 1.0 : isMatching ? 0.8 : isOverheat ? 0.9 : 0.5
      }
    )

    // Draw Current Wave
    const currentPeriod = width / (currentFreq / 50 + 1)
    let currentAmplitude = 100
    let currentJitter = 0
    let currentColor = getPixiColorFromToken('--toxic-green')
    let currentWidth = 4

    if (isOverheat) {
      currentColor = getPixiColorFromToken('--blood-red')
      currentAmplitude = 120
      currentJitter = 60
      currentWidth = 6
    } else if (isAnomalyActive) {
      currentColor = getPixiColorFromToken('--electric-blue')
      currentAmplitude = 250
      currentJitter = 25
      currentWidth = 10
    } else if (isOverdriveActive) {
      currentColor = getPixiColorFromToken('--warning-yellow')
      currentAmplitude = 180
      currentJitter = 10
      currentWidth = 8
    }

    if (isHijackActive) {
      currentColor = getPixiColorFromToken('--warning-yellow')
      currentAmplitude = 50
      currentJitter = 200
      currentWidth = 12
    }

    this.drawSineWave(
      width,
      centerY,
      currentPeriod,
      time,
      currentAmplitude,
      currentJitter,
      {
        width: currentWidth,
        color: currentColor,
        alpha: 0.8
      }
    )
  }

  dispose() {
    if (this.waveGraphics) {
      this.waveGraphics.destroy({ children: true })
      this.waveGraphics = null
    }
  }
}
