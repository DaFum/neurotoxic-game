import { test, mock, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

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
    addChild() {}
    destroy() {}
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

// Mock Managers
const mockCrowdManager = {
  init: mock.fn(),
  loadAssets: mock.fn(),
  update: mock.fn(),
  dispose: mock.fn()
}
const mockLaneManager = {
  init: mock.fn(),
  update: mock.fn(),
  dispose: mock.fn(),
  container: 'rhythmContainer',
  layout: 'layout'
}
const mockEffectManager = {
  init: mock.fn(),
  loadAssets: mock.fn(),
  spawnHitEffect: mock.fn(),
  update: mock.fn(),
  dispose: mock.fn()
}
const mockNoteManager = {
  init: mock.fn(),
  loadAssets: mock.fn(),
  update: mock.fn(),
  dispose: mock.fn()
}

mock.module('../src/components/stage/CrowdManager.js', {
  namedExports: {
    CrowdManager: class {
      constructor() {
        Object.assign(this, mockCrowdManager)
      }
    }
  }
})
mock.module('../src/components/stage/LaneManager.js', {
  namedExports: {
    LaneManager: class {
      constructor() {
        Object.assign(this, mockLaneManager)
      }
    }
  }
})
mock.module('../src/components/stage/EffectManager.js', {
  namedExports: {
    EffectManager: class {
      constructor() {
        Object.assign(this, mockEffectManager)
      }
    }
  }
})
mock.module('../src/components/stage/NoteManager.js', {
  namedExports: {
    NoteManager: class {
      constructor() {
        Object.assign(this, mockNoteManager)
      }
    }
  }
})


const mockAudioEngine = {
  getGigTimeMs: mock.fn(() => 1234)
}

mock.module('../src/utils/audioEngine.js', {
  namedExports: mockAudioEngine
})


describe('PixiStageController', () => {
  let controller
  let gameStateRef
  let containerRef
  let updateRef
  let statsRef
  let createPixiStageController

  beforeEach(async () => {
    globalThis.window = { devicePixelRatio: 1 }

    // Reset mocks
    mockCrowdManager.init.mock.resetCalls()
    mockCrowdManager.loadAssets.mock.resetCalls()
    mockLaneManager.init.mock.resetCalls()
    mockEffectManager.init.mock.resetCalls()
    mockEffectManager.loadAssets.mock.resetCalls()
    mockNoteManager.init.mock.resetCalls()
    mockLaneManager.update.mock.resetCalls()
    mockCrowdManager.update.mock.resetCalls()
    mockNoteManager.update.mock.resetCalls()
    mockEffectManager.update.mock.resetCalls()
    mockCrowdManager.dispose.mock.resetCalls()
    mockLaneManager.dispose.mock.resetCalls()
    mockEffectManager.dispose.mock.resetCalls()
    mockNoteManager.dispose.mock.resetCalls()
    mockAudioEngine.getGigTimeMs.mock.resetCalls()

    // Re-import to apply mocks
    const controllerModule =
      await import('../src/components/PixiStageController.js')
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
    statsRef = { current: { combo: 10 } }

    controller = createPixiStageController({
      containerRef,
      gameStateRef,
      updateRef,
      statsRef
    })
  })

  afterEach(() => {
    delete globalThis.window
  })

  test('init initializes managers', async () => {
    await controller.init()

    assert.equal(mockCrowdManager.init.mock.calls.length, 1)
    assert.equal(mockCrowdManager.loadAssets.mock.calls.length, 1)
    assert.equal(mockLaneManager.init.mock.calls.length, 1)
    assert.equal(mockEffectManager.init.mock.calls.length, 1)
    assert.equal(mockEffectManager.loadAssets.mock.calls.length, 1)
    assert.equal(mockNoteManager.init.mock.calls.length, 1)
    assert.equal(mockNoteManager.loadAssets.mock.calls.length, 1)
  })

  test('handleTicker updates managers', async () => {
    await controller.init()
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(mockLaneManager.update.mock.calls.length, 1)
    assert.deepEqual(mockLaneManager.update.mock.calls[0].arguments, [
      gameStateRef.current
    ])
    assert.equal(mockCrowdManager.update.mock.calls.length, 1)
    assert.deepEqual(mockCrowdManager.update.mock.calls[0].arguments, [
      10,
      false,
      1234
    ])
    assert.equal(mockNoteManager.update.mock.calls.length, 1)
    assert.deepEqual(mockNoteManager.update.mock.calls[0].arguments, [
      gameStateRef.current,
      1234,
      'layout'
    ])
    assert.equal(mockEffectManager.update.mock.calls.length, 1)
    assert.equal(mockAudioEngine.getGigTimeMs.mock.calls.length, 1)
    assert.deepEqual(mockEffectManager.update.mock.calls[0].arguments, [16])
    assert.equal(updateRef.current.mock.calls.length, 1)
  })

  test('dispose disposes managers', async () => {
    await controller.init()
    controller.dispose()

    assert.equal(mockCrowdManager.dispose.mock.calls.length, 1)
    assert.equal(mockLaneManager.dispose.mock.calls.length, 1)
    assert.equal(mockEffectManager.dispose.mock.calls.length, 1)
    assert.equal(mockNoteManager.dispose.mock.calls.length, 1)
  })
})
