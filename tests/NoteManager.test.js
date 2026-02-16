import { test, mock, describe, beforeEach } from 'node:test'
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
  }
}

const MockGraphics = class {
  constructor() {
    this.clear = mock.fn()
    this.rect = mock.fn()
    this.fill = mock.fn()
    this.scale = { set: mock.fn() }
    this.visible = false
    this.alpha = 0
    this.x = 0
    this.y = 0
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
  Application: class {
    init() {}
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

// Mock other dependencies
mock.module('../src/utils/errorHandler.js', {
  namedExports: {
    handleError: mock.fn()
  }
})

mock.module('../src/utils/imageGen.js', {
  namedExports: {
    getGenImageUrl: mock.fn(),
    IMG_PROMPTS: { NOTE_SKULL: 'skull' }
  }
})

const mockPixiStageUtils = {
  calculateNoteY: mock.fn()
}

mock.module('../src/utils/pixiStageUtils.js', {
  namedExports: mockPixiStageUtils
})

describe('NoteManager', () => {
  let noteManager
  let gameStateRef
  let parentContainer
  let PIXI
  let NoteManager

  beforeEach(async () => {
    // Dynamic import to ensure mocks are applied
    const pixiModule = await import('pixi.js')
    PIXI = pixiModule

    const managerModule = await import('../src/components/stage/NoteManager.js')
    NoteManager = managerModule.NoteManager

    parentContainer = new PIXI.Container()
    gameStateRef = {
      current: { lanes: [{ color: 0xff0000, renderX: 100, active: false }] }
    }

    const app = new PIXI.Application()

    noteManager = new NoteManager(app, parentContainer, gameStateRef, mock.fn())
    noteManager.init()
  })

  test('acquireSpriteFromPool returns a new sprite if pool is empty', () => {
    noteManager.noteTexture = {}
    const lane = { color: 0x00ff00, renderX: 200 }

    const sprite = noteManager.acquireSpriteFromPool(lane)

    assert.ok(sprite instanceof PIXI.Sprite)
    assert.equal(sprite.tint, 0x00ff00)
    assert.equal(sprite.x, 250) // 200 + 50 (NOTE_CENTER_OFFSET)
    assert.equal(sprite.y, -50) // NOTE_INITIAL_Y
    assert.equal(sprite.width, 80) // NOTE_SPRITE_SIZE
    assert.equal(sprite.height, 80) // NOTE_SPRITE_SIZE
  })

  test('acquireSpriteFromPool reuses a sprite from the pool', () => {
    noteManager.noteTexture = {}
    const lane = { color: 0x00ff00, renderX: 200 }

    // Create a sprite and put it in the pool
    const pooledSprite = new PIXI.Sprite()
    pooledSprite.visible = false
    noteManager.spritePool.push(pooledSprite)

    const sprite = noteManager.acquireSpriteFromPool(lane)

    assert.equal(sprite, pooledSprite)
    assert.equal(sprite.visible, true)
    assert.equal(sprite.tint, 0x00ff00)
    assert.equal(sprite.x, 250)
    assert.equal(sprite.y, -50)
    assert.equal(sprite.alpha, 1)

    // Check width/height set
    assert.equal(sprite.width, 80)
    assert.equal(sprite.height, 80)

    // Check scale set call - NO LONGER CALLED for Sprite, we use width/height
    assert.equal(sprite.scale.set.mock.calls.length, 0)
  })

  test('createNoteSprite creates a fallback Graphics if texture is missing', () => {
    noteManager.noteTexture = null

    const sprite = noteManager.createNoteSprite()

    assert.ok(sprite instanceof PIXI.Graphics)
    // It returns uninitialized sprite now
    assert.equal(sprite.x, 0)
  })

  test('initializeNoteSprite sets properties correctly', () => {
    const lane = { color: 0x0000ff, renderX: 300 }
    const sprite = new PIXI.Graphics()

    noteManager.initializeNoteSprite(sprite, lane)

    assert.equal(sprite.x, 305)
    assert.equal(sprite.y, -50)
    assert.equal(sprite.visible, true)
    assert.equal(sprite.alpha, 1)
  })

  test('acquireSpriteFromPool reuses a Graphics from the pool', () => {
    const lane = { color: 0x0000ff, renderX: 300 }

    const pooledGraphics = new PIXI.Graphics()
    pooledGraphics.visible = false
    noteManager.spritePool.push(pooledGraphics)

    const sprite = noteManager.acquireSpriteFromPool(lane)

    assert.equal(sprite, pooledGraphics)
    assert.equal(sprite.visible, true)
    assert.equal(sprite.x, 305)
    assert.equal(sprite.y, -50)
    assert.equal(sprite.alpha, 1) // set in acquireSpriteFromPool

    // Check scale set call
    assert.equal(sprite.scale.set.mock.calls.length, 1)
    assert.deepEqual(sprite.scale.set.mock.calls[0].arguments, [1])

    // Check clear call
    assert.equal(sprite.clear.mock.calls.length, 1)
  })

  test('initializeNoteSprite sets jitterOffset property', () => {
    const lane = { color: 0x00ff00, renderX: 100 }
    const sprite = new PIXI.Sprite()

    noteManager.initializeNoteSprite(sprite, lane)

    assert.equal(typeof sprite.jitterOffset, 'number')
    // NOTE_JITTER_RANGE is 10, so range is -5 to 5
    assert.ok(sprite.jitterOffset >= -5 && sprite.jitterOffset <= 5)
  })
})
