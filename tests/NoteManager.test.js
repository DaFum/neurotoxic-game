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
  Texture: { WHITE: { id: 'white' } },
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

// Mock NoteSpritePool
const mockAcquireSpriteFromPool = mock.fn()
const mockDestroyNoteSprite = mock.fn()
const mockPoolDispose = mock.fn()
const mockNoteTextures = { skull: null, lightning: null }

class MockNoteSpritePool {
  constructor(container) {
    this.container = container
    this.noteTextures = mockNoteTextures
  }
  acquireSpriteFromPool = mockAcquireSpriteFromPool
  destroyNoteSprite = mockDestroyNoteSprite
  dispose = mockPoolDispose
}

mock.module('../src/components/stage/NoteSpritePool.js', {
  namedExports: {
    NoteSpritePool: MockNoteSpritePool,
    NOTE_CENTER_OFFSET: 50
  }
})

// Mock other dependencies
const mockHandleError = mock.fn()
mock.module('../src/utils/errorHandler.js', {
  namedExports: {
    handleError: mockHandleError
  }
})

mock.module('../src/utils/imageGen.js', {
  namedExports: {
    getGenImageUrl: mock.fn(prompt => `url://${prompt}`),
    IMG_PROMPTS: { NOTE_SKULL: 'skull', NOTE_LIGHTNING: 'lightning' }
  }
})

const mockTextureSkull = { id: 'skull' }
const mockTextureLightning = { id: 'lightning' }

let mockCalculateNoteYResult = 0
const mockPixiStageUtils = {
  calculateNoteY: mock.fn(() => mockCalculateNoteYResult),
  loadTexture: mock.fn(async url => {
    if (url?.includes('skull')) return mockTextureSkull
    if (url?.includes('lightning')) return mockTextureLightning
    return null
  }),
  loadTextures: mock.fn(async (urlMap, onError) => {
    const results = {}
    for (const key in urlMap) {
      if (Object.hasOwn(urlMap, key)) {
        const url = urlMap[key]
        if (url?.includes('skull')) {
          results[key] = mockTextureSkull
        } else if (url?.includes('lightning')) {
          results[key] = mockTextureLightning
        } else {
          results[key] = null
          if (onError)
            onError(
              new Error(`${key} texture returned null`),
              `Note ${key} texture failed to load.`
            )
        }
      }
    }
    return results
  })
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

  beforeEach(async () => {
    // Dynamic import to ensure mocks are applied
    const pixiModule = await import('pixi.js')
    PIXI = pixiModule

    const managerModule = await import('../src/components/stage/NoteManager.js')
    NoteManager = managerModule.NoteManager

    // Reset mocks
    mockPixiStageUtils.calculateNoteY.mock.resetCalls()
    mockAcquireSpriteFromPool.mock.resetCalls()
    mockDestroyNoteSprite.mock.resetCalls()
    mockPoolDispose.mock.resetCalls()

    parentContainer = new PIXI.Container()
    gameStateRef = {
      current: { lanes: [{ color: 0xff0000, renderX: 100, active: false }] }
    }

    const app = new PIXI.Application()

    noteManager = new NoteManager(app, parentContainer, gameStateRef, mock.fn())
    noteManager.init()
    mockHandleError.mock.resetCalls()
  })

  afterEach(() => {
    mockNoteTextures.skull = null
    mockNoteTextures.lightning = null
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

  test('loadAssets reports error when loadTextures returns null', async () => {
    mockPixiStageUtils.loadTextures.mock.mockImplementationOnce(
      async (urlMap, onError) => {
        const results = {}
        for (const key in urlMap) {
          if (Object.hasOwn(urlMap, key)) {
            results[key] = null
            if (onError)
              onError(
                new Error(`${key} texture returned null`),
                `Note ${key} texture failed to load.`
              )
          }
        }
        return results
      }
    )

    await noteManager.loadAssets()

    assert.equal(mockNoteTextures.skull, null)
    assert.equal(mockNoteTextures.lightning, null)
    assert.equal(mockHandleError.mock.calls.length, 2)
    assert.ok(mockHandleError.mock.calls[0].arguments[0] instanceof Error)
    assert.equal(
      mockHandleError.mock.calls[0].arguments[0].message,
      'skull texture returned null'
    )
    assert.equal(
      mockHandleError.mock.calls[1].arguments[0].message,
      'lightning texture returned null'
    )
  })

  test('update spawns notes when time is reached', () => {
    const { note, state } = createMockNoteAndState()
    // 3000 - 2000 (NOTE_SPAWN_LEAD_MS) = 1000

    mockAcquireSpriteFromPool.mock.mockImplementation(() => new PIXI.Sprite())

    // Before spawn time
    noteManager.update(state, 900, {})
    assert.equal(noteManager.activeEntities.length, 0)

    // At spawn time
    noteManager.update(state, 1000, {})
    assert.equal(noteManager.activeEntities.length, 1)
    assert.ok(noteManager.activeEntities.some(e => e.note === note))
    assert.equal(mockAcquireSpriteFromPool.mock.calls.length, 1)
  })

  test('update positions visible notes', () => {
    mockCalculateNoteYResult = 500
    const { note, state } = createMockNoteAndState()

    mockAcquireSpriteFromPool.mock.mockImplementation(() => new PIXI.Sprite())

    // Spawn first
    noteManager.update(state, 1000, {})
    const sprite = noteManager.activeEntities.find(e => e.note === note)?.sprite

    // Update again
    noteManager.update(state, 1100, { hitLineY: 800 })

    assert.equal(mockPixiStageUtils.calculateNoteY.mock.calls.length, 2)
    // Verify call arguments for the second call
    const args = mockPixiStageUtils.calculateNoteY.mock.calls[1].arguments
    assert.equal(args[0], 1100) // elapsed
    assert.equal(args[1], 3000) // note.time
    assert.equal(args[2], 800) // targetY
    assert.equal(args[3], 1) // speed

    assert.equal(sprite.y, 500)
    assert.equal(sprite.x, 150) // 100 (lane) + 50 (offset) + 0 (jitter)
  })

  test('update handles hit notes and calls onHit', () => {
    const onHitMock = mock.fn()
    noteManager.onHit = onHitMock
    const { note, state } = createMockNoteAndState()

    mockAcquireSpriteFromPool.mock.mockImplementation(() => new PIXI.Sprite())

    // Spawn
    noteManager.update(state, 1000, {})
    const sprite = noteManager.activeEntities.find(e => e.note === note)?.sprite

    // Mark as hit
    note.hit = true
    noteManager.update(state, 1100, {})

    assert.equal(onHitMock.mock.calls.length, 1)
    assert.deepEqual(onHitMock.mock.calls[0].arguments, [
      sprite.x,
      sprite.y,
      0xff0000
    ])
    assert.equal(
      noteManager.activeEntities.some(e => e.note === note),
      false
    )
    assert.equal(mockDestroyNoteSprite.mock.calls.length, 1) // Returned to pool
  })

  test('dispose clears resources', () => {
    const { state } = createMockNoteAndState()

    mockAcquireSpriteFromPool.mock.mockImplementation(() => new PIXI.Sprite())

    // Spawn
    noteManager.update(state, 1000, {})

    noteManager.dispose()

    assert.equal(noteManager.activeEntities.length, 0)
    assert.equal(noteManager.pool, null)
    assert.equal(noteManager.container, null)
    assert.equal(mockPoolDispose.mock.calls.length, 1)
  })

  // ── notesVersion-based song-transition reset ──────────────────────────────

  test('notesVersion: initial call resets lastNotesVersion from null to 0', () => {
    const note = { time: 3000, laneIndex: 0, visible: true, hit: false }
    const state = {
      notes: [note],
      lanes: gameStateRef.current.lanes,
      modifiers: {},
      speed: 1,
      notesVersion: 0
    }

    assert.equal(noteManager.lastNotesVersion, null, 'starts at null')

    // elapsed 900 < note.time(3000) - SPAWN_LEAD(2000) = 1000 → no spawn yet
    noteManager.update(state, 900, {})

    assert.equal(
      noteManager.lastNotesVersion,
      0,
      'lastNotesVersion should update to 0'
    )
    assert.equal(
      noteManager.nextRenderIndex,
      0,
      'nextRenderIndex stays 0 (note not yet due)'
    )
    assert.equal(noteManager.activeEntities.length, 0, 'no sprites created yet')
  })

  test('notesVersion: same version on subsequent calls does not reset render index', () => {
    const note = { time: 3000, laneIndex: 0, visible: true, hit: false }
    const state = {
      notes: [note],
      lanes: gameStateRef.current.lanes,
      modifiers: {},
      speed: 1,
      notesVersion: 0
    }
    mockAcquireSpriteFromPool.mock.mockImplementation(() => new PIXI.Sprite())

    noteManager.update(state, 900, {}) // first: reset null→0, no spawn
    noteManager.update(state, 1000, {}) // second: same version, spawns note
    assert.equal(noteManager.nextRenderIndex, 1, 'index advances after spawn')

    noteManager.update(state, 1100, {}) // third: same version — no reset
    assert.equal(noteManager.lastNotesVersion, 0, 'lastNotesVersion unchanged')
    assert.ok(
      noteManager.nextRenderIndex >= 1,
      'nextRenderIndex not rolled back'
    )
  })

  test('notesVersion: version change resets render index and destroys existing sprites', () => {
    const note = { time: 3000, laneIndex: 0, visible: true, hit: false }
    const state = {
      notes: [note],
      lanes: gameStateRef.current.lanes,
      modifiers: {},
      speed: 1,
      notesVersion: 0
    }
    mockAcquireSpriteFromPool.mock.mockImplementation(() => new PIXI.Sprite())

    noteManager.update(state, 900, {}) // reset null→0
    noteManager.update(state, 1000, {}) // spawn sprite
    assert.equal(
      noteManager.activeEntities.length,
      1,
      'sprite exists before transition'
    )
    assert.equal(noteManager.nextRenderIndex, 1)

    // Song transition: new notes array, incremented notesVersion.
    // Use a high note.time so the reset update doesn't trigger a spawn
    // (elapsed=0 < 5000 - SPAWN_LEAD(2000) = 3000).
    const note2 = { time: 5000, laneIndex: 0, visible: true, hit: false }
    const state2 = {
      notes: [note2],
      lanes: gameStateRef.current.lanes,
      modifiers: {},
      speed: 1,
      notesVersion: 1
    }

    noteManager.update(state2, 0, {})

    assert.equal(
      noteManager.lastNotesVersion,
      1,
      'lastNotesVersion updated to 1'
    )
    assert.equal(noteManager.nextRenderIndex, 0, 'nextRenderIndex reset to 0')
    assert.equal(
      noteManager.activeEntities.length,
      0,
      'old sprites cleared on version change'
    )
  })

  test('notesVersion: dispose resets lastNotesVersion to null', () => {
    const note = { time: 3000, laneIndex: 0, visible: true, hit: false }
    const state = {
      notes: [note],
      lanes: gameStateRef.current.lanes,
      modifiers: {},
      speed: 1,
      notesVersion: 7
    }

    noteManager.update(state, 900, {})
    assert.equal(
      noteManager.lastNotesVersion,
      7,
      'lastNotesVersion set before dispose'
    )

    noteManager.dispose()
    assert.equal(noteManager.activeEntities.length, 0)
    assert.equal(
      noteManager.lastNotesVersion,
      null,
      'dispose resets lastNotesVersion to null'
    )
  })

})
