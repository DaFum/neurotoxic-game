import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { safeStorageOperation } from '../../src/utils/storage'

describe('storage operation wrappers', () => {
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
