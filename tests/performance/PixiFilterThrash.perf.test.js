import { test, describe, beforeEach, afterEach, vi } from 'vitest'
import assert from 'node:assert/strict'

const { MockPIXI, createMockManager, mockAudioEngine, filterTracker } =
  vi.hoisted(() => {
    // Tracker for filter assignments
    const filterTracker = { count: 0 }

    // Define Mock Classes
    const MockPIXI = {
      Application: class {
        constructor() {
          this.canvas = 'canvas'
          this.stage = { addChild: vi.fn() }
          this.ticker = { add: vi.fn(), remove: vi.fn(), stop: vi.fn() }
        }
        init() {
          return Promise.resolve()
        }
        destroy() {}
      },
      Container: class {
        constructor() {
          this._filters = []
        }
        addChild() {}
        destroy() {}
        removeChildren() {}
        get filters() {
          return this._filters
        }
        set filters(v) {
          filterTracker.count++
          this._filters = v
        }
      },
      ColorMatrixFilter: class {
        destroy() {}
        hue() {}
      }
    }

    // Mock Managers (factory approach for fresh instances)
    const createMockManager = () => ({
      init: vi.fn(),
      loadAssets: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
      container: 'rhythmContainer',
      layout: 'layout'
    })

    const mockAudioEngine = {
      getGigTimeMs: vi.fn(() => 1234)
    }

    return { MockPIXI, createMockManager, mockAudioEngine, filterTracker }
  })

// Mock PIXI module
vi.mock('pixi.js', () => {
  return {
    ...MockPIXI,
    default: MockPIXI,
    Assets: {
      load: () => Promise.resolve(),
      unload: () => Promise.resolve()
    },
    ImageSource: class {
      constructor() {}
    },
    Texture: {
      WHITE: {},
      EMPTY: {}
    }
  }
})

vi.mock('../../src/components/stage/CrowdManager.js', () => ({
  CrowdManager: class {
    constructor() {
      Object.assign(this, createMockManager())
    }
  }
}))
vi.mock('../../src/components/stage/LaneManager.js', () => ({
  LaneManager: class {
    constructor() {
      Object.assign(this, createMockManager())
    }
  }
}))
vi.mock('../../src/components/stage/EffectManager.js', () => ({
  EffectManager: class {
    constructor() {
      Object.assign(this, createMockManager())
    }
  }
}))
vi.mock('../../src/components/stage/NoteManager.js', () => ({
  NoteManager: class {
    constructor() {
      Object.assign(this, createMockManager())
    }
  }
}))

vi.mock('../../src/utils/audioEngine.js', () => mockAudioEngine)

describe('PixiStageController Filter Performance', () => {
  let controller
  let gameStateRef
  let containerRef
  let updateRef
  let statsRef
  let createPixiStageController

  beforeEach(async () => {
    filterTracker.count = 0 // Reset counter

    globalThis.window = {
      devicePixelRatio: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    // Re-import to apply mocks
    const controllerModule =
      await import('../../src/components/PixiStageController.js')
    createPixiStageController = controllerModule.createPixiStageController

    containerRef = { current: { appendChild: vi.fn() } }
    gameStateRef = {
      current: {
        lanes: [],
        running: true,
        modifiers: {}
      }
    }
    updateRef = { current: vi.fn() }
    statsRef = { current: { combo: 10, isToxicMode: false } }

    controller = createPixiStageController({
      containerRef,
      gameStateRef,
      updateRef,
      statsRef
    })
    await controller.init()
  })

  afterEach(() => {
    delete globalThis.window
  })

  test('Optimization: Filters should only be assigned on state change', () => {
    const frames = 100

    // Run 100 frames with isToxicMode = false
    for (let i = 0; i < frames; i++) {
      controller.handleTicker({ deltaMS: 16 })
    }

    // Run 100 frames with isToxicMode = true
    statsRef.current.isToxicMode = true
    for (let i = 0; i < frames; i++) {
      controller.handleTicker({ deltaMS: 16 })
    }

    console.log(`Filter assignment count: ${filterTracker.count}`)

    // With optimization, this should be very low (e.g. 1-5).
    // Without optimization, it is > 200.
    assert.ok(
      filterTracker.count <= 5,
      `Expected <= 5 filter assignments, got ${filterTracker.count}`
    )
  })
})
