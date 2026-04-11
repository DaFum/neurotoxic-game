import * as PIXI from 'pixi.js'
import { getPixiColorFromToken } from './utils'

export const createAmpStageController = () => {
  let app = null
  let container = null
  let waveGraphics = null

  // State
  let targetFreq = 500
  let currentFreq = 500
  let time = 0

  const init = async pixiApp => {
    app = pixiApp
    container = new PIXI.Container()
    app.stage.addChild(container)

    waveGraphics = new PIXI.Graphics()
    container.addChild(waveGraphics)

    // Background
    const bg = new PIXI.Graphics()
    bg.rect(0, 0, app.screen.width, app.screen.height)
    bg.fill({ color: getPixiColorFromToken('void-black'), alpha: 1 })
    container.addChildAt(bg, 0)

    // Initial draw
    drawWaves()
  }

  const updateState = newState => {
    if (newState.targetValue !== undefined) {
      targetFreq = newState.targetValue
    }
    if (newState.dialValue !== undefined) {
      currentFreq = newState.dialValue
    }
  }

  const drawWaves = () => {
    if (!waveGraphics || !app) return

    waveGraphics.clear()
    const width = app.screen.width
    const height = app.screen.height
    const centerY = height / 2

    // Draw Target Wave (Red-ish)
    waveGraphics.moveTo(0, centerY)
    waveGraphics.stroke({ width: 2, color: getPixiColorFromToken('blood-red'), alpha: 0.5 })

    const targetPeriod = width / (targetFreq / 50 + 1)
    for (let x = 0; x < width; x += 5) {
      const y = centerY + Math.sin(x / targetPeriod + time) * 100
      waveGraphics.lineTo(x, y)
    }

    // Draw Current Wave (Green)
    waveGraphics.moveTo(0, centerY)
    waveGraphics.stroke({ width: 4, color: getPixiColorFromToken('toxic-green'), alpha: 0.8 })

    const currentPeriod = width / (currentFreq / 50 + 1)
    for (let x = 0; x < width; x += 5) {
      const y = centerY + Math.sin(x / currentPeriod + time) * 100
      waveGraphics.lineTo(x, y)
    }
  }

  const tick = delta => {
    time += delta * 0.1
    drawWaves()
  }

  const cleanup = () => {
    if (container && !container.destroyed) {
      container.destroy({ children: true })
    }
    app = null
  }

  return { init, updateState, tick, cleanup }
}
