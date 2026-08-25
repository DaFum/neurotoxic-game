import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { createMockTone } from '../mockUtils'

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
mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: { logger: mockLogger }
})

// Mock audioState
const mockAudioState = {
  loop: null,
  part: null,
  midiParts: [],
  transportEndEventId: null,
  transportStopEventId: null
}

mock.module(new URL('../../src/utils/audio/state.ts', import.meta.url).href, {
  namedExports: { audioState: mockAudioState }
})

// Import SUT
const { clearTransportEvent, stopTransportAndClear, cleanupTransportEvents } =
  await import('../../src/utils/audio/cleanupUtils')

test('clearTransportEvent', async t => {
  t.beforeEach(() => {
    mockTone.getTransport().clear.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
  })

  const clearEventCases = [
    {
      label: 'returns early if id is null',
      id: null,
      eventName: 'testEvent',
      expectedCalls: 0
    },
    {
      label: 'returns early if id is undefined',
      id: undefined,
      eventName: 'testEvent',
      expectedCalls: 0
    },
    {
      label: 'calls transport clear if id is 0',
      id: 0,
      eventName: 'zeroEvent',
      expectedCalls: 1
    },
    {
      label: 'calls transport clear if id is a string',
      id: 'event-id-string',
      eventName: 'stringEvent',
      expectedCalls: 1
    },
    {
      label: 'calls transport clear if id is provided',
      id: 123,
      eventName: 'testEvent',
      expectedCalls: 1
    }
  ]

  for (const { label, id, eventName, expectedCalls } of clearEventCases) {
    await t.test(label, () => {
      clearTransportEvent(id, eventName)
      assert.strictEqual(
        mockTone.getTransport().clear.mock.calls.length,
        expectedCalls
      )
      if (expectedCalls > 0) {
        assert.strictEqual(
          mockTone.getTransport().clear.mock.calls[0].arguments[0],
          id
        )
      }
      assert.strictEqual(mockLogger.warn.mock.calls.length, 0)
    })
  }

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

test('stopTransportAndClear', async t => {
  t.beforeEach(() => {
    mockTone.getTransport().stop.mock.resetCalls()
    mockTone.getTransport().cancel.mock.resetCalls()
    mockTone.getTransport().position = 10
    mockAudioState.loop = null
    mockAudioState.part = null
    mockAudioState.midiParts = []
    mockLogger.warn.mock.resetCalls()
    mockLogger.debug.mock.resetCalls()
  })

  await t.test('stops transport and resets position', () => {
    stopTransportAndClear()
    assert.strictEqual(mockTone.getTransport().stop.mock.calls.length, 1)
    assert.strictEqual(mockTone.getTransport().position, 0)
    assert.strictEqual(mockTone.getTransport().cancel.mock.calls.length, 1)
    // Should not log
    assert.strictEqual(mockLogger.warn.mock.calls.length, 0)
    assert.strictEqual(mockLogger.debug.mock.calls.length, 0)
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

  await t.test('handles already null loop and part', () => {
    mockAudioState.loop = null
    mockAudioState.part = null

    stopTransportAndClear()

    assert.strictEqual(mockAudioState.loop, null)
    assert.strictEqual(mockAudioState.part, null)
    // Should verify it didn't crash
    assert.strictEqual(mockTone.getTransport().stop.mock.calls.length, 1)
  })
})

test('cleanupTransportEvents', async t => {
  t.beforeEach(() => {
    mockTone.getTransport().clear.mock.resetCalls()
    mockAudioState.transportEndEventId = null
    mockAudioState.transportStopEventId = null
  })

  const transportEventCases = [
    {
      label: 'clears transport events and resets IDs',
      endId: 123,
      stopId: 456,
      expectedClearCalls: 2
    },
    {
      label: 'handles null IDs gracefully',
      endId: null,
      stopId: null,
      expectedClearCalls: 0
    }
  ]

  for (const {
    label,
    endId,
    stopId,
    expectedClearCalls
  } of transportEventCases) {
    await t.test(label, () => {
      mockAudioState.transportEndEventId = endId
      mockAudioState.transportStopEventId = stopId
      cleanupTransportEvents()
      assert.strictEqual(
        mockTone.getTransport().clear.mock.calls.length,
        expectedClearCalls
      )
      for (const expectedId of [endId, stopId]) {
        if (expectedId !== null) {
          assert.ok(
            mockTone
              .getTransport()
              .clear.mock.calls.some(c => c.arguments[0] === expectedId)
          )
        }
      }
      assert.strictEqual(mockAudioState.transportEndEventId, null)
      assert.strictEqual(mockAudioState.transportStopEventId, null)
    })
  }
})
