import { vi } from 'vitest'

export const createStorageErrorMock = () => {
  const mockHandleError = vi.fn()
  class MockStorageError extends Error {
    constructor(message, options) {
      super(message)
      this.name = 'StorageError'
      this.originalError = options?.originalError
    }
  }
  const runSafeStorageOperation = vi.fn((op, fn, ...fallbackValue) => {
    try {
      return fn()
    } catch (error) {
      const storageError = new MockStorageError(
        `Storage operation failed after retries: ${op}`,
        {
          originalError: error instanceof Error ? error.message : String(error)
        }
      )
      if (fallbackValue.length === 0) {
        throw storageError
      }
      mockHandleError(storageError, { silent: true })
      return fallbackValue[0]
    }
  })
  class MockStateError extends Error {
    constructor(message, options) {
      super(message)
      this.name = 'StateError'
      this.code = options?.code
      this.originalError = options?.originalError
    }
  }
  return {
    handleError: mockHandleError,
    StorageError: MockStorageError,
    StateError: MockStateError,
    runSafeStorageOperation
  }
}
