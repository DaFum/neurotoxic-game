import { describe, it, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// Mock DOM
global.window = {
  devicePixelRatio: 1,
  addEventListener: mock.fn(),
  removeEventListener: mock.fn()
}
global.document = {
  createElement: mock.fn(() => ({
    getContext: mock.fn(() => ({
      fillRect: mock.fn(),
      getImageData: mock.fn()
    })),
    addEventListener: mock.fn(),
    removeEventListener: mock.fn()
  })),
  body: {
    appendChild: mock.fn()
  }
}

// Global mocks reset
// We use closures to hold the latest mocks
let currentTickerAdd
let currentTickerRemove
let currentAppDestroy
let currentLoad

mock.module('pixi.js', {
  namedExports: {
    Application: class {
      constructor() {
        this.canvas = { style: {} }
        this.stage = { addChild: mock.fn() }
        this.screen = { width: 800, height: 600 }
        this.ticker = {
          add: currentTickerAdd,
          remove: currentTickerRemove,
          lastTime: 1000,
          deltaMS: 16.6
        }
        this.init = mock.fn(() => Promise.resolve())
        this.destroy = currentAppDestroy
      }
    },
    Container: class {
      constructor() {
        this.addChild = mock.fn()
        this.removeChild = mock.fn()
        this.removeChildren = mock.fn()
      }
    },
    Graphics: class {
      constructor() {
        this.rect = mock.fn()
        this.circle = mock.fn()
        this.fill = mock.fn()
        this.destroy = mock.fn()
      }
    },
    Sprite: class {
      constructor() {
        this.anchor = { set: mock.fn() }
        this.scale = { set: mock.fn() }
        this.x = 0
        this.y = 0
        this.rotation = 0
        this.destroy = mock.fn()
      }
    },
    TilingSprite: class {
      constructor() {
        this.tilePosition = { x: 0, y: 0 }
        this.destroy = mock.fn()
      }
    },
    Assets: {
      load: (...args) => currentLoad(...args)
    }
  }
})

// Mock EffectManager
mock.module('../src/components/stage/EffectManager.js', {
  namedExports: {
    EffectManager: class {
      constructor() {}
      init() {}
      loadAssets() {
        return Promise.resolve()
      }
      update() {}
      spawnHitEffect() {}
      dispose() {}
    }
  }
})

// Mock Utils
mock.module('../src/utils/logger.js', {
  namedExports: {
    logger: {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn()
    }
  }
})

mock.module('../src/components/stage/utils', {
  namedExports: {
    getPixiColorFromToken: mock.fn(() => 0xffffff),
    loadTexture: mock.fn(() => Promise.resolve({ width: 100, height: 100 })),
    getOptimalResolution: mock.fn(() => 1)
  }
})

mock.module('../src/utils/imageGen', {
  namedExports: {
    IMG_PROMPTS: {
      ICON_VAN: 'ICON_VAN',
      MINIGAME_ROAD: 'MINIGAME_ROAD',
      MINIGAME_OBSTACLE_ROCK: 'MINIGAME_OBSTACLE_ROCK',
      MINIGAME_OBSTACLE_BARRIER: 'MINIGAME_OBSTACLE_BARRIER',
      MINIGAME_FUEL: 'MINIGAME_FUEL'
    },
    getGenImageUrl: mock.fn(() => 'mock-url')
  }
})

describe('TourbusStageController', () => {
  let createTourbusStageController
  let controller
  let containerRef
  let gameStateRef
  let updateRef
  let statsRef

  beforeEach(async () => {
    const module = await import(
      '../src/components/stage/TourbusStageController.js'
    )
    createTourbusStageController = module.createTourbusStageController

    containerRef = { current: { appendChild: mock.fn() } }
    gameStateRef = {
      current: {
        speed: 1,
        busLane: 1,
        obstacles: []
      }
    }
    updateRef = { current: mock.fn() }
    statsRef = { current: {} }

    // Create fresh mocks for each test run
    currentTickerAdd = mock.fn()
    currentTickerRemove = mock.fn()
    currentAppDestroy = mock.fn()
    // Ensure promise resolves to texture-like object
    currentLoad = mock.fn(() => Promise.resolve({ width: 100, height: 100 }))

    // Create new controller
    controller = createTourbusStageController({
      containerRef,
      gameStateRef,
      updateRef,
      statsRef
    })

    // Force inject mock app
    controller.app = new (class MockApp {
      constructor() {
        this.canvas = { style: {} }
        this.stage = { addChild: mock.fn() }
        this.screen = { width: 800, height: 600 }
        this.ticker = {
          add: currentTickerAdd,
          remove: currentTickerRemove,
          lastTime: 1000,
          deltaMS: 16.6
        }
        this.init = mock.fn(() => Promise.resolve())
        this.destroy = currentAppDestroy
      }
    })()

    controller.container = new (class Container {
      constructor() {
        this.addChild = mock.fn()
        this.removeChild = mock.fn()
        this.removeChildren = mock.fn()
      }
    })()

    // Partial manual init
    controller.roadContainer = controller.container
    controller.obstacleContainer = controller.container
    controller.initPromise = Promise.resolve()
  })

  afterEach(() => {
    mock.reset()
  })

  it('should initialize correctly', async () => {
    assert.ok(controller.app)
    assert.ok(controller.container)
    assert.ok(controller.obstacleMap instanceof Map)
    assert.ok(controller.currentIds instanceof Set)
  })

  it('should handle asset loading', async () => {
    await controller.loadAssets()
    assert.ok(controller.textures.bus)
  })

  it('should run update loop via ticker', async () => {
    const ticker = { deltaMS: 16.6, lastTime: 1000 }
    controller.handleTicker(ticker)

    // Check updateRef called
    assert.strictEqual(updateRef.current.mock.calls.length, 1)
    assert.strictEqual(updateRef.current.mock.calls[0].arguments[0], 16.6)
  })

  it('should render obstacles in ticker', async () => {
    // Add an obstacle to state
    gameStateRef.current.obstacles.push({
      id: 'obs1',
      lane: 1,
      y: 50,
      type: 'OBSTACLE',
      collided: false
    })

    const ticker = { deltaMS: 16.6, lastTime: 1000 }
    controller.handleTicker(ticker)

    // Verify obstacle sprite created
    assert.strictEqual(controller.obstacleMap.size, 1)
    const sprite = controller.obstacleMap.get('obs1')
    assert.ok(sprite)

    // Verify sprite position update (screen height 600)
    // y=50% -> 300
    assert.strictEqual(sprite.y, 300)
  })

  it('should remove obstacles that disappear from state', async () => {
    // Frame 1: Obstacle exists
    gameStateRef.current.obstacles.push({
      id: 'obs1',
      lane: 1,
      y: 50,
      type: 'OBSTACLE'
    })
    controller.handleTicker({ deltaMS: 16 })
    assert.strictEqual(controller.obstacleMap.size, 1)

    // Frame 2: Obstacle removed from state
    gameStateRef.current.obstacles = []
    controller.handleTicker({ deltaMS: 16 })

    assert.strictEqual(controller.obstacleMap.size, 0)
  })

  it('should dispose correctly', async () => {
    controller.isDisposed = false

    controller.dispose()

    assert.strictEqual(controller.isDisposed, true)
    assert.strictEqual(controller.initPromise, null)
    // Verify destroy was called on app
    assert.strictEqual(currentAppDestroy.mock.calls.length, 1)
    assert.strictEqual(controller.obstacleMap, null)
    assert.strictEqual(controller.currentIds, null)
  })
})
