import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

const mockHandleError = mock.fn()

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
      loadTextures: mock.fn(async () => {
        throw new Error('Test load error')
      })
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
  const { CrowdTextureManager } = await import(
    '../../../../src/components/stage/CrowdTextureManager.ts'
  )

  await t.test('loadAssets - handles error path', async () => {
    mockHandleError.mock.resetCalls()

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
})
