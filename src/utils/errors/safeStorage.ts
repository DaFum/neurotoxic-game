import { StorageError } from './types'
import { handleError } from './handler'

export function runSafeStorageOperation<T>(operation: string, fn: () => T): T
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: null
): T | null
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: undefined
): T | undefined
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  ...fallbackValue: [] | [T | null | undefined]
): T | null | undefined {
  let retries = 2
  let lastError: unknown = null
  const hasFallback = arguments.length > 2

  while (retries >= 0) {
    try {
      return fn()
    } catch (error) {
      lastError = error
      retries--
    }
  }

  const storageError = new StorageError(
    `Storage operation failed after retries: ${operation}`,
    {
      originalError:
        lastError instanceof Error ? lastError.message : String(lastError)
    }
  )

  if (!hasFallback) {
    throw storageError
  }

  handleError(storageError, { silent: true })
  return fallbackValue[0]
}
