import { test, mock, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// Define Mock Classes
const MockSprite = class {
  constructor(texture) {
    this.texture = texture
    this.anchor = { set: mock.fn() }
    this.scale = { set: mock.fn() }
    this.visible = false
    this.alpha = 0
    this.x = 0
    this.y = 0
    this.tint = 0
    this.width = 0
    this.height = 0
    this.destroy = mock.fn()
  }
}

const MockGraphics = class {
  constructor() {
    this.circle = mock.fn()
    this.fill = mock.fn()
    this.scale = { set: mock.fn() }
    this.visible = false
    this.alpha = 0
    this.x = 0
    this.y = 0
    this.tint = 0
    this.destroy = mock.fn()
  }
}

const MockPIXI = {
  Sprite: MockSprite,
  Graphics: MockGraphics,
  Container: class {
    addChild() {}
    removeChild() {}
    destroy() {}
  },
  Assets: {
    load: mock.fn()
  }
}

// Mock PIXI module
mock.module('pixi.js', {
  defaultExport: MockPIXI,
  namedExports: MockPIXI
})

// Mock dependencies
mock.module('../src/utils/imageGen.js', {
  namedExports: {
    getGenImageUrl: mock.fn((prompt) => `url://${prompt}`),
    IMG_PROMPTS: { CROWD_IDLE: 'idle', CROWD_MOSH: 'mosh' }
  }
})

mock.module('../src/utils/logger.js', {
  namedExports: {
    logger: {
      warn: mock.fn()
    }
  }
})

mock.module('../src/components/stage/utils.js', {
  namedExports: {
    calculateCrowdOffset: mock.fn(() => 10),
    calculateCrowdY: mock.fn(() => 100),
    getPixiColorFromToken: mock.fn(() => 0xffffff),
    CROWD_LAYOUT: {
      containerYRatio: 0.5,
      memberCount: 2, // Small count for testing
      minRadius: 10,
      radiusVariance: 5,
      yRangeRatio: 0.1
    }
  }
})

describe('CrowdManager', () => {
  let crowdManager
  let parentContainer
  let PIXI
  let CrowdManager

  beforeEach(async () => {
    const pixiModule = await import('pixi.js')
    PIXI = pixiModule

    const managerModule = await import('../src/components/stage/CrowdManager.js')
    CrowdManager = managerModule.CrowdManager

    parentContainer = new PIXI.Container()
    const app = { screen: { width: 800, height: 600 } }
    crowdManager = new CrowdManager(app, parentContainer)
  })

  afterEach(() => {
    if (PIXI && PIXI.Assets && PIXI.Assets.load.mock) {
      PIXI.Assets.load.mock.resetCalls()
      // Restore default implementation if necessary, or just reset calls
      // Assuming mock.fn() without implementation was default, or we want to clear mock implementations:
      // node:test mocks don't have a direct 'mockRestore' to original if not spied.
      // But we can reset the implementation to a default no-op or throw if needed.
      // Here just resetting calls is good, but preventing leak is better:
      PIXI.Assets.load.mock.mockImplementation(async () => null)
    }
  })

  test('loadAssets loads textures correctly', async () => {
    const mockTextureIdle = { id: 'idle' }
    const mockTextureMosh = { id: 'mosh' }

    PIXI.Assets.load.mock.mockImplementation(async (url) => {
      if (url.includes('idle')) return mockTextureIdle
      if (url.includes('mosh')) return mockTextureMosh
      return null
    })

    await crowdManager.loadAssets()

    assert.equal(crowdManager.textures.idle, mockTextureIdle)
    assert.equal(crowdManager.textures.mosh, mockTextureMosh)
  })

  test('init creates Sprites when texture is available', () => {
    crowdManager.textures.idle = { id: 'idle' }
    crowdManager.init()

    assert.equal(crowdManager.crowdMembers.length, 2)
    const member = crowdManager.crowdMembers[0]

    assert.ok(member instanceof PIXI.Sprite)
    assert.equal(member.texture, crowdManager.textures.idle)
    // Scale check (width = radius * 2.5)
    assert.ok(member.width > 0)
  })

  test('init creates Graphics when texture is missing', () => {
    crowdManager.textures.idle = null
    crowdManager.init()

    assert.equal(crowdManager.crowdMembers.length, 2)
    const member = crowdManager.crowdMembers[0]

    assert.ok(member instanceof PIXI.Graphics)
    assert.equal(member.circle.mock.calls.length, 1)
  })

  test('update switches texture to MOSH when combo > 20', () => {
    crowdManager.textures.idle = { id: 'idle' }
    crowdManager.textures.mosh = { id: 'mosh' }
    crowdManager.init()
    const member = crowdManager.crowdMembers[0]

    // Initial state
    assert.equal(member.texture, crowdManager.textures.idle)

    // High combo -> Mosh
    crowdManager.update(21, false, 1000)
    assert.equal(member.texture, crowdManager.textures.mosh)

    // Low combo -> Idle
    crowdManager.update(5, false, 2000)
    assert.equal(member.texture, crowdManager.textures.idle)
  })

  test('update switches texture to MOSH when toxic mode is on', () => {
    crowdManager.textures.idle = { id: 'idle' }
    crowdManager.textures.mosh = { id: 'mosh' }
    crowdManager.init()
    const member = crowdManager.crowdMembers[0]

    // Toxic mode -> Mosh (even with low combo)
    crowdManager.update(0, true, 1000)
    assert.equal(member.texture, crowdManager.textures.mosh)
  })

  test('update handles missing mosh texture gracefully', () => {
    crowdManager.textures.idle = { id: 'idle' }
    crowdManager.textures.mosh = null
    crowdManager.init()
    const member = crowdManager.crowdMembers[0]

    // High combo -> Should stay Idle because Mosh texture is missing
    crowdManager.update(21, false, 1000)
    assert.equal(member.texture, crowdManager.textures.idle)
  })
})
