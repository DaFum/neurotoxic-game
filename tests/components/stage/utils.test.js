import { test, mock, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { withTimeout } from '../../../src/components/stage/stageRenderUtils'

describe('withTimeout', () => {
  afterEach(() => {
    mock.timers.reset()
  })

  test('resolves null when promise rejects', async () => {
    const rejectingPromise = Promise.reject(new Error('Test rejection'))
    const result = await withTimeout(rejectingPromise, 'TestLabel')
    assert.equal(result, null)
  })

  test('resolves null on timeout', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    try {
      const hangingPromise = new Promise(() => {}) // Never resolves
      const timeoutPromise = withTimeout(hangingPromise, 'TestLabel', 100)
      mock.timers.tick(100)
      const result = await timeoutPromise
      assert.equal(result, null)
    } finally {
      mock.timers.reset()
    }
  })

  test('resolves successfully when promise completes', async () => {
    const successPromise = Promise.resolve({ data: 'test' })
    const result = await withTimeout(successPromise, 'TestLabel')
    assert.deepEqual(result, { data: 'test' })
  })

  test('uses custom timeout value', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    try {
      const hangingPromise = new Promise(() => {})
      const timeoutPromise = withTimeout(hangingPromise, 'TestLabel', 500)
      mock.timers.tick(500)
      const result = await timeoutPromise
      assert.equal(result, null)
    } finally {
      mock.timers.reset()
    }
  })

  test('handles error objects without message property', async () => {
    const rejectingPromise = Promise.reject('string error')
    const result = await withTimeout(rejectingPromise, 'TestLabel')
    assert.equal(result, null)
  })

  test('rethrows a rejection when asked to, but still resolves null on timeout', async () => {
    await assert.rejects(
      withTimeout(Promise.reject(new Error('boom')), 'TestLabel', 100, {
        rethrow: true
      }),
      /boom/
    )

    mock.timers.enable({ apis: ['setTimeout'] })
    try {
      const hanging = withTimeout(new Promise(() => {}), 'TestLabel', 100, {
        rethrow: true
      })
      mock.timers.tick(100)
      assert.equal(await hanging, null)
    } finally {
      mock.timers.reset()
    }
  })
})
