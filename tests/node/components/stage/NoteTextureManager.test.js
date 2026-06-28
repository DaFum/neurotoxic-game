import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

const mockErrorHandler = {
  handleError: mock.fn()
}

mock.module(
  new URL('../../../../src/utils/errorHandler.ts', import.meta.url).href,
  {
    namedExports: {
      handleError: mockErrorHandler.handleError
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

mock.module('pixi.js', {
  namedExports: {
    Texture: {}
  }
})

mock.module(
  new URL('../../../../src/utils/imageGen.ts', import.meta.url).href,
  {
    namedExports: {
      IMG_PROMPTS: {
        NOTE_SKULL: 'note_skull',
        NOTE_LIGHTNING: 'note_lightning'
      },
      resolveGenImageUrl: mock.fn(() => 'mock_url')
    }
  }
)

test('NoteTextureManager', async t => {
  const { NoteTextureManager } = await import(
    '../../../../src/components/stage/NoteTextureManager.ts'
  )

  await t.test('loadAssets - handles error path', async () => {
    mockErrorHandler.handleError.mock.resetCalls()

    const manager = new NoteTextureManager()

    await manager.loadAssets()

    assert.equal(mockErrorHandler.handleError.mock.calls.length, 1)

    const callArgs = mockErrorHandler.handleError.mock.calls[0].arguments
    assert.ok(callArgs[0] instanceof Error)
    assert.equal(callArgs[0].message, 'Test load error')
    assert.deepEqual(callArgs[1], {
      fallbackMessage: 'Critical error loading note textures.'
    })
  })
})
