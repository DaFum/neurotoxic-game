import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAmpStageController } from '../../src/components/stage/AmpStageController'
import * as PIXI from 'pixi.js'

// Mock dependencies
vi.mock('pixi.js', () => {
  const mockGraphics = class {
    constructor() {
      this.clear = vi.fn()
      this.rect = vi.fn()
      this.fill = vi.fn()
      this.moveTo = vi.fn()
      this.stroke = vi.fn()
      this.lineTo = vi.fn()
      this.destroy = vi.fn()
    }
  }

  return {
    Application: class {
      constructor() {
        this.stage = { addChild: vi.fn() }
        this.ticker = { add: vi.fn(), remove: vi.fn() }
        this.screen = { width: 800, height: 600 }
        this.canvas = document.createElement('canvas')
      }
      init() {
        return Promise.resolve()
      }
      destroy() {}
    },
    Container: class {
      addChild() {}
      addChildAt() {}
      destroy() {}
    },
    Graphics: mockGraphics
  }
})

vi.mock('../../src/components/stage/utils', () => ({
  getPixiColorFromToken: vi.fn(() => 0x000000),
  getOptimalResolution: vi.fn(() => 1)
}))

vi.mock('../../src/components/stage/pixiAppTeardown', () => ({
  destroyPixiApp: vi.fn()
}))

vi.mock('../../src/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}))

describe('AmpStageController', () => {
  let controller
  let gameStateRef
  let containerRef
  let updateRef

  beforeEach(() => {
    gameStateRef = {
      current: { dialValue: 500, targetValue: 600 }
    }
    containerRef = {
      current: document.createElement('div')
    }
    updateRef = { current: vi.fn() }

    controller = createAmpStageController({
      containerRef,
      gameStateRef,
      updateRef
    })
  })

  afterEach(() => {
    if (controller) {
      controller.dispose()
    }
    vi.clearAllMocks()
  })

  it('setup initializes bg and waveGraphics', async () => {
    await controller.init()

    expect(controller.bg).toBeInstanceOf(PIXI.Graphics)
    expect(controller.waveGraphics).toBeInstanceOf(PIXI.Graphics)
  })

  it('update applies sanitized values and draws waves', async () => {
    await controller.init()

    expect(controller.targetFreq).toBe(600) // Initial sync inside setup reads the gameStateRef

    controller.handleTicker({ deltaMS: 16 })

    expect(controller.currentFreq).toBe(500)
    expect(controller.targetFreq).toBe(600)

    gameStateRef.current.dialValue = 1500
    gameStateRef.current.targetValue = -500

    controller.handleTicker({ deltaMS: 16 })

    expect(controller.currentFreq).toBe(1000)
    expect(controller.targetFreq).toBe(0)

    gameStateRef.current.dialValue = NaN
    controller.handleTicker({ deltaMS: 16 })
    expect(controller.currentFreq).toBe(1000)
  })

  it('dispose destroys bg and waveGraphics and calls super', async () => {
    await controller.init()

    const bgDestroySpy = vi.spyOn(controller.bg, 'destroy')
    const waveDestroySpy = vi.spyOn(controller.waveGraphics, 'destroy')

    controller.dispose()

    expect(bgDestroySpy).toHaveBeenCalledTimes(1)
    expect(waveDestroySpy).toHaveBeenCalledTimes(1)

    expect(controller.bg).toBeNull()
    expect(controller.waveGraphics).toBeNull()
    expect(controller.isDisposed).toBe(true)
  })
})
