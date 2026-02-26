import { test, mock, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// Counter for filter assignments
let filterSetCount = 0

// Define Mock Classes
const MockPIXI = {
  Application: class {
    constructor() {
      this.canvas = 'canvas'
      this.stage = { addChild: mock.fn() }
      this.ticker = { add: mock.fn(), remove: mock.fn(), stop: mock.fn() }
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
      filterSetCount++
      this._filters = v
    }
  },
  ColorMatrixFilter: class {
    destroy() {}
    hue() {}
  }
}

// Mock PIXI module
mock.module('pixi.js', {
  defaultExport: MockPIXI,
  namedExports: MockPIXI
})

// Mock Managers (factory approach for fresh instances)
const createMockManager = () => ({
  init: mock.fn(),
  loadAssets: mock.fn(),
  update: mock.fn(),
  dispose: mock.fn(),
  container: 'rhythmContainer',
  layout: 'layout'
})

mock.module('../../src/components/stage/CrowdManager.js', {
  namedExports: {
    CrowdManager: class {
      constructor() {
        Object.assign(this, createMockManager())
      }
    }
  }
})
mock.module('../../src/components/stage/LaneManager.js', {
  namedExports: {
    LaneManager: class {
      constructor() {
        Object.assign(this, createMockManager())
      }
    }
  }
})
mock.module('../../src/components/stage/EffectManager.js', {
  namedExports: {
    EffectManager: class {
      constructor() {
        Object.assign(this, createMockManager())
      }
    }
  }
})
mock.module('../../src/components/stage/NoteManager.js', {
  namedExports: {
    NoteManager: class {
      constructor() {
        Object.assign(this, createMockManager())
      }
    }
  }
})

const mockAudioEngine = {
  getGigTimeMs: mock.fn(() => 1234)
}

mock.module('../../src/utils/audioEngine.js', {
  namedExports: mockAudioEngine
})

describe('PixiStageController Filter Performance', () => {
  let controller
  let gameStateRef
  let containerRef
  let updateRef
  let statsRef
  let createPixiStageController

  beforeEach(async () => {
    filterSetCount = 0 // Reset counter

    globalThis.window = {
      devicePixelRatio: 1,
      addEventListener: mock.fn(),
      removeEventListener: mock.fn()
    }

    // Re-import to apply mocks
    const controllerModule =
      await import('../../src/components/PixiStageController.js')
    createPixiStageController = controllerModule.createPixiStageController

    containerRef = { current: { appendChild: mock.fn() } }
    gameStateRef = {
      current: {
        lanes: [],
        running: true,
        modifiers: {}
      }
    }
    updateRef = { current: mock.fn() }
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

    console.log(`Filter assignment count: ${filterSetCount}`)

    // With optimization, this should be very low (e.g. 1-5).
    // Without optimization, it is > 200.
    assert.ok(
      filterSetCount <= 5,
      `Expected <= 5 filter assignments, got ${filterSetCount}`
    )
  })
})
