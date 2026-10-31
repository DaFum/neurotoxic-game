import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

// In order to properly mock the audio context for createAndConnectBufferSource,
// we just mock context.js using module mocking

mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    getRawAudioContext: () => {
      return (
        globalThis.__mockRawContext || {
          createBufferSource: () => ({ connect: () => {} })
        }
      )
    },
    ensureAudioContext: async () => true,
    getToneStartTimeSec: t => t,
    getAudioContextTimeSec: () => 0
  }
})

test('createAndConnectBufferSource', async t => {
  const { audioState } = await import('../../src/utils/audio/state')
  const { createAndConnectBufferSource } =
    await import('../../src/utils/audio/sharedBufferUtils')

  t.afterEach(() => {
    audioState.musicGain = null
    globalThis.__mockRawContext = null
  })

  await t.test(
    'creates source, connects to musicGain.input, and wires onEnded',
    () => {
      let connectedTo = null
      const mockSource = {
        connect: node => {
          connectedTo = node
        }
      }

      globalThis.__mockRawContext = {
        createBufferSource: () => mockSource
      }

      const mockGainInput = { name: 'mockInput' }
      audioState.musicGain = { input: mockGainInput }

      const mockBuffer = { duration: 10 }

      let onEndedCalled = false
      const onEndedCb = src => {
        assert.strictEqual(src, mockSource)
        onEndedCalled = true
      }

      const result = createAndConnectBufferSource(mockBuffer, onEndedCb)

      assert.strictEqual(result, mockSource)
      assert.strictEqual(result.buffer, mockBuffer)
      assert.strictEqual(connectedTo, mockGainInput)

      result.onended()
      assert.strictEqual(onEndedCalled, true)
    }
  )

  await t.test('connects directly to musicGain if no input prop', () => {
    let connectedTo = null
    const mockSource = {
      connect: node => {
        connectedTo = node
      }
    }

    globalThis.__mockRawContext = {
      createBufferSource: () => mockSource
    }

    const mockGain = { name: 'mockGain' }
    audioState.musicGain = mockGain

    const result = createAndConnectBufferSource({}, null)

    assert.strictEqual(result, mockSource)
    assert.strictEqual(connectedTo, mockGain)
    assert.strictEqual(result.onended, undefined)
  })

  await t.test('returns null if musicGain is missing', () => {
    const mockSource = { connect: () => {} }

    globalThis.__mockRawContext = {
      createBufferSource: () => mockSource
    }

    audioState.musicGain = null

    const result = createAndConnectBufferSource({})

    assert.strictEqual(result, null)
  })
})

test('cleanupEndedSource', async t => {
  const { cleanupEndedSource } =
    await import('../../src/utils/audio/sharedBufferUtils')

  await t.test('detaches onended and disconnects the source once', () => {
    const source = {
      onended: () => {},
      disconnect: mock.fn(),
      stop: mock.fn()
    }

    cleanupEndedSource(source)

    assert.strictEqual(source.onended, null)
    assert.strictEqual(source.disconnect.mock.callCount(), 1)
    assert.strictEqual(source.stop.mock.callCount(), 0)
  })

  await t.test('does not throw when disconnect throws', () => {
    const source = {
      onended: () => {},
      disconnect: mock.fn(() => {
        throw new Error('already disconnected')
      })
    }

    assert.doesNotThrow(() => cleanupEndedSource(source))
    assert.strictEqual(source.onended, null)
    assert.strictEqual(source.disconnect.mock.callCount(), 1)
  })
})
