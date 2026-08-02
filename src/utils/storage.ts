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
import { InMemoryAdapter, LocalStorageAdapter } from './storageAdapter'
import type { IStorageAdapter, StorageFailureReporter } from './storageAdapter'

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

// Latched by the production reporter so `readStorageItemChecked` can tell an
// absent key apart from an unreadable store. The adapter contract is
// never-throw, which otherwise collapses both cases into `null`.
let lastReadFailed = false

const reportStorageFailure: StorageFailureReporter = (
  operation,
  key,
  error
) => {
  if (operation === 'read') lastReadFailed = true
  handleError(
    new StorageError(`Storage ${operation} failed for "${key}"`, {
      originalError: error instanceof Error ? error.message : String(error)
    }),
    { silent: true }
  )
}

/**
 * Production storage singleton, mirroring how `clock.ts` exports `systemClock`.
 *
 * @remarks
 * Constructed here rather than in `storageAdapter.ts` so the adapter module
 * stays free of any dependency on error handling, which reaches back into it
 * through the logger.
 */
export const defaultStorageAdapter: IStorageAdapter = new LocalStorageAdapter(
  reportStorageFailure
)

/**
 * Session-scoped fallback stores used once persistent storage refuses writes
 * (private browsing, storage disabled by policy, quota exhausted).
 *
 * @remarks
 * Keyed per adapter rather than shared: a single module-global buffer is
 * consulted ahead of *every* adapter, so a save buffered against one backend
 * would shadow a different adapter's own value and break the provider
 * isolation `StorageContext` exists to give. Weakly held so an adapter that
 * goes out of scope takes its buffer with it.
 */
const fallbackStores = new WeakMap<IStorageAdapter, InMemoryAdapter>()

const getFallbackStore = (adapter: IStorageAdapter): InMemoryAdapter => {
  let store = fallbackStores.get(adapter)
  if (!store) {
    store = new InMemoryAdapter()
    fallbackStores.set(adapter, store)
  }
  return store
}

/**
 * Adapters whose writes have been refused this session.
 *
 * @remarks
 * Tracked per adapter alongside the fallback buffers: a single module-global
 * flag would let `resetStorageFallback(adapterB)` report adapter A as recovered
 * while A still holds buffered, unpersisted data.
 */
const degradedAdapters = new WeakSet<IStorageAdapter>()

/**
 * Whether persistent storage refused a write this session, so progress lives in
 * memory only.
 *
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns `true` once a write through that adapter has fallen back to memory.
 */
export const isStorageDegraded = (
  adapter: IStorageAdapter = defaultStorageAdapter
): boolean => degradedAdapters.has(adapter)

/**
 * Resets one adapter's degraded flag and in-memory fallback. Test seam only.
 *
 * @param adapter - Storage backend; defaults to the production singleton.
 */
export const resetStorageFallback = (
  adapter: IStorageAdapter = defaultStorageAdapter
): void => {
  degradedAdapters.delete(adapter)
  fallbackStores.get(adapter)?.clear()
}

/**
 * Writes a raw string through the storage guard.
 *
 * @param key - Storage key.
 * @param value - Serialized value to store.
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns `true` when the value reached persistent storage, `false` when it
 * was kept in the session-scoped memory store instead.
 *
 * @remarks
 * `localStorage.setItem` raises `QuotaExceededError`/`SecurityError` in private
 * browsing and when storage is disabled by policy. Every write goes through
 * here so that is a degraded mode rather than a crash class. The adapter
 * reports the underlying failure; this layer owns the fallback and the
 * degraded flag.
 */
export function writeStorageItem(
  key: string,
  value: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): boolean {
  if (adapter.set(key, value)) {
    // Persistence recovered for this key, so the memory entry is no longer the
    // newest value and must stop shadowing the persisted one.
    fallbackStores.get(adapter)?.remove(key)
    return true
  }

  getFallbackStore(adapter).set(key, value)
  degradedAdapters.add(adapter)
  return false
}

/**
 * Reads a raw string through the storage guard, preferring the in-memory store
 * for keys whose write was refused this session.
 *
 * @param key - Storage key.
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns Stored string, or `null` when the key is unknown or unreadable.
 *
 * @remarks
 * A memory entry only exists for a key whose persistent write failed, and
 * `writeStorageItem` drops it as soon as persistence recovers. It is therefore
 * always the newest value: reading persistent storage first would serve the
 * stale pre-degradation save while the current one stayed unreachable.
 */
export function readStorageItem(
  key: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): string | null {
  const fallback = fallbackStores.get(adapter)
  if (fallback?.has(key)) return fallback.get(key)

  return adapter.get(key)
}

/**
 * Removes a key from persistent storage and the in-memory fallback.
 *
 * @param key - Storage key.
 * @param adapter - Storage backend; defaults to the production singleton.
 */
export function removeStorageItem(
  key: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): void {
  fallbackStores.get(adapter)?.remove(key)
  adapter.remove(key)
}

/**
 * Reads a raw string, reporting whether the store was readable at all.
 *
 * @param key - Storage key.
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns `ok: false` when the read itself failed (SecurityError, tampered
 * getter); otherwise `ok: true` with the value, which may be `null` for a
 * genuinely absent key.
 *
 * @remarks
 * Callers that would *destroy* data on a miss — the unlock store rewrites its
 * whole list — must not treat an unreadable store as an empty one. Adapters
 * whose reads cannot fail (in-memory, no-op) always report `ok: true`.
 */
export function readStorageItemChecked(
  key: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): { ok: boolean; value: string | null } {
  lastReadFailed = false
  const value = readStorageItem(key, adapter)
  return { ok: !lastReadFailed, value }
}

/**
 * Safely get a typed item from localStorage.
 * Returns the parsed value or the fallback if the key doesn't exist, is unparseable, or is invalid.
 * @typeParam T - The expected type of the value
 * @param key - localStorage key
 * @param fallback - Fallback value if missing or invalid
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns Parsed value or fallback
 */
export function getSafeStorageItem<T>(
  key: string,
  fallback: T,
  adapter: IStorageAdapter = defaultStorageAdapter
): T {
  // Storage access itself can fail (SecurityError in private mode, tampered
  // getter, etc.); readStorageItem logs that distinctly from a missing key and
  // serves values written after storage degraded to the memory fallback.
  const raw = readStorageItem(key, adapter)

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
 * @param adapter - Storage backend; defaults to the production singleton.
 */
export function setSafeStorageItem(
  key: string,
  value: unknown,
  adapter: IStorageAdapter = defaultStorageAdapter
): void {
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
  writeStorageItem(key, serialized, adapter)
}

/**
 * Reads global settings from storage as a loose object.
 *
 * @param adapter - Storage backend; defaults to the production singleton.
 */
export const readGlobalSettings = (
  adapter: IStorageAdapter = defaultStorageAdapter
): Record<string, unknown> => {
  const settings = getSafeStorageItem<unknown>(GLOBAL_SETTINGS_KEY, {}, adapter)
  return isLooseRecord(settings) ? settings : {}
}

/**
 * Writes global settings to storage.
 *
 * @param settings - Settings object to persist.
 * @param adapter - Storage backend; defaults to the production singleton.
 */
export const writeGlobalSettings = (
  settings: Record<string, unknown>,
  adapter: IStorageAdapter = defaultStorageAdapter
): void => {
  setSafeStorageItem(GLOBAL_SETTINGS_KEY, settings, adapter)
}
