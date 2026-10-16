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

// Mock other dependencies
const mockHandleError = mock.fn()
mock.module(new URL('../../src/utils/errorHandler.ts', import.meta.url).href, {
  namedExports: {
    handleError: mockHandleError
  }
})

const getSafeRandom = mock.fn(() => 0.5)
mock.module(new URL('../../src/utils/crypto.ts', import.meta.url).href, {
  namedExports: {
    getSafeRandom
  }
})

describe('NoteSpritePool', () => {
  let pool
  let container
  let PIXI
  let NoteSpritePool
  let randomMock

  beforeEach(async () => {
    randomMock = mock.method(Math, 'random', () => 0.5)

    // Dynamic import to ensure mocks are applied
    const pixiModule = await import('pixi.js')
    PIXI = pixiModule

    const poolModule = await import('../../src/components/stage/NoteSpritePool')
    NoteSpritePool = poolModule.NoteSpritePool

    container = new PIXI.Container()
    pool = new NoteSpritePool(container)
    mockHandleError.mock.resetCalls()
    getSafeRandom.mock.resetCalls()
    getSafeRandom.mock.mockImplementation(() => 0.5)
  })

  test('acquireSpriteFromPool selects lane textures and the available fallback', () => {
    pool.noteTextures.skull = { id: 'skull' }
    pool.noteTextures.lightning = { id: 'lightning' }

    // Skull lane
    assert.equal(
      pool.acquireSpriteFromPool({ color: 0 }, 0).texture.id,
      'skull'
    )

    // Lightning lane
    assert.equal(
      pool.acquireSpriteFromPool({ color: 0 }, 1).texture.id,
      'lightning'
    )

    // Missing lightning falls back to skull
    pool.noteTextures.lightning = null
    assert.equal(
      pool.acquireSpriteFromPool({ color: 0 }, 1).texture.id,
      'skull'
    )

    // Missing skull falls back to lightning
    pool.noteTextures.lightning = { id: 'lightning' }
    pool.noteTextures.skull = null
    assert.equal(
      pool.acquireSpriteFromPool({ color: 0 }, 0).texture.id,
      'lightning'
    )
  })

  afterEach(() => {
    randomMock.mock.restore()
  })

  test('acquireSpriteFromPool returns a new sprite if pool is empty', () => {
    pool.noteTextures.skull = { id: 'skull' }
    const lane = { color: 0x00ff00, renderX: 200 }

    const sprite = pool.acquireSpriteFromPool(lane, 0)

    assert.ok(sprite instanceof PIXI.Sprite)
    assert.equal(sprite.tint, 0x00ff00)
    assert.equal(sprite.x, 250) // 200 + 50 (NOTE_CENTER_OFFSET)
    assert.equal(sprite.y, -50) // NOTE_INITIAL_Y
    assert.equal(sprite.width, 80) // NOTE_SPRITE_SIZE
    assert.equal(sprite.height, 80) // NOTE_SPRITE_SIZE
  })

  test('acquireSpriteFromPool reuses a sprite from the pool', () => {
    pool.noteTextures.skull = { id: 'skull' }
    const lane = { color: 0x00ff00, renderX: 200 }

    // Create a sprite and put it in the pool
    const pooledSprite = new PIXI.Sprite()
    pooledSprite.visible = false
    pool.spritePool.push(pooledSprite)

    const sprite = pool.acquireSpriteFromPool(lane, 0)

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

  test('acquireSpriteFromPool creates a centered fallback Sprite with WHITE texture', () => {
    pool.noteTextures = { skull: null, lightning: null }

    const sprite = pool.acquireSpriteFromPool({ color: 0 }, 0)

    assert.ok(sprite instanceof PIXI.Sprite)
    assert.equal(sprite.texture.id, 'white')
    assert.equal(sprite.isFallback, true)

    assert.deepEqual(sprite.anchor.set.mock.calls[0].arguments, [0.5])
    assert.equal(sprite.x, 50)
  })

  test('acquireSpriteFromPool sets properties correctly for fallback sprite', () => {
    const lane = { color: 0x0000ff, renderX: 300 }

    const sprite = pool.acquireSpriteFromPool(lane, 0)

    assert.equal(sprite.x, 350) // 300 + 50
    assert.equal(sprite.y, -50)
    assert.equal(sprite.visible, true)
    assert.equal(sprite.alpha, 1)

    // Check dimensions for fallback (90x20)
    assert.equal(sprite.width, 90)
    assert.equal(sprite.height, 20)
    assert.equal(sprite.isFallback, true)
    assert.equal(sprite.texture.id, 'white')
  })

  // Parametrized: acquired sprite texture selection by lane
  const laneTextureVariants = [
    {
      label: 'sets correct texture for lightning lane [index: 1]',
      laneIndex: 1,
      expectedTexture: 'lightning'
    },
    {
      label: 'sets correct texture for skull lane [index: 0]',
      laneIndex: 0,
      expectedTexture: 'skull'
    }
  ]

  laneTextureVariants.forEach(variant => {
    test(`acquireSpriteFromPool ${variant.label}`, () => {
      const lane = { color: 0x0000ff, renderX: 300 }
      // Ensure textures are set up
      pool.noteTextures.skull = { id: 'skull' }
      pool.noteTextures.lightning = { id: 'lightning' }

      const sprite = pool.acquireSpriteFromPool(lane, variant.laneIndex)

      assert.equal(
        sprite.texture.id,
        variant.expectedTexture,
        `Should use ${variant.expectedTexture} texture`
      )
      assert.equal(sprite.isFallback, false)
    })
  })

  test('acquireSpriteFromPool reuses a Sprite for fallback', () => {
    const lane = { color: 0x0000ff, renderX: 300 }

    // Ensure textures are missing to force fallback logic
    pool.noteTextures = { skull: null, lightning: null }

    const pooledSprite = new PIXI.Sprite(PIXI.Texture.WHITE)
    pooledSprite.visible = false
    pooledSprite.isFallback = true
    pool.spritePool.push(pooledSprite)

    const sprite = pool.acquireSpriteFromPool(lane, 0)

    assert.equal(sprite, pooledSprite)
    assert.equal(sprite.visible, true)
    assert.equal(sprite.x, 350) // 300 + 50
    assert.equal(sprite.y, -50)
    assert.equal(sprite.alpha, 1)

    // Check dimensions
    assert.equal(sprite.width, 90)
    assert.equal(sprite.height, 20)
    assert.equal(sprite.isFallback, true)
  })

  test('acquireSpriteFromPool draws one fresh jitter value for new and reused sprites', () => {
    pool.noteTextures.skull = { id: 'skull' }
    const lane = { color: 0x00ff00, renderX: 100 }
    getSafeRandom.mock.mockImplementationOnce(() => 0.25, 0)
    getSafeRandom.mock.mockImplementationOnce(() => 0.75, 1)

    const sprite = pool.acquireSpriteFromPool(lane, 0)
    assert.equal(sprite.jitterOffset, -2.5)
    assert.equal(getSafeRandom.mock.calls.length, 1)

    pool.releaseSpriteToPool(sprite)
    const reused = pool.acquireSpriteFromPool(lane, 0)
    assert.equal(reused, sprite)
    assert.equal(reused.jitterOffset, 2.5)
    assert.equal(getSafeRandom.mock.calls.length, 2)
  })

  test('reused sprites adapt to changed shared textures without destroying them', () => {
    const skull = { id: 'skull', destroy: mock.fn() }
    const lightning = { id: 'lightning', destroy: mock.fn() }
    pool.noteTextures = { skull, lightning }

    const sprite = pool.acquireSpriteFromPool({ color: 0x00ff00 }, 0)
    assert.equal(sprite.texture, skull)
    assert.deepEqual(sprite.anchor.set.mock.calls[0].arguments, [0.5])

    pool.destroyNoteSprite(sprite)
    assert.equal(
      pool.acquireSpriteFromPool({ color: 0x0000ff, renderX: 300 }, 1),
      sprite
    )
    assert.equal(sprite.texture, lightning)
    assert.equal(sprite.tint, 0x0000ff)
    assert.equal(sprite.x, 350)

    pool.destroyNoteSprite(sprite)
    pool.noteTextures = { skull: null, lightning: null }
    assert.equal(pool.acquireSpriteFromPool({ color: 0 }, 0), sprite)
    assert.equal(sprite.texture, PIXI.Texture.WHITE)
    assert.equal(sprite.isFallback, true)
    assert.equal(sprite.width, 90)
    assert.equal(sprite.height, 20)

    pool.destroyNoteSprite(sprite)
    pool.noteTextures = { skull, lightning }
    assert.equal(pool.acquireSpriteFromPool({ color: 0 }, 0), sprite)
    assert.equal(sprite.texture, skull)
    assert.equal(sprite.isFallback, false)
    assert.equal(sprite.width, 80)
    assert.equal(sprite.height, 80)

    pool.destroyNoteSprite(sprite)
    pool.dispose()
    assert.equal(skull.destroy.mock.calls.length, 0)
    assert.equal(lightning.destroy.mock.calls.length, 0)
    assert.deepEqual(sprite.destroy.mock.calls[0].arguments, [])
  })

  test('releaseSpriteToPool respects MAX_POOL_SIZE', () => {
    // Override MAX_POOL_SIZE for this test
    const originalMax = pool.maxPoolSize
    pool.maxPoolSize = 2

    try {
      pool.spritePool = []

      const sprite1 = { destroy: mock.fn(), visible: true }
      const sprite2 = { destroy: mock.fn(), visible: true }
      const sprite3 = { destroy: mock.fn(), visible: true }

      pool.releaseSpriteToPool(sprite1)
      pool.releaseSpriteToPool(sprite2)
      pool.releaseSpriteToPool(sprite3)

      assert.equal(pool.spritePool.length, 2)
      assert.equal(sprite1.visible, false)
      assert.equal(sprite2.visible, false)
      assert.equal(sprite3.visible, false)
      assert.equal(sprite3.destroy.mock.calls.length, 1)
      assert.equal(sprite1.destroy.mock.calls.length, 0)
    } finally {
      pool.maxPoolSize = originalMax
    }
  })

  test('dispose clears resources', () => {
    // Create a pool item
    const mockSprite = new PIXI.Sprite()
    pool.spritePool.push(mockSprite)

    pool.dispose()

    assert.equal(pool.spritePool.length, 0)
    assert.equal(pool.container, null)
    assert.equal(mockSprite.destroy.mock.calls.length, 1)
  })
})
