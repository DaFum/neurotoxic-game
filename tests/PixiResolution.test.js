import { test, mock, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// Define Mock Classes
const MockPIXI = {
  Application: class {
    constructor() {
      this.canvas = 'canvas'
      this.stage = { addChild: mock.fn() }
      this.ticker = { add: mock.fn(), remove: mock.fn(), stop: mock.fn() }
      this.screen = { width: 800, height: 600 }
      this.initOptions = null
    }
    init(options) {
      this.initOptions = options
      return Promise.resolve()
    }
    destroy() {}
  },
  Container: class {
    constructor() {
      this.addChild = mock.fn()
      this.addChildAt = mock.fn()
      this.removeChild = mock.fn()
      this.removeChildren = mock.fn(() => [])
    }
    destroy() {}
  },
  Graphics: class {
    constructor() {
      this.rect = mock.fn(() => this)
      this.fill = mock.fn(() => this)
      this.circle = mock.fn(() => this)
      this.destroy = mock.fn()
      this.scale = { set: mock.fn() }
    }
  },
  ColorMatrixFilter: class {
    destroy() {}
    hue() {}
  },
  ImageSource: class {
    constructor() {}
  },
  Texture: {
    WHITE: 'white_texture'
  },
  Sprite: class {
    constructor() {
      this.anchor = { set: mock.fn() }
      this.scale = { set: mock.fn() }
    }
    destroy() {}
  },
  Assets: {
    cache: new Map(),
    load: mock.fn()
  }
}

// Mock PIXI module
mock.module('pixi.js', {
  defaultExport: MockPIXI,
  namedExports: MockPIXI
})

// Mock Managers
mock.module('../src/components/stage/CrowdManager.js', {
  namedExports: {
    CrowdManager: class {
      init() {}
      loadAssets() {
        return Promise.resolve()
      }
      update() {}
      dispose() {}
    }
  }
})
mock.module('../src/components/stage/LaneManager.js', {
  namedExports: {
    LaneManager: class {
      init() {}
      update() {}
      dispose() {}
      get container() {
        return new MockPIXI.Container()
      }
    }
  }
})
mock.module('../src/components/stage/EffectManager.js', {
  namedExports: {
    EffectManager: class {
      constructor() {
        this.init = mock.fn()
        this.loadAssets = mock.fn(() => Promise.resolve())
        this.update = mock.fn()
        this.dispose = mock.fn()
      }
    }
  }
})
mock.module('../src/components/stage/NoteManager.js', {
  namedExports: {
    NoteManager: class {
      init() {}
      loadAssets() {
        return Promise.resolve()
      }
      update() {}
      dispose() {}
    }
  }
})

describe('Pixi Resolution Capping', () => {
  let createPixiStageController
  let createTourbusStageController
  let createRoadieStageController
  let getOptimalResolution

  beforeEach(async () => {
    globalThis.window = {
      devicePixelRatio: 1,
      addEventListener: mock.fn(),
      removeEventListener: mock.fn(),
      getComputedStyle: () => ({
        getPropertyValue: () => '#00ff41'
      })
    }
    globalThis.document = {
      documentElement: {}
    }

    const utilsModule = await import('../src/components/stage/utils.js')
    getOptimalResolution = utilsModule.getOptimalResolution

    const controllerModule =
      await import('../src/components/PixiStageController.js')
    createPixiStageController = controllerModule.createPixiStageController

    const tourbusModule =
      await import('../src/components/stage/TourbusStageController.js')
    createTourbusStageController = tourbusModule.createTourbusStageController

    const roadieModule =
      await import('../src/components/stage/RoadieStageController.js')
    createRoadieStageController = roadieModule.createRoadieStageController
  })

  afterEach(() => {
    delete globalThis.window
    delete globalThis.document
  })

  test('getOptimalResolution caps resolution at 2', () => {
    globalThis.window.devicePixelRatio = 1
    assert.equal(getOptimalResolution(), 1)

    globalThis.window.devicePixelRatio = 1.5
    assert.equal(getOptimalResolution(), 1.5)

    globalThis.window.devicePixelRatio = 2
    assert.equal(getOptimalResolution(), 2)

    globalThis.window.devicePixelRatio = 3
    assert.equal(getOptimalResolution(), 2)

    globalThis.window.devicePixelRatio = 4
    assert.equal(getOptimalResolution(), 2)
  })

  test('PixiStageController uses capped resolution', async () => {
    globalThis.window.devicePixelRatio = 3
    const controller = createPixiStageController({
      containerRef: { current: { appendChild: () => {} } },
      gameStateRef: { current: {} },
      updateRef: { current: () => {} },
      statsRef: { current: {} }
    })
    await controller.init()
    assert.equal(controller.app.initOptions.resolution, 2)
  })

  test('TourbusStageController uses capped resolution', async () => {
    globalThis.window.devicePixelRatio = 3
    const controller = createTourbusStageController({
      containerRef: { current: { appendChild: () => {} } },
      gameStateRef: { current: { obstacles: [] } },
      updateRef: { current: () => {} },
      statsRef: { current: {} }
    })
    await controller.init()
    assert.equal(controller.app.initOptions.resolution, 2)
  })

  test('RoadieStageController uses capped resolution', async () => {
    globalThis.window.devicePixelRatio = 3
    const controller = createRoadieStageController({
      containerRef: { current: { appendChild: () => {} } },
      gameStateRef: { current: { playerPos: { x: 0, y: 0 }, traffic: [] } },
      updateRef: { current: () => {} },
      statsRef: { current: {} }
    })
    await controller.init()
    assert.equal(controller.app.initOptions.resolution, 2)
  })
})
