import { describe, it, beforeEach, afterEach, vi } from 'vitest'
import assert from 'node:assert/strict'
import { setSafeStorageItem } from '../../src/utils/storage'
import { handleError, StorageError } from '../../src/utils/errorHandler'

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn(),
  StorageError: class StorageError extends Error {
    constructor(message, options) {
      super(message)
      this.name = 'StorageError'
      this.options = options
    }
  }
}))

describe('storage', () => {
  describe('setSafeStorageItem', () => {
    let mockStorage

    beforeEach(() => {
      mockStorage = {
        setItem: vi.fn()
      }
      global.window = {
        localStorage: mockStorage
      }
      vi.clearAllMocks()
    })

    afterEach(() => {
      delete global.window
    })

    it('sets JSON stringified item in localStorage', () => {
      setSafeStorageItem('testKey', { foo: 'bar' })
      assert.strictEqual(mockStorage.setItem.mock.calls.length, 1)
      assert.strictEqual(mockStorage.setItem.mock.calls[0][0], 'testKey')
      assert.strictEqual(mockStorage.setItem.mock.calls[0][1], JSON.stringify({ foo: 'bar' }))
    })

    it('does nothing if storage is unavailable', () => {
      delete global.window
      setSafeStorageItem('testKey', 'value')
      assert.strictEqual(mockStorage.setItem.mock.calls.length, 0)
    })

    it('handles error silently when setItem throws', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      setSafeStorageItem('testKey', 'value')

      assert.strictEqual(handleError.mock.calls.length, 1)
      const errorArg = handleError.mock.calls[0][0]
      const optionsArg = handleError.mock.calls[0][1]

      assert.ok(errorArg instanceof StorageError)
      assert.strictEqual(errorArg.message, 'Storage write failed for "testKey"')
      assert.strictEqual(errorArg.options.originalError, 'QuotaExceededError')

      assert.deepEqual(optionsArg, { silent: true })
    })
  })
})
