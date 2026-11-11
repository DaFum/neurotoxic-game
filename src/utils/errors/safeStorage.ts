import { StorageError } from './types'
import { handleError } from './handler'

/**
 * Executes a storage operation safely.
 *
 * @remarks
 * This function attempts to run the provided storage operation safely.
 * If the operation fails, a StorageError is thrown.
 *
 * @typeParam T - The expected return type of the storage operation.
 * @param operation - A descriptive identifier for the storage operation being executed.
 * @param fn - The storage operation function to execute.
 * @returns The result of the storage operation.
 * @throws {@link StorageError} If the operation fails.
 */
export function runSafeStorageOperation<T>(operation: string, fn: () => T): T
/**
 * Executes a storage operation safely with error fallback handling.
 *
 * @remarks
 * This function attempts to run the provided storage operation safely.
 * If the operation fails, the error is handled silently and the fallback value is returned.
 *
 * @typeParam T - The expected return type of the storage operation.
 * @param operation - A descriptive identifier for the storage operation being executed.
 * @param fn - The storage operation function to execute.
 * @param fallbackValue - An optional value to return if the operation fails.
 * @returns The result of the storage operation, or the fallback value if the operation fails.
 */
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
  const hasFallback = arguments.length > 2

  try {
    return fn()
  } catch (error) {
    const storageError = new StorageError(
      `Storage operation failed after retries: ${operation}`,
      {
        originalError: error instanceof Error ? error.message : String(error)
      }
    )

    if (!hasFallback) {
      throw storageError
    }

    handleError(storageError, { silent: true })
    return fallbackValue[0]
  }
}
