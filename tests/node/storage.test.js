import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { safeStorage, safeStorageNoFallback } from '../../src/utils/storage'

describe('storage operation wrappers', () => {
  test('safeStorage returns fallback when storage work fails', () => {
    const result = safeStorage(
      'testStorageFallback',
      () => {
        throw new Error('storage unavailable')
      },
      'fallback'
    )

    assert.equal(result, 'fallback')
  })

  test('safeStorageNoFallback throws a StorageError when storage work fails', () => {
    assert.throws(
      () =>
        safeStorageNoFallback('testStorageThrow', () => {
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
