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
import { isLooseRecord, safeJsonParse } from './objectUtils'

/**
 * localStorage key for settings shared outside the active save file.
 */
export const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'

/**
 * Runs a storage operation through the shared retry and fallback wrapper.
 *
 * @typeParam T - Operation result and fallback value shape.
 * @param operation - Operation name included in storage diagnostics.
 * @param fn - Storage operation to execute.
 * @param fallbackValue - Value returned after retries fail. Passing
 * `undefined` explicitly still counts as a fallback.
 * @returns Operation result, or the supplied fallback when one is provided.
 *
 * @throws Throws a `StorageError` after all retries fail when no fallback
 * argument is supplied.
 */
export function safeStorageOperation<T>(operation: string, fn: () => T): T
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: undefined
): T | undefined
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: null
): T | null
export function safeStorageOperation<T>(
  operation: string,
  fn: () => T,
  ...fallbackValue: [] | [T | null | undefined]
): T | null | undefined {
  if (fallbackValue.length > 0) {
    return runSafeStorageOperation(operation, fn, fallbackValue[0])
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
 * Session-scoped fallback store used once persistent storage refuses writes
 * (private browsing, storage disabled by policy, quota exhausted).
 *
 * @remarks
 * Deliberately a plain module-level map rather than a class: the planned
 * `StorageAdapter` abstraction absorbs this as its `InMemoryAdapter` without
 * any call site needing to change.
 */
const memoryStore = new Map<string, string>()

let storageDegraded = false

/**
 * Whether persistent storage refused a write this session, so progress lives in
 * memory only.
 *
 * @returns `true` once a write has fallen back to the in-memory store.
 */
export const isStorageDegraded = (): boolean => storageDegraded

/**
 * Resets the degraded-storage flag and in-memory fallback. Test seam only.
 */
export const resetStorageFallback = (): void => {
  storageDegraded = false
  memoryStore.clear()
}

/**
 * Writes a raw string through the storage guard.
 *
 * @param key - Storage key.
 * @param value - Serialized value to store.
 * @returns `true` when the value reached persistent storage, `false` when it
 * was kept in the session-scoped memory store instead.
 *
 * @remarks
 * `localStorage.setItem` raises `QuotaExceededError`/`SecurityError` in private
 * browsing and when storage is disabled by policy. Every write goes through
 * here so that is a degraded mode rather than a crash class.
 */
export function writeStorageItem(key: string, value: string): boolean {
  try {
    const storage = getStorage()
    if (!storage) throw new Error('No storage available')
    storage.setItem(key, value)
    return true
  } catch (error) {
    memoryStore.set(key, value)
    handleError(
      new StorageError(`Storage write failed for "${key}"`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
    storageDegraded = true
    return false
  }
}

/**
 * Reads a raw string through the storage guard, falling back to the in-memory
 * store for keys that were written after storage degraded.
 *
 * @param key - Storage key.
 * @returns Stored string, or `null` when the key is unknown or unreadable.
 */
export function readStorageItem(key: string): string | null {
  try {
    const storage = getStorage()
    const raw = storage ? storage.getItem(key) : null
    if (raw !== null) return raw
  } catch (error) {
    handleError(
      new StorageError(`Storage read failed for "${key}"`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
  }
  return memoryStore.get(key) ?? null
}

/**
 * Removes a key from persistent storage and the in-memory fallback.
 *
 * @param key - Storage key.
 */
export function removeStorageItem(key: string): void {
  memoryStore.delete(key)
  try {
    getStorage()?.removeItem(key)
  } catch (error) {
    handleError(
      new StorageError(`Storage removal failed for "${key}"`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
  }
}

/**
 * Safely get a typed item from localStorage.
 * Returns the parsed value or the fallback if the key doesn't exist, is unparseable, or is invalid.
 * @typeParam T - The expected type of the value
 * @param key - localStorage key
 * @param fallback - Fallback value if missing or invalid
 * @returns Parsed value or fallback
 */
export function getSafeStorageItem<T>(key: string, fallback: T): T {
  // Storage access itself can fail (SecurityError in private mode, tampered
  // getter, etc.); readStorageItem logs that distinctly from a missing key and
  // serves values written after storage degraded to the memory fallback.
  const raw = readStorageItem(key)

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
 * Writes go through the storage guard: quota/security failures fall back to the
 * session-scoped memory store and are routed through `handleError` with
 * `silent: true` — no user toast here, but a telemetry entry so save loss has a
 * diagnostic trail. Callers that need to tell the player use
 * `isStorageDegraded()`.
 * @param key - localStorage key.
 * @param value - JSON-serializable value to store.
 */
export function setSafeStorageItem(key: string, value: unknown): void {
  let serialized: string
  try {
    serialized = JSON.stringify(value)
  } catch (error) {
    handleError(
      new StorageError(`Storage value for "${key}" failed to serialize`, {
        originalError: error instanceof Error ? error.message : String(error)
      }),
      { silent: true }
    )
    return
  }
  writeStorageItem(key, serialized)
}

/**
 * Reads global settings from storage as a loose object.
 */
export const readGlobalSettings = (): Record<string, unknown> => {
  const settings = getSafeStorageItem<unknown>(GLOBAL_SETTINGS_KEY, {})
  return isLooseRecord(settings) ? settings : {}
}

/**
 * Writes global settings to storage.
 */
export const writeGlobalSettings = (
  settings: Record<string, unknown>
): void => {
  setSafeStorageItem(GLOBAL_SETTINGS_KEY, settings)
}
