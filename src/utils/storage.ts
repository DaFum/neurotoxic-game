/**
 * Type-safe localStorage helpers with consistent error handling.
 * New code should prefer these over direct localStorage access.
 * Note: these helpers assume JSON-encoded values and will not correctly read
 * legacy raw-string keys written directly via localStorage.setItem.
 */
import {
  handleError,
  StorageError,
  runSafeStorageOperation
} from './errorHandler'
import { safeJsonParse } from './gameStateUtils'

export function safeStorageOperation<T>(operation: string, fn: () => T): T
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue?: T | null
): T | null
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue?: T | null
): T | null {
  if (fallbackValue !== undefined) {
    return runSafeStorageOperation(operation, fn, fallbackValue)
  }
  return runSafeStorageOperation(operation, fn)
}

/**
 * Resolves the available localStorage instance across browser and server environments.
 * @returns localStorage instance or null if unavailable
 */
function getStorage(): Storage | null {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }
  if (typeof globalThis !== 'undefined') {
    return globalThis.localStorage
  }
  return null
}

/**
 * Safely get a typed item from localStorage.
 * Returns the parsed value or the fallback if the key doesn't exist, is unparseable, or is invalid.
 * @template T - The expected type of the value
 * @param key - localStorage key
 * @param fallback - Fallback value if missing or invalid
 * @returns Parsed value or fallback
 */
export function getSafeStorageItem<T>(key: string, fallback: T): T {
  const storage = getStorage()
  if (!storage) return fallback

  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch (error) {
    // Storage access itself failed (SecurityError in private mode, tampered
    // getter, etc.). Log so "missing key" and "unreadable storage" remain
    // distinguishable from telemetry.
    handleError(
      new StorageError(`Storage read failed for "${key}"`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
    return fallback
  }

  if (raw === null) return fallback

  try {
    const parsed = safeJsonParse(raw)
    if (parsed === null || parsed === undefined) return fallback
    return parsed as T
  } catch (error) {
    // Corrupted JSON payload (tampering, partial writes, schema drift) — log
    // distinctly so we can tell corruption apart from a missing key.
    handleError(
      new StorageError(`Storage value for "${key}" failed to parse`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
    return fallback
  }
}

/**
 * Safely set an item in localStorage, with JSON serialization.
 * Errors (quota exceeded, SecurityError, hostile getter tampering) are routed
 * through `handleError` with `silent: true` — no user toast, but a telemetry
 * entry so save loss has a diagnostic trail.
 * @param key - localStorage key
 * @param value - Value to store (will be JSON.stringify'd)
 */
export function setSafeStorageItem(key: string, value: unknown): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    handleError(
      new StorageError(`Storage write failed for "${key}"`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
  }
}

export function safeStorage<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T {
  return runSafeStorageOperation(operation, fn, fallbackValue)
}

export function safeStorageNoFallback<T>(operation: string, fn: () => T): T {
  return runSafeStorageOperation(operation, fn)
}
