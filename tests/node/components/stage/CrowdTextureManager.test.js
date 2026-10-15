import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

const mockHandleError = mock.fn()

// Dynamic mock function setup using closure
let _loadTexturesImpl = async () => {}
const mockLoadTextures = mock.fn(async (...args) => _loadTexturesImpl(...args))

mock.module(
  new URL('../../../../src/utils/errorHandler.ts', import.meta.url).href,
  {
    namedExports: {
      handleError: mockHandleError
    }
  }
)

mock.module(
  new URL(
    '../../../../src/components/stage/stageRenderUtils.ts',
    import.meta.url
  ).href,
  {
    namedExports: {
      loadTextures: mockLoadTextures
    }
  }
)

mock.module(
  new URL('../../../../src/utils/imageGen.ts', import.meta.url).href,
  {
    namedExports: {
      IMG_PROMPTS: {
        CROWD_IDLE: 'crowd_idle',
        CROWD_MOSH: 'crowd_mosh'
      },
      resolveGenImageUrl: mock.fn(() => 'mock_url')
    }
  }
)

test('CrowdTextureManager', async t => {
  const { CrowdTextureManager } =
    await import('../../../../src/components/stage/CrowdTextureManager.ts')

  await t.test('loadAssets - handles error path', async () => {
    mockHandleError.mock.resetCalls()
    mockLoadTextures.mock.resetCalls()
    _loadTexturesImpl = async () => {
      throw new Error('Test load error')
    }

    const manager = new CrowdTextureManager()
    await manager.loadAssets()

    assert.equal(mockHandleError.mock.calls.length, 1)

    const handleErrorArgs = mockHandleError.mock.calls[0].arguments
    assert.ok(handleErrorArgs[0] instanceof Error)
    assert.equal(handleErrorArgs[0].message, 'Test load error')
    assert.deepEqual(handleErrorArgs[1], {
      fallbackMessage: 'Critical error loading crowd textures.',
      silent: true
    })
  })

  await t.test('loadAssets - handles happy path', async () => {
    mockHandleError.mock.resetCalls()
    mockLoadTextures.mock.resetCalls()

    const mockTextures = {
      idle: { destroy: mock.fn() },
      mosh: { destroy: mock.fn() }
    }

    _loadTexturesImpl = async () => mockTextures

    const manager = new CrowdTextureManager()
    await manager.loadAssets()

    assert.equal(mockHandleError.mock.calls.length, 0)
    assert.equal(manager.textures.idle, mockTextures.idle)
    assert.equal(manager.textures.mosh, mockTextures.mosh)
  })

  await t.test(
    'dispose - releases borrowed cache textures without destroying them',
    async () => {
      const manager = new CrowdTextureManager()
      const mockIdleDestroy = mock.fn()
      const mockMoshDestroy = mock.fn()

      manager.textures = {
        idle: { destroy: mockIdleDestroy },
        mosh: { destroy: mockMoshDestroy }
      }

      manager.dispose()

      assert.equal(mockIdleDestroy.mock.calls.length, 0)
      assert.equal(mockMoshDestroy.mock.calls.length, 0)
      assert.equal(manager.textures.idle, null)
      assert.equal(manager.textures.mosh, null)
    }
  )

  await t.test(
    'overlapping loads - disposed manager leaves shared textures intact for the live one',
    async () => {
      mockHandleError.mock.resetCalls()
      const sharedTextures = {
        idle: { destroy: mock.fn() },
        mosh: { destroy: mock.fn() }
      }
      let resolveShared = () => {}
      const pending = new Promise(resolve => {
        resolveShared = () => resolve(sharedTextures)
      })
      _loadTexturesImpl = () => pending

      const oldManager = new CrowdTextureManager()
      const oldLoad = oldManager.loadAssets()
      oldManager.dispose()

      const liveManager = new CrowdTextureManager()
      const liveLoad = liveManager.loadAssets()

      resolveShared()
      await Promise.all([oldLoad, liveLoad])

      assert.equal(sharedTextures.idle.destroy.mock.calls.length, 0)
      assert.equal(sharedTextures.mosh.destroy.mock.calls.length, 0)
      assert.equal(oldManager.textures.idle, null)
      assert.equal(oldManager.textures.mosh, null)
      assert.equal(liveManager.textures.idle, sharedTextures.idle)
      assert.equal(liveManager.textures.mosh, sharedTextures.mosh)
    }
  )
})
