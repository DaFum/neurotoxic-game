import assert from 'node:assert'
import { test, mock } from 'node:test'
import { createMockTone } from './mockUtils.js'

// Mock Tone.js
const mockTone = createMockTone()
mock.module('tone', { namedExports: mockTone })

// Mock logger
const mockLogger = {
  warn: mock.fn(),
  debug: mock.fn(),
  error: mock.fn(),
  info: mock.fn()
}
mock.module('../src/utils/logger.js', {
  namedExports: { logger: mockLogger }
})

// Mock audioState
const mockAudioState = {
  loop: null,
  part: null,
  midiParts: []
}
mock.module('../src/utils/audio/state.js', {
  namedExports: { audioState: mockAudioState }
})

// Import SUT
const {
  clearTransportEvent,
  stopAndDisconnectSource,
  stopTransportAndClear
} = await import('../src/utils/audio/cleanupUtils.js')

test('clearTransportEvent', async t => {
  t.beforeEach(() => {
    mockTone.getTransport().clear.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
  })

  await t.test('returns early if id is null', () => {
    clearTransportEvent(null, 'testEvent')
    assert.strictEqual(mockTone.getTransport().clear.mock.calls.length, 0)
  })

  await t.test('returns early if id is undefined', () => {
    clearTransportEvent(undefined, 'testEvent')
    assert.strictEqual(mockTone.getTransport().clear.mock.calls.length, 0)
  })

  await t.test('calls transport clear if id is provided', () => {
    const id = 123
    clearTransportEvent(id, 'testEvent')
    assert.strictEqual(mockTone.getTransport().clear.mock.calls.length, 1)
    assert.strictEqual(mockTone.getTransport().clear.mock.calls[0].arguments[0], id)
  })

  await t.test('handles errors and logs warning', () => {
    const error = new Error('Tone error')
    mockTone.getTransport().clear.mock.mockImplementationOnce(() => {
      throw error
    })

    clearTransportEvent(456, 'errorEvent')

    assert.strictEqual(mockLogger.warn.mock.calls.length, 1)
    const [channel, message, err] = mockLogger.warn.mock.calls[0].arguments
    assert.strictEqual(channel, 'AudioEngine')
    assert.match(message, /Failed to clear transport errorEvent event/)
    assert.strictEqual(err, error)
  })
})

test('stopAndDisconnectSource', async t => {
  t.beforeEach(() => {
    mockLogger.debug.mock.resetCalls()
  })

  await t.test('returns early if source is null', () => {
    stopAndDisconnectSource(null, 'testSource')
    // No error should occur
  })

  await t.test('calls stop and disconnect on source', () => {
    const mockSource = {
      stop: mock.fn(),
      disconnect: mock.fn()
    }
    stopAndDisconnectSource(mockSource, 'testSource')
    assert.strictEqual(mockSource.stop.mock.calls.length, 1)
    assert.strictEqual(mockSource.disconnect.mock.calls.length, 1)
  })

  await t.test('handles stop error and logs debug', () => {
    const error = new Error('Stop failed')
    const mockSource = {
      stop: mock.fn(() => {
        throw error
      }),
      disconnect: mock.fn()
    }
    stopAndDisconnectSource(mockSource, 'testSource')
    assert.strictEqual(mockLogger.debug.mock.calls.length, 1)
    assert.strictEqual(mockLogger.debug.mock.calls[0].arguments[1], 'testSource source stop failed')
    assert.strictEqual(mockLogger.debug.mock.calls[0].arguments[2], error)
    // Should still try to disconnect
    assert.strictEqual(mockSource.disconnect.mock.calls.length, 1)
  })

  await t.test('handles disconnect error and logs debug', () => {
    const error = new Error('Disconnect failed')
    const mockSource = {
      stop: mock.fn(),
      disconnect: mock.fn(() => {
        throw error
      })
    }
    stopAndDisconnectSource(mockSource, 'testSource')
    assert.strictEqual(mockLogger.debug.mock.calls.length, 1)
    assert.strictEqual(mockLogger.debug.mock.calls[0].arguments[1], 'testSource source disconnect failed')
    assert.strictEqual(mockLogger.debug.mock.calls[0].arguments[2], error)
  })
})

test('stopTransportAndClear', async t => {
  t.beforeEach(() => {
    mockTone.getTransport().stop.mock.resetCalls()
    mockTone.getTransport().cancel.mock.resetCalls()
    mockTone.getTransport().position = 10
    mockAudioState.loop = null
    mockAudioState.part = null
    mockAudioState.midiParts = []
  })

  await t.test('stops transport and resets position', () => {
    stopTransportAndClear()
    assert.strictEqual(mockTone.getTransport().stop.mock.calls.length, 1)
    assert.strictEqual(mockTone.getTransport().position, 0)
    assert.strictEqual(mockTone.getTransport().cancel.mock.calls.length, 1)
  })

  await t.test('cleans up loop and part', () => {
    const mockLoop = { dispose: mock.fn() }
    const mockPart = { dispose: mock.fn() }
    mockAudioState.loop = mockLoop
    mockAudioState.part = mockPart

    stopTransportAndClear()

    assert.strictEqual(mockLoop.dispose.mock.calls.length, 1)
    assert.strictEqual(mockPart.dispose.mock.calls.length, 1)
    assert.strictEqual(mockAudioState.loop, null)
    assert.strictEqual(mockAudioState.part, null)
  })

  await t.test('cleans up midiParts', () => {
    const mockPart1 = { dispose: mock.fn() }
    const mockPart2 = { dispose: mock.fn() }
    mockAudioState.midiParts = [mockPart1, mockPart2]

    stopTransportAndClear()

    assert.strictEqual(mockPart1.dispose.mock.calls.length, 1)
    assert.strictEqual(mockPart2.dispose.mock.calls.length, 1)
    assert.strictEqual(mockAudioState.midiParts.length, 0)
  })
})
