import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

const mockLogger = {
  warn: mock.fn(),
  error: mock.fn(),
  info: mock.fn()
}

let loadTexturesImpl = async () => {
  throw new Error('Test load error')
}

const mockLoadTextures = mock.fn(async (...args) => loadTexturesImpl(...args))

mock.module(new URL('../../../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: {
    logger: mockLogger
  }
})

mock.module(
  new URL(
    '../../../../src/components/stage/stageRenderUtils.ts',
    import.meta.url
  ).href,
  {
    namedExports: {
      loadTextures: mockLoadTextures,
      getPixiColorFromToken: mock.fn(() => 0xffffff),
      getOptimalResolution: mock.fn(() => 1)
    }
  }
)

mock.module('pixi.js', {
  namedExports: {
    Graphics: class {
      circle() {}
      fill() {}
      stroke() {}
      destroy() {}
    },
    Texture: {
      WHITE: {}
    }
  }
})

mock.module(
  new URL('../../../../src/utils/imageGen.ts', import.meta.url).href,
  {
    namedExports: {
      IMG_PROMPTS: {
        HIT_BLOOD: 'hit_blood',
        HIT_TOXIC: 'hit_toxic'
      },
      resolveGenImageUrl: mock.fn(() => 'mock_url')
    }
  }
)

test('EffectTextureManager', async t => {
  const { EffectTextureManager } =
    await import('../../../../src/components/stage/EffectTextureManager.ts')

  await t.test('loadAssets - handles error path', async () => {
    mockLogger.warn.mock.resetCalls()
    loadTexturesImpl = async () => {
      throw new Error('Test load error')
    }

    const mockApp = {
      renderer: {}
    }
    const manager = new EffectTextureManager(mockApp)

    await manager.loadAssets()

    assert.equal(mockLogger.warn.mock.calls.length, 1)

    const warnCall = mockLogger.warn.mock.calls[0].arguments
    assert.equal(warnCall[0], 'EffectTextureManager')
    assert.equal(warnCall[1], 'Effect textures failed to load')
    assert.ok(warnCall[2] instanceof Error)
    assert.equal(warnCall[2].message, 'Test load error')
  })

  await t.test(
    'late cached textures are not retained after disposal',
    async () => {
      let resolveTextures
      loadTexturesImpl = () =>
        new Promise(resolve => {
          resolveTextures = resolve
        })

      const manager = new EffectTextureManager({ renderer: {} })
      const loading = manager.loadAssets()
      manager.dispose()

      const blood = { destroy: mock.fn() }
      const toxic = { destroy: mock.fn() }
      resolveTextures({ blood, toxic })
      await loading

      assert.deepEqual(manager.textures, { blood: null, toxic: null })
      assert.equal(blood.destroy.mock.calls.length, 0)
      assert.equal(toxic.destroy.mock.calls.length, 0)
    }
  )

  await t.test('dispose leaves shared cached textures alive', async () => {
    const blood = { destroy: mock.fn() }
    const toxic = { destroy: mock.fn() }
    loadTexturesImpl = async () => ({ blood, toxic })

    const manager = new EffectTextureManager({ renderer: {} })
    await manager.loadAssets()
    manager.dispose()

    assert.equal(blood.destroy.mock.calls.length, 0)
    assert.equal(toxic.destroy.mock.calls.length, 0)
  })
})
