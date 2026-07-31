import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  getSafeStorageItem,
  safeStorageOperation,
  setSafeStorageItem
} from '../../src/utils/storage'

describe('storage operation wrappers', () => {
  test('safe item helpers catch a throwing localStorage property getter', () => {
    const originalWindow = globalThis.window
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {}
    })
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError')
      }
    })

    try {
      assert.deepEqual(getSafeStorageItem('blocked', { fallback: true }), {
        fallback: true
      })
      assert.doesNotThrow(() => setSafeStorageItem('blocked', 'value'))
    } finally {
      if (originalWindow === undefined) {
        delete globalThis.window
      } else {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: originalWindow
        })
      }
    }
  })

  test('safeStorageOperation returns fallback when storage work fails', () => {
    const result = safeStorageOperation(
      'testStorageFallback',
      () => {
        throw new Error('storage unavailable')
      },
      'fallback'
    )

    assert.equal(result, 'fallback')
  })

  test('safeStorageOperation treats explicit undefined as a fallback', () => {
    const result = safeStorageOperation(
      'testStorageUndefinedFallback',
      () => {
        throw new Error('storage unavailable')
      },
      undefined
    )

    assert.equal(result, undefined)
  })

  test('safeStorageOperation throws a StorageError without fallback', () => {
    assert.throws(
      () =>
        safeStorageOperation('testStorageThrow', () => {
          throw new Error('storage unavailable')
        }),
      error =>
        error instanceof Error &&
        error.name === 'StorageError' &&
        error.message.includes(
          'Storage operation failed after retries: testStorageThrow'
        )
    )
  })
})
