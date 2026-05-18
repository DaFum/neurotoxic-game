/**
 * Type-safe localStorage helpers with consistent error handling.
 * New code should prefer these over direct localStorage access.
 * Note: these helpers assume JSON-encoded values and will not correctly read
 * legacy raw-string keys written directly via localStorage.setItem.
 */
import { safeStorageOperation as runSafeStorageOperation } from './errorHandler'

export const safeStorageOperation = <T>(
  operation: string,
  fn: () => T,
  fallbackValue?: T | null
): T | null => runSafeStorageOperation(operation, fn, fallbackValue)

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
  try {
    const storage = getStorage()
    if (!storage) return fallback
    const raw = storage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Safely set an item in localStorage, with JSON serialization.
 * Silently handles quota exceeded and other errors.
 * @param key - localStorage key
 * @param value - Value to store (will be JSON.stringify'd)
 */
export function setSafeStorageItem(key: string, value: unknown): void {
  try {
    const storage = getStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(value))
    }
  } catch {
    // Silently fail on quota exceeded or other errors
  }
}

export function safeStorage<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T {
  return (
    runSafeStorageOperation as unknown as (
      op: string,
      exec: () => T,
      fallback: T
    ) => T
  )(operation, fn, fallbackValue)
}

export function safeStorageNoFallback<T>(operation: string, fn: () => T): T {
  return (
    runSafeStorageOperation as unknown as (op: string, exec: () => T) => T
  )(operation, fn)
}
