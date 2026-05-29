import { describe, it, beforeEach, afterEach, vi } from 'vitest'
import assert from 'node:assert/strict'
import { setSafeStorageItem } from '../../src/utils/storage'
import { handleError, StorageError } from '../../src/utils/errorHandler'

vi.mock('../../src/utils/errorHandler', async () => {
  const actual = await vi.importActual('../../src/utils/errorHandler')
  return {
    ...actual,
    handleError: vi.fn()
  }
})

describe('storage', () => {
  describe('setSafeStorageItem', () => {
    let mockStorage

    beforeEach(() => {
      mockStorage = {
        setItem: vi.fn()
      }
      vi.stubGlobal('window', {
        localStorage: mockStorage
      })
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('sets JSON stringified item in localStorage', () => {
      setSafeStorageItem('testKey', { foo: 'bar' })
      assert.strictEqual(mockStorage.setItem.mock.calls.length, 1)
      assert.strictEqual(mockStorage.setItem.mock.calls[0][0], 'testKey')
      assert.strictEqual(mockStorage.setItem.mock.calls[0][1], JSON.stringify({ foo: 'bar' }))
    })

    it('does nothing if storage is unavailable', () => {
      vi.stubGlobal('window', undefined)
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
      assert.strictEqual(errorArg.context.originalError, 'QuotaExceededError')

      assert.deepEqual(optionsArg, { silent: true })
    })
  })
})
