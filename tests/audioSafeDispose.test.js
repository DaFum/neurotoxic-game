import assert from 'node:assert'
import { test, mock } from 'node:test'
import { logger } from '../src/utils/logger.js'
import { safeDispose } from '../src/utils/audio/dispose.js'

test('safeDispose', async t => {
  await t.test('returns null when node is null', () => {
    const result = safeDispose(null)
    assert.strictEqual(result, null)
  })

  await t.test('returns null when node is undefined', () => {
    const result = safeDispose(undefined)
    assert.strictEqual(result, null)
  })

  await t.test('returns null when node does not have dispose method', () => {
    const result = safeDispose({ notADisposeMethod: () => {} })
    assert.strictEqual(result, null)
  })

  await t.test('calls dispose() and returns null when node is valid', () => {
    const disposeMock = mock.fn()
    const node = { dispose: disposeMock }

    const result = safeDispose(node)

    assert.strictEqual(disposeMock.mock.calls.length, 1)
    assert.strictEqual(result, null)
  })

  await t.test(
    'swallows error, logs it, and returns null when dispose() throws',
    () => {
      const error = new Error('Disposal failed')
      const disposeMock = mock.fn(() => {
        throw error
      })
      const node = { dispose: disposeMock }

      // Spy on logger.debug
      const debugSpy = mock.method(logger, 'debug', () => {})

      try {
        const result = safeDispose(node)

        assert.strictEqual(disposeMock.mock.calls.length, 1)
        assert.strictEqual(result, null)

        // Verify logging
        const calls = debugSpy.mock.calls
        assert.ok(calls.length >= 1, 'Should have called logger.debug')

        const lastCall = calls[calls.length - 1]
        assert.strictEqual(lastCall.arguments[0], 'AudioEngine')
        assert.ok(
          lastCall.arguments[1].includes('Node disposal failed'),
          'Log message should contain expected text'
        )
        assert.strictEqual(lastCall.arguments[2], error)
      } finally {
        debugSpy.mock.restore()
      }
    }
  )
})
