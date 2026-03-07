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

  describe('withTimeout', () => {
    test('resolves null when promise rejects', async () => {
      const rejectingPromise = Promise.reject(new Error('Test rejection'))
      const result = await controller.withTimeout(rejectingPromise, 'TestLabel')
      assert.equal(result, null)
    })

    test('resolves null on timeout', async () => {
      mock.timers.enable({ apis: ['setTimeout'] })
      try {
        const hangingPromise = new Promise(() => {}) // Never resolves
        const timeoutPromise = controller.withTimeout(
          hangingPromise,
          'TestLabel',
          100
        )
        mock.timers.tick(100)
        const result = await timeoutPromise
        assert.equal(result, null)
      } finally {
        mock.timers.reset()
      }
    })

    test('resolves successfully when promise completes', async () => {
      const successPromise = Promise.resolve({ data: 'test' })
      const result = await controller.withTimeout(successPromise, 'TestLabel')
      assert.deepEqual(result, { data: 'test' })
    })

    test('uses custom timeout value', async () => {
      mock.timers.enable({ apis: ['setTimeout'] })
      try {
        const hangingPromise = new Promise(() => {})
        const timeoutPromise = controller.withTimeout(
          hangingPromise,
          'TestLabel',
          500
        )
        mock.timers.tick(500)
        const result = await timeoutPromise
        assert.equal(result, null)
      } finally {
        mock.timers.reset()
      }
    })

    test('handles error objects without message property', async () => {
      const rejectingPromise = Promise.reject('string error')
      const result = await controller.withTimeout(rejectingPromise, 'TestLabel')
      assert.equal(result, null)
    })
  })

  describe('manualUpdate', () => {
    test('calls handleTicker with deltaMS', async () => {
      await controller.init()
      const originalHandleTicker = controller.handleTicker
      let capturedDelta = null
      controller.handleTicker = (ticker) => {
        capturedDelta = ticker.deltaMS
        originalHandleTicker.call(controller, ticker)
      }

      controller.manualUpdate(32)

      assert.equal(capturedDelta, 32)
    })

    test('does nothing if app is not initialized', () => {
      controller.manualUpdate(16)
      // Should not throw
    })

    test('does nothing if controller is disposed', async () => {
      await controller.init()
      controller.dispose()
      controller.manualUpdate(16)
      // Should not throw
    })
  })

  describe('toxic filter management', () => {
    test('activates toxic filters when isToxicMode is true', async () => {
      await controller.init()
      gameStateRef.current.isToxicMode = true

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(controller.isToxicActive, true)
    })

    test('deactivates toxic filters when isToxicMode is false', async () => {
      await controller.init()
      gameStateRef.current.isToxicMode = true
      controller.handleTicker({ deltaMS: 16 })
      assert.equal(controller.isToxicActive, true)

      gameStateRef.current.isToxicMode = false
      controller.handleTicker({ deltaMS: 16 })

      assert.equal(controller.isToxicActive, false)
    })

    test('applies hue transformation in toxic mode', async () => {
      await controller.init()
      gameStateRef.current.isToxicMode = true

      const hueMethod = controller.colorMatrix.hue
      controller.colorMatrix.hue = mock.fn()

      controller.handleTicker({ deltaMS: 16 })

      assert.ok(controller.colorMatrix.hue.mock.calls.length > 0)
      const [hueValue, multiply] = controller.colorMatrix.hue.mock.calls[0].arguments
      assert.equal(typeof hueValue, 'number')
      assert.equal(multiply, false)

      controller.colorMatrix.hue = hueMethod
    })

    test('does not apply hue when colorMatrix is null', async () => {
      await controller.init()
      const originalMatrix = controller.colorMatrix
      controller.colorMatrix = null
      gameStateRef.current.isToxicMode = true

      controller.handleTicker({ deltaMS: 16 })
      // Should not throw

      controller.colorMatrix = originalMatrix
    })
  })

  describe('update guards', () => {
    test('does not update when gameState is null', async () => {
      await controller.init()
      gameStateRef.current = null

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(mockLaneManager.update.mock.calls.length, 0)
    })

    test('does not update when isGameOver is true', async () => {
      await controller.init()
      gameStateRef.current.isGameOver = true

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(mockLaneManager.update.mock.calls.length, 0)
    })

    test('does not update when stageContainer is null', async () => {
      await controller.init()
      controller.stageContainer = null

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(mockLaneManager.update.mock.calls.length, 0)
    })

    test('does not update when laneManager is null', async () => {
      await controller.init()
      controller.laneManager = null

      controller.handleTicker({ deltaMS: 16 })

      // Should not throw and not call any manager updates
    })

    test('does not update when toxicFilters is null', async () => {
      await controller.init()
      controller.toxicFilters = null

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(mockLaneManager.update.mock.calls.length, 0)
    })
  })

  describe('dispose', () => {
    test('clears all manager references', async () => {
      await controller.init()
      controller.dispose()

      assert.equal(controller.noteManager, null)
      assert.equal(controller.effectManager, null)
      assert.equal(controller.laneManager, null)
      assert.equal(controller.crowdManager, null)
    })

    test('destroys colorMatrix filter', async () => {
      await controller.init()
      const colorMatrix = controller.colorMatrix
      const destroySpy = mock.fn()
      colorMatrix.destroy = destroySpy

      controller.dispose()

      assert.equal(destroySpy.mock.calls.length, 1)
      assert.equal(controller.colorMatrix, null)
    })

    test('clears filter arrays', async () => {
      await controller.init()
      controller.dispose()

      assert.equal(controller.toxicFilters, null)
      assert.deepEqual(controller.emptyFilters, [])
    })

    test('handles dispose when managers are null', async () => {
      await controller.init()
      controller.noteManager = null
      controller.effectManager = null

      controller.dispose()
      // Should not throw
    })

    test('destroys stageContainer with children', async () => {
      await controller.init()
      const stageContainer = controller.stageContainer
      const destroySpy = mock.fn()
      const removeChildrenSpy = mock.fn()
      stageContainer.destroy = destroySpy
      stageContainer.removeChildren = removeChildrenSpy

      controller.dispose()

      assert.equal(removeChildrenSpy.mock.calls.length, 1)
      assert.equal(destroySpy.mock.calls.length, 1)
      assert.deepEqual(destroySpy.mock.calls[0].arguments, [{ children: true }])
      assert.equal(controller.stageContainer, null)
    })
  })

  describe('initialization edge cases', () => {
    test('handles asset loading failures gracefully', async () => {
      mockCrowdManager.loadAssets.mock.mockImplementation(
        async () => Promise.reject(new Error('Load failed'))
      )

      await controller.init()

      // Should still initialize managers despite load failure
      assert.equal(mockCrowdManager.init.mock.calls.length, 1)
    })

    test('sets isToxicActive to false on setup', async () => {
      controller.isToxicActive = true
      await controller.init()

      assert.equal(controller.isToxicActive, false)
    })

    test('initializes toxicFilters with colorMatrix', async () => {
      await controller.init()

      assert.ok(Array.isArray(controller.toxicFilters))
      assert.equal(controller.toxicFilters.length, 1)
      assert.equal(controller.toxicFilters[0], controller.colorMatrix)
    })

    test('does not initialize managers if disposed during setup', async () => {
      const slowLoad = new Promise((resolve) => setTimeout(resolve, 100))
      mockCrowdManager.loadAssets.mock.mockImplementation(() => slowLoad)

      const initPromise = controller.init()
      controller.isDisposed = true
      await initPromise

      // Should not call init on managers if disposed
      assert.equal(mockCrowdManager.init.mock.calls.length, 0)
    })
  })

  describe('update with optional gameState properties', () => {
    test('handles missing combo property', async () => {
      await controller.init()
      delete gameStateRef.current.combo

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(mockCrowdManager.update.mock.calls[0].arguments[0], 0)
    })

    test('handles missing isToxicMode property', async () => {
      await controller.init()
      delete gameStateRef.current.isToxicMode

      controller.handleTicker({ deltaMS: 16 })

      assert.equal(mockCrowdManager.update.mock.calls[0].arguments[1], false)
    })
  })
})
