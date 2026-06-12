import { StorageError } from './types'
import { handleError } from './handler'

/**
 * Executes a storage operation safely with built-in retries and error fallback handling.
 *
 * @remarks
 * This function attempts to run the provided storage operation up to three times (initial try plus 2 retries)
 * before failing. If a fallback value is provided and the operation continues to fail, the error is handled
 * silently and the fallback value is returned. If no fallback is provided, a `StorageError` is thrown.
 *
 * @typeParam T - The expected return type of the storage operation.
 * @param operation - A descriptive identifier for the storage operation being executed.
 * @param fn - The storage operation function to execute.
 * @param fallbackValue - An optional value to return if the operation fails after all retries.
 * @returns The result of the storage operation, or the fallback value if provided and the operation fails.
 * @throws {@link StorageError} If the operation fails after all retries and no fallback value was provided.
 */
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
