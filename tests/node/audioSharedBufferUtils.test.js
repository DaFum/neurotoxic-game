import assert from 'node:assert'
import { test, mock } from 'node:test'

// In order to properly mock the audio context for createAndConnectBufferSource,
// we just mock context.js using module mocking

mock.module('../../src/utils/audio/context', {
  namedExports: {
    getRawAudioContext: () => {
      return (
        globalThis.__mockRawContext || {
          createBufferSource: () => ({ connect: () => {} })
        }
      )
    },
    ensureAudioContext: async () => true,
    setupAudio: async () => {},
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
