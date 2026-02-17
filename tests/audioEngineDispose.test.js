import assert from 'node:assert'
import { test, mock } from 'node:test'
import { logger } from '../src/utils/logger.js'
import {
  MockPolySynth,
  createMockTone
} from './mockUtils.js'

// Save original dispose to restore later
const originalDispose = MockPolySynth.prototype.dispose

// Override MockPolySynth dispose for this test
MockPolySynth.prototype.dispose = function () {
  if (MockPolySynth.shouldThrowOnDispose) {
    throw new Error('Dispose failed')
  }
  // Call original if needed, but it's empty in mockUtils
}

const mockTone = createMockTone()

mock.module('tone', { namedExports: mockTone })

// Import SUT
const { setupAudio, disposeAudio } = await import('../src/utils/audioEngine.js')

test('disposeAudio logs error when dispose fails', async t => {
  // Spy on logger.debug
  const debugSpy = mock.method(logger, 'debug')

  t.after(() => {
    MockPolySynth.shouldThrowOnDispose = false
    MockPolySynth.prototype.dispose = originalDispose
    debugSpy.mock.restore()
  })

  // Setup
  await setupAudio()

  // Configure mock to throw
  MockPolySynth.shouldThrowOnDispose = true

  // Act
  disposeAudio()

  // Assert
  // We expect logger.debug to be called at least once with the error message
  const calls = debugSpy.mock.calls
  const found = calls.find(
    call =>
      call.arguments[1] &&
      typeof call.arguments[1] === 'string' &&
      call.arguments[1].includes('Node disposal failed')
  )

  assert.ok(found, 'Should have logged disposal failure')
})
