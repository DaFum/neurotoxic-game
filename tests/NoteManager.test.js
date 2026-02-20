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
    this.clear = mock.fn()
    this.rect = mock.fn()
    this.fill = mock.fn()
    this.scale = { set: mock.fn() }
    this.visible = false
    this.alpha = 0
    this.x = 0
    this.y = 0
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
    IMG_PROMPTS: { NOTE_SKULL: 'skull', NOTE_LIGHTNING: 'lightning' }
  }
})

let mockCalculateNoteYResult = 0
const mockPixiStageUtils = {
  calculateNoteY: mock.fn(() => mockCalculateNoteYResult)
}

mock.module('../src/components/stage/utils.js', {
  namedExports: mockPixiStageUtils
})

describe('NoteManager', () => {
  let noteManager
  let gameStateRef
  let parentContainer
  let PIXI
  let NoteManager
  let randomMock

  beforeEach(async () => {
    randomMock = mock.method(Math, 'random', () => 0.5)

    // Dynamic import to ensure mocks are applied
    const pixiModule = await import('pixi.js')
    PIXI = pixiModule

    const managerModule = await import('../src/components/stage/NoteManager.js')
    NoteManager = managerModule.NoteManager

    // Reset mocks
    mockPixiStageUtils.calculateNoteY.mock.resetCalls()

    parentContainer = new PIXI.Container()
    gameStateRef = {
      current: { lanes: [{ color: 0xff0000, renderX: 100, active: false }] }
    }

    const app = new PIXI.Application()

    noteManager = new NoteManager(app, parentContainer, gameStateRef, mock.fn())
    noteManager.init()
  })

  afterEach(() => {
    randomMock.mock.restore()
  })

  const createMockNoteAndState = () => {
    const note = { time: 3000, laneIndex: 0, visible: true, hit: false }
    const state = {
      notes: [note],
      lanes: gameStateRef.current.lanes,
      modifiers: {},
      speed: 1
    }
    return { note, state }
  }

  test('acquireSpriteFromPool returns a new sprite if pool is empty', () => {
    noteManager.noteTextures.skull = { id: 'skull' }
    const lane = { color: 0x00ff00, renderX: 200 }

    const sprite = noteManager.acquireSpriteFromPool(lane, 0)

    assert.ok(sprite instanceof PIXI.Sprite)
    assert.equal(sprite.tint, 0x00ff00)
    assert.equal(sprite.x, 250) // 200 + 50 (NOTE_CENTER_OFFSET)
    assert.equal(sprite.y, -50) // NOTE_INITIAL_Y
    assert.equal(sprite.width, 80) // NOTE_SPRITE_SIZE
    assert.equal(sprite.height, 80) // NOTE_SPRITE_SIZE
  })

  test('acquireSpriteFromPool reuses a sprite from the pool', () => {
    noteManager.noteTextures.skull = { id: 'skull' }
    const lane = { color: 0x00ff00, renderX: 200 }

    // Create a sprite and put it in the pool
    const pooledSprite = new PIXI.Sprite()
    pooledSprite.visible = false
    noteManager.spritePool.push(pooledSprite)

    const sprite = noteManager.acquireSpriteFromPool(lane, 0)

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
    noteManager.noteTextures = { skull: null, lightning: null }

    const sprite = noteManager.createNoteSprite(0)

    assert.ok(sprite instanceof PIXI.Graphics)
    // It returns uninitialized sprite now
    assert.equal(sprite.x, 0)
  })

  test('initializeNoteSprite sets properties correctly', () => {
    const lane = { color: 0x0000ff, renderX: 300 }
    const sprite = new PIXI.Graphics()

    noteManager.initializeNoteSprite(sprite, lane, 0)

    assert.equal(sprite.x, 305)
    assert.equal(sprite.y, -50)
    assert.equal(sprite.visible, true)
    assert.equal(sprite.alpha, 1)
  })

  test('initializeNoteSprite sets correct texture for lightning lane', () => {
    const lane = { color: 0x0000ff, renderX: 300 }
    // Ensure textures are set up
    noteManager.noteTextures.skull = { id: 'skull' }
    noteManager.noteTextures.lightning = { id: 'lightning' }

    const sprite = new PIXI.Sprite()

    // Lane index 1 is lightning lane
    noteManager.initializeNoteSprite(sprite, lane, 1)

    assert.equal(sprite.texture.id, 'lightning')
  })

  test('initializeNoteSprite sets correct texture for skull lane', () => {
    const lane = { color: 0x0000ff, renderX: 300 }
    // Ensure textures are set up
    noteManager.noteTextures.skull = { id: 'skull' }
    noteManager.noteTextures.lightning = { id: 'lightning' }

    const sprite = new PIXI.Sprite()

    // Lane index 0 is skull lane
    noteManager.initializeNoteSprite(sprite, lane, 0)

    assert.equal(sprite.texture.id, 'skull')
  })

  test('acquireSpriteFromPool reuses a Graphics from the pool', () => {
    const lane = { color: 0x0000ff, renderX: 300 }

    const pooledGraphics = new PIXI.Graphics()
    pooledGraphics.visible = false
    noteManager.spritePool.push(pooledGraphics)

    const sprite = noteManager.acquireSpriteFromPool(lane, 0)

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
    noteManager.noteTextures.skull = { id: 'skull' }
    const lane = { color: 0x00ff00, renderX: 100 }
    const sprite = new PIXI.Sprite()

    noteManager.initializeNoteSprite(sprite, lane, 0)

    assert.equal(typeof sprite.jitterOffset, 'number')
    // NOTE_JITTER_RANGE is 10, so range is -5 to 5
    assert.ok(sprite.jitterOffset >= -5 && sprite.jitterOffset <= 5)
  })

  test('update spawns notes when time is reached', () => {
    noteManager.noteTextures.skull = { id: 'skull' }
    const { note, state } = createMockNoteAndState()
    // 3000 - 2000 (NOTE_SPAWN_LEAD_MS) = 1000

    // Before spawn time
    noteManager.update(state, 900, {})
    assert.equal(noteManager.noteSprites.size, 0)

    // At spawn time
    noteManager.update(state, 1000, {})
    assert.equal(noteManager.noteSprites.size, 1)
    assert.ok(noteManager.noteSprites.has(note))
  })

  test('update positions visible notes', () => {
    noteManager.noteTextures.skull = { id: 'skull' }
    mockCalculateNoteYResult = 500
    const { note, state } = createMockNoteAndState()

    // Spawn first
    noteManager.update(state, 1000, {})
    const sprite = noteManager.noteSprites.get(note)

    // Update again
    noteManager.update(state, 1100, { hitLineY: 800 })

    assert.equal(mockPixiStageUtils.calculateNoteY.mock.calls.length, 2)
    assert.equal(sprite.y, 500)
    assert.equal(sprite.x, 150) // 100 (lane) + 50 (offset) + 0 (jitter)
  })

  test('update handles hit notes and calls onHit', () => {
    noteManager.noteTextures.skull = { id: 'skull' }
    const onHitMock = mock.fn()
    noteManager.onHit = onHitMock
    const { note, state } = createMockNoteAndState()

    // Spawn
    noteManager.update(state, 1000, {})
    const sprite = noteManager.noteSprites.get(note)

    // Mark as hit
    note.hit = true
    noteManager.update(state, 1100, {})

    assert.equal(onHitMock.mock.calls.length, 1)
    assert.deepEqual(onHitMock.mock.calls[0].arguments, [
      sprite.x,
      sprite.y,
      0xff0000
    ])
    assert.equal(noteManager.noteSprites.has(note), false)
    assert.equal(noteManager.spritePool.length, 1) // Returned to pool
  })

  test('dispose clears resources', () => {
    noteManager.noteTextures.skull = { id: 'skull' }
    const { state } = createMockNoteAndState()

    // Spawn
    noteManager.update(state, 1000, {})

    // Create a pool item
    const mockSprite = new PIXI.Sprite()
    noteManager.spritePool.push(mockSprite)

    noteManager.dispose()

    assert.equal(noteManager.noteSprites.size, 0)
    assert.equal(noteManager.spritePool.length, 0)
    assert.equal(noteManager.container, null)
    assert.equal(mockSprite.destroy.mock.calls.length, 1)
  })

  test('releaseSpriteToPool respects MAX_POOL_SIZE', () => {
    // Override MAX_POOL_SIZE for this test
    const originalMax = NoteManager.MAX_POOL_SIZE
    NoteManager.MAX_POOL_SIZE = 2

    try {
      noteManager.spritePool = []

      const sprite1 = { destroy: mock.fn(), visible: true }
      const sprite2 = { destroy: mock.fn(), visible: true }
      const sprite3 = { destroy: mock.fn(), visible: true }

      noteManager.releaseSpriteToPool(sprite1)
      noteManager.releaseSpriteToPool(sprite2)
      noteManager.releaseSpriteToPool(sprite3)

      assert.equal(noteManager.spritePool.length, 2)
      assert.equal(sprite1.visible, false)
      assert.equal(sprite2.visible, false)
      assert.equal(sprite3.visible, false)
      assert.equal(sprite3.destroy.mock.calls.length, 1)
      assert.equal(sprite1.destroy.mock.calls.length, 0)
    } finally {
      NoteManager.MAX_POOL_SIZE = originalMax
    }
  })
})
