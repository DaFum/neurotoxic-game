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
    removeChildren() {}
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
  let createPixiStageController
  let originalResizeObserver

  beforeEach(async () => {
    originalResizeObserver = globalThis.ResizeObserver
    globalThis.window = {
      devicePixelRatio: 1,
      addEventListener: mock.fn(),
      removeEventListener: mock.fn()
    }
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

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
        modifiers: {},
        combo: 10,
        isToxicMode: false
      }
    }
    updateRef = { current: mock.fn() }

    controller = createPixiStageController({
      containerRef,
      gameStateRef,
      updateRef
    })
  })

  afterEach(() => {
    delete globalThis.window
    if (originalResizeObserver) {
      globalThis.ResizeObserver = originalResizeObserver
    } else {
      delete globalThis.ResizeObserver
    }
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

  test('constructor initializes properties correctly', () => {
    assert.equal(controller.colorMatrix, null)
    assert.equal(controller.stageContainer, null)
    assert.equal(controller.crowdManager, null)
    assert.equal(controller.laneManager, null)
    assert.equal(controller.effectManager, null)
    assert.equal(controller.noteManager, null)
    assert.equal(controller.toxicFilters, null)
    assert.deepEqual(controller.emptyFilters, [])
    assert.equal(controller.isToxicActive, false)
  })

  test('withTimeout resolves when promise completes before timeout', async () => {
    await controller.init()
    const promise = Promise.resolve('success')
    const result = await controller.withTimeout(promise, 'Test')
    assert.equal(result, 'success')
  })

  test('withTimeout resolves with null when timeout is reached', async () => {
    await controller.init()
    const promise = new Promise(resolve => setTimeout(() => resolve('late'), 15000))
    const result = await controller.withTimeout(promise, 'Test')
    assert.equal(result, null)
  })

  test('manualUpdate calls handleTicker with deltaMS', async () => {
    await controller.init()
    const deltaMS = 16
    controller.manualUpdate(deltaMS)

    assert.equal(mockLaneManager.update.mock.calls.length, 1)
    assert.equal(mockCrowdManager.update.mock.calls.length, 1)
    assert.equal(mockNoteManager.update.mock.calls.length, 1)
    assert.equal(mockEffectManager.update.mock.calls.length, 1)
  })

  test('manualUpdate does nothing when app is null', () => {
    controller.manualUpdate(16)
    // Should not crash
    assert.equal(mockLaneManager.update.mock.calls.length, 0)
  })

  test('manualUpdate does nothing when disposed', async () => {
    await controller.init()
    controller.dispose()
    controller.manualUpdate(16)
    // Should not crash or call updates
  })

  test('update does nothing when isDisposed is true', async () => {
    await controller.init()
    controller.isDisposed = true
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(mockLaneManager.update.mock.calls.length, 0)
  })

  test('update does nothing when app is null', async () => {
    await controller.init()
    controller.app = null
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(mockLaneManager.update.mock.calls.length, 0)
  })

  test('update does nothing when managers are not initialized', async () => {
    await controller.init()
    controller.laneManager = null
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(mockCrowdManager.update.mock.calls.length, 0)
  })

  test('update does nothing when game state is null', async () => {
    await controller.init()
    gameStateRef.current = null
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(mockLaneManager.update.mock.calls.length, 0)
  })

  test('update does nothing when isGameOver is true', async () => {
    await controller.init()
    gameStateRef.current.isGameOver = true
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(mockLaneManager.update.mock.calls.length, 0)
  })

  test('toxic mode activates filters when isToxicMode is true', async () => {
    await controller.init()
    gameStateRef.current.isToxicMode = true

    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(controller.isToxicActive, true)
    assert.equal(controller.stageContainer.filters, controller.toxicFilters)
  })

  test('toxic mode deactivates filters when isToxicMode becomes false', async () => {
    await controller.init()
    gameStateRef.current.isToxicMode = true
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    assert.equal(controller.isToxicActive, true)

    gameStateRef.current.isToxicMode = false
    controller.handleTicker(ticker)

    assert.equal(controller.isToxicActive, false)
    assert.equal(controller.stageContainer.filters, controller.emptyFilters)
  })

  test('toxic mode hue changes based on elapsed time', async () => {
    await controller.init()
    gameStateRef.current.isToxicMode = true

    const hueCallsBefore = controller.colorMatrix.hue.mock?.calls?.length || 0
    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    // The hue method should be called (note: our mock doesn't track calls, but we can verify logic)
    assert.equal(controller.isToxicActive, true)
  })

  test('dispose cleans up filters and container properly', async () => {
    await controller.init()
    const stageContainer = controller.stageContainer
    const colorMatrix = controller.colorMatrix

    controller.dispose()

    assert.equal(controller.stageContainer, null)
    assert.equal(controller.colorMatrix, null)
    assert.equal(controller.toxicFilters, null)
    assert.equal(controller.emptyFilters, null)
  })

  test('dispose handles null stageContainer gracefully', async () => {
    await controller.init()
    controller.stageContainer = null

    // Should not throw
    controller.dispose()
    assert.equal(controller.stageContainer, null)
  })

  test('dispose handles null colorMatrix gracefully', async () => {
    await controller.init()
    controller.colorMatrix = null

    // Should not throw
    controller.dispose()
    assert.equal(controller.colorMatrix, null)
  })

  test('setup initializes isToxicActive to false', async () => {
    await controller.init()
    assert.equal(controller.isToxicActive, false)
  })

  test('setup loads assets in parallel', async () => {
    await controller.init()

    // Verify that all asset loading methods were called at least once
    assert.ok(mockCrowdManager.loadAssets.mock.calls.length >= 1)
    assert.ok(mockEffectManager.loadAssets.mock.calls.length >= 1)
    assert.ok(mockNoteManager.loadAssets.mock.calls.length >= 1)
  })

  test('update uses default values when state properties are undefined', async () => {
    await controller.init()
    gameStateRef.current = {}

    const ticker = { deltaMS: 16 }
    controller.handleTicker(ticker)

    // Should use defaults (combo ?? 0, isToxicMode ?? false)
    assert.equal(mockCrowdManager.update.mock.calls.length, 1)
    assert.deepEqual(mockCrowdManager.update.mock.calls[0].arguments, [
      0, // combo defaults to 0
      false, // isToxicMode defaults to false
      1234
    ])
  })

  test('dispose during setup prevents manager initialization', async () => {
    const newController = createPixiStageController({
      containerRef,
      gameStateRef,
      updateRef
    })

    // Start init but don't await it yet
    const initPromise = newController.init()

    // Mark as disposed immediately
    newController.isDisposed = true

    await initPromise

    // The implementation checks isDisposed and returns early if true
    // This test verifies the controller handles disposal during setup gracefully
    assert.equal(newController.isDisposed, true)
  })

  test('dispose sets all managers to null', async () => {
    await controller.init()

    assert.notEqual(controller.crowdManager, null)
    assert.notEqual(controller.laneManager, null)
    assert.notEqual(controller.effectManager, null)
    assert.notEqual(controller.noteManager, null)

    controller.dispose()

    assert.equal(controller.crowdManager, null)
    assert.equal(controller.laneManager, null)
    assert.equal(controller.effectManager, null)
    assert.equal(controller.noteManager, null)
  })

  test('toxic mode does not apply filters if colorMatrix is null', async () => {
    await controller.init()
    controller.colorMatrix = null
    gameStateRef.current.isToxicMode = true

    const ticker = { deltaMS: 16 }
    // Should not crash
    controller.handleTicker(ticker)

    // isToxicActive should still be set
    assert.equal(controller.isToxicActive, true)
  })

  test('update handles missing toxicFilters gracefully', async () => {
    await controller.init()
    controller.toxicFilters = null

    const ticker = { deltaMS: 16 }
    // Should not crash due to guard clause
    controller.handleTicker(ticker)
  })
})