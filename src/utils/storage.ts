/**
 * Centralized, type-safe localStorage wrapper with consistent error handling.
 * All direct localStorage access should go through these functions.
 * Automatically handles JSON serialization/deserialization and null/invalid value guards.
 */

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
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  } catch {
    // Silently fail on quota exceeded or other errors
  }
}

/**
 * Safely remove an item from localStorage.
 * @param key - localStorage key
 */
export function removeSafeStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Silently fail
  }
}

/**
 * Safely check if a key exists in localStorage.
 * @param key - localStorage key
 */
export function hasSafeStorageItem(key: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key) !== null
    }
    return false
  } catch {
    return false
  }
}
