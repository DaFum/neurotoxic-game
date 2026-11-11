import assert from 'node:assert/strict'
import { describe, test, beforeEach, afterEach } from 'node:test'

import {
  discardBufferedStorageItem,
  getSafeStorageItem,
  isStorageItemBuffered,
  resetStorageFallback,
  safeStorageOperation,
  setSafeStorageItem,
  writeStorageItem
} from '../../src/utils/storage'
import { InMemoryAdapter, NoopAdapter } from '../../src/utils/storageAdapter'

describe('storage operation wrappers', () => {
  let origConsoleWarn
  let origConsoleError

  beforeEach(() => {
    origConsoleWarn = console.warn
    origConsoleError = console.error
    console.warn = () => {}
    console.error = () => {}
  })

  afterEach(() => {
    console.warn = origConsoleWarn
    console.error = origConsoleError
  })
  test('safe item helpers catch a throwing localStorage property getter', () => {
    const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'window'
    )
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
      if (originalWindowDescriptor === undefined) {
        delete globalThis.window
      } else {
        Object.defineProperty(globalThis, 'window', originalWindowDescriptor)
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

  test('safeStorageOperation executes operation once without retrying on error', () => {
    let callCount = 0
    const result = safeStorageOperation(
      'testSingleShotFallback',
      () => {
        callCount++
        throw new Error('storage unavailable')
      },
      'fallback'
    )

    assert.equal(result, 'fallback')
    assert.equal(callCount, 1)
  })

  test('safeStorageOperation executes operation once without retrying when throwing', () => {
    let callCount = 0
    assert.throws(
      () =>
        safeStorageOperation('testSingleShotThrow', () => {
          callCount++
          throw new Error('storage unavailable')
        }),
      error =>
        error instanceof Error &&
        error.name === 'StorageError' &&
        error.message.includes(
          'Storage operation failed after retries: testSingleShotThrow'
        )
    )
    assert.equal(callCount, 1)
  })

  describe('isStorageItemBuffered', () => {
    test('returns false for absent or non-buffered keys', () => {
      assert.equal(isStorageItemBuffered('non_existent_key'), false)
    })

    test('reports true when write falls back to in-memory store and false after discard', () => {
      const noopAdapter = new NoopAdapter()
      assert.equal(isStorageItemBuffered('buffered_key', noopAdapter), false)

      writeStorageItem('buffered_key', 'some_value', noopAdapter)
      assert.equal(isStorageItemBuffered('buffered_key', noopAdapter), true)

      discardBufferedStorageItem('buffered_key', noopAdapter)
      assert.equal(isStorageItemBuffered('buffered_key', noopAdapter), false)
    })

    test('reports false after resetStorageFallback', () => {
      const noopAdapter = new NoopAdapter()
      writeStorageItem('buffered_key', 'some_value', noopAdapter)
      assert.equal(isStorageItemBuffered('buffered_key', noopAdapter), true)

      resetStorageFallback(noopAdapter)
      assert.equal(isStorageItemBuffered('buffered_key', noopAdapter), false)
    })

    test('reports false when adapter writes succeed', () => {
      const memAdapter = new InMemoryAdapter()
      writeStorageItem('persisted_key', 'some_value', memAdapter)
      assert.equal(isStorageItemBuffered('persisted_key', memAdapter), false)
    })
  })
})
