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
    this.destroy = mock.fn()
  }
}

const MockGraphics = class {
  constructor() {
    this.circle = mock.fn()
    this.fill = mock.fn()
    this.stroke = mock.fn()
    this.scale = { set: mock.fn() }
    this.visible = false
    this.alpha = 0
    this.x = 0
    this.y = 0
    this.clear = mock.fn()
    this.destroy = mock.fn()
  }
}

const MockPIXI = {
  Sprite: MockSprite,
  Graphics: MockGraphics,
  Container: class {
    constructor() {
      this.addChild = mock.fn()
      this.removeChild = mock.fn()
      this.destroy = mock.fn()
    }
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
    getGenImageUrl: mock.fn(prompt => `url://${prompt}`),
    IMG_PROMPTS: { HIT_BLOOD: 'blood', HIT_TOXIC: 'toxic' }
  }
})

mock.module('../src/utils/logger.js', {
  namedExports: {
    logger: {
      warn: mock.fn()
    }
  }
})

describe('EffectManager', () => {
  let effectManager
  let parentContainer
  let PIXI
  let EffectManager

  beforeEach(async () => {
    const pixiModule = await import('pixi.js')
    PIXI = pixiModule

    const managerModule = await import('../src/components/stage/EffectManager.js')
    EffectManager = managerModule.EffectManager

    parentContainer = new PIXI.Container()
    const app = {} // minimal mock
    effectManager = new EffectManager(app, parentContainer)
    effectManager.init()
  })

  afterEach(() => {
    if (PIXI && PIXI.Assets && PIXI.Assets.load.mock) {
      PIXI.Assets.load.mock.resetCalls()
      PIXI.Assets.load.mock.mockImplementation(async () => null)
    }
  })

  test('loadAssets loads textures correctly', async () => {
    const mockTextureBlood = { id: 'blood' }
    const mockTextureToxic = { id: 'toxic' }

    PIXI.Assets.load.mock.mockImplementation(async url => {
      if (url.includes('blood')) return mockTextureBlood
      if (url.includes('toxic')) return mockTextureToxic
      return null
    })

    await effectManager.loadAssets()

    assert.equal(effectManager.textures.blood, mockTextureBlood)
    assert.equal(effectManager.textures.toxic, mockTextureToxic)
  })

  test('spawnHitEffect uses blood texture for red colors', () => {
    effectManager.textures.blood = { id: 'blood' }
    effectManager.textures.toxic = { id: 'toxic' }

    // Red color: 0xCC0000 (R=204, G=0, B=0)
    effectManager.spawnHitEffect(100, 100, 0xCC0000)

    assert.equal(effectManager.activeEffects.length, 1)
    const effect = effectManager.activeEffects[0]

    assert.ok(effect instanceof PIXI.Sprite)
    assert.equal(effect.texture, effectManager.textures.blood)
    assert.equal(effect.x, 100)
    assert.equal(effect.y, 100)
    assert.equal(effect.tint, 0xCC0000)
  })

  test('spawnHitEffect uses toxic texture for non-red colors', () => {
    effectManager.textures.blood = { id: 'blood' }
    effectManager.textures.toxic = { id: 'toxic' }

    // Green color: 0x00FF41
    effectManager.spawnHitEffect(100, 100, 0x00FF41)

    assert.equal(effectManager.activeEffects.length, 1)
    const effect = effectManager.activeEffects[0]

    assert.ok(effect instanceof PIXI.Sprite)
    assert.equal(effect.texture, effectManager.textures.toxic)
    assert.equal(effect.tint, 0x00FF41)
  })

  test('spawnHitEffect falls back to Graphics if textures missing', () => {
    effectManager.textures.blood = null
    effectManager.textures.toxic = null

    effectManager.spawnHitEffect(100, 100, 0xCC0000)

    assert.equal(effectManager.activeEffects.length, 1)
    const effect = effectManager.activeEffects[0]

    assert.ok(effect instanceof PIXI.Graphics)
    assert.equal(effect.circle.mock.calls.length, 1)
  })

  test('update handles lifecycle and cleanup', () => {
    effectManager.textures.toxic = { id: 'toxic' }
    effectManager.spawnHitEffect(0, 0, 0xFFFFFF)
    const effect = effectManager.activeEffects[0]

    // Initial state
    assert.equal(effect.life, 1.0)

    // Update (deltaMS = 100ms => 0.1s -> life -= 0.3)
    effectManager.update(100)
    assert.ok(effect.life < 1.0)
    assert.equal(effectManager.activeEffects.length, 1)

    // Update to kill it (large delta)
    effectManager.update(1000)
    assert.equal(effectManager.activeEffects.length, 0)
    // Should be returned to pool, not destroyed immediately unless pool full
    // But since pool is empty, it should be in pool
    assert.equal(effectManager.spritePool.length, 1)
    assert.equal(effect.visible, false)
  })

  test('dispose clears resources and destroys container', () => {
    // Spawn some effects
    effectManager.textures.toxic = { id: 'toxic' }
    effectManager.spawnHitEffect(0, 0, 0xFFFFFF)
    effectManager.spawnHitEffect(1, 1, 0xFFFFFF)

    const effect1 = effectManager.activeEffects[0]
    const effect2 = effectManager.activeEffects[1]
    const container = effectManager.container

    effectManager.dispose()

    assert.equal(effectManager.activeEffects.length, 0)
    assert.equal(effectManager.container, null)

    // Check container destruction
    assert.equal(container.destroy.mock.calls.length, 1)
    assert.deepEqual(container.destroy.mock.calls[0].arguments, [{ children: true }])
  })

  test('spawnHitEffect enforces max active effects limit (50) and recycles', () => {
    effectManager.textures.toxic = { id: 'toxic' }

    // Spawn 51 effects
    for (let i = 0; i < 51; i++) {
      effectManager.spawnHitEffect(i, i, 0xFFFFFF)
    }

    assert.equal(effectManager.activeEffects.length, 50)
    assert.equal(effectManager.spritePool.length, 1) // One recycled

    // The first spawned effect (index 0) should have been removed from active
    // The activeEffects list should now contain effects 1 to 50
    const lastEffect = effectManager.activeEffects[49]
    assert.equal(lastEffect.x, 50)
  })

  test('spawnHitEffect reuses sprites from pool', () => {
    effectManager.textures.toxic = { id: 'toxic' }

    // Create one and kill it to populate pool
    effectManager.spawnHitEffect(0, 0, 0xFFFFFF)
    effectManager.update(1000) // Kill it

    assert.equal(effectManager.spritePool.length, 1)
    const pooledEffect = effectManager.spritePool[0]

    // Spawn new one
    effectManager.spawnHitEffect(100, 100, 0xFFFFFF)

    assert.equal(effectManager.spritePool.length, 0)
    assert.equal(effectManager.activeEffects[0], pooledEffect)
    assert.equal(pooledEffect.visible, true)
    assert.equal(pooledEffect.x, 100)
  })
})
