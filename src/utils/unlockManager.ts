import {
  defaultStorageAdapter,
  listStorageKeys,
  readStorageItemChecked,
  safeStorageOperation,
  writeStorageItem
} from './storage'
import type { IStorageAdapter } from './storageAdapter'
import { safeJsonParse } from './objectUtils'

/**
 * Persistence layer for earned unlock IDs.
 * Reads and writes `neurotoxic_unlocks` in localStorage.
 *
 * Does NOT evaluate whether state qualifies for an unlock.
 * For eligibility logic, see ./unlockCheck.ts.
 */

const UNLOCKS_KEY = 'neurotoxic_unlocks'
const UNLOCK_MARKER_PREFIX = 'neurotoxic_unlock:'

type UnlockCache = {
  /** In-memory cache for O(1) duplicate checks. */
  unlocks: Set<string> | null
  lastStorageSnapshot: string | null
  /**
   * Marker ids this session retained in the fallback store rather than in
   * persistent storage.
   *
   * @remarks
   * `readUnlockMarkers` enumerates buffered keys, so a session-only marker is
   * indistinguishable from a durable one by presence alone. A caller that
   * requires crash safety needs that distinction, so the refused writes are
   * remembered here and cleared when a later write for the same id lands.
   */
  sessionOnly: Set<string>
}

/**
 * Cache state per storage backend.
 *
 * @remarks
 * Keyed by adapter rather than module-global: one shared cache is consulted for
 * every adapter, so a fallback read after adapter B's storage failed would serve
 * adapter A's unlocks and break the provider isolation `StorageContext` exists
 * to give.
 */
let unlockCaches = new WeakMap<IStorageAdapter, UnlockCache>()

const getCache = (adapter: IStorageAdapter): UnlockCache => {
  let cache = unlockCaches.get(adapter)
  if (!cache) {
    cache = { unlocks: null, lastStorageSnapshot: null, sessionOnly: new Set() }
    unlockCaches.set(adapter, cache)
  }
  return cache
}

const UNLOCK_LOAD_FAILED = Symbol('UNLOCK_LOAD_FAILED')

const readUnlockMarkers = (adapter: IStorageAdapter): string[] => {
  const markerUnlocks: string[] = []
  // Markers buffered after a refused write are only visible through the guard,
  // never through the adapter's own enumeration.
  for (const key of listStorageKeys(adapter)) {
    if (!key.startsWith(UNLOCK_MARKER_PREFIX)) continue
    try {
      markerUnlocks.push(
        decodeURIComponent(key.slice(UNLOCK_MARKER_PREFIX.length))
      )
    } catch (_error) {
      // Ignore malformed marker keys written outside this module.
    }
  }
  markerUnlocks.sort()
  return markerUnlocks
}

/**
 * Clears every adapter's in-memory cache. Used primarily for testing.
 */
const clearCache = (): void => {
  unlockCaches = new WeakMap()
}

/**
 * Loads and validates unlocks from local storage.
 * @returns Array of unlocked strings.
 */
const loadUnlocks = (
  adapter: IStorageAdapter = defaultStorageAdapter
): string[] | typeof UNLOCK_LOAD_FAILED => {
  const cache = getCache(adapter)
  let currentSnapshot: string | null = null

  const maybe = safeStorageOperation<string[] | typeof UNLOCK_LOAD_FAILED>(
    'loadUnlocks',
    () => {
      // An unreadable store must not look like an empty one: addUnlock
      // rewrites the whole unlock list, so a swallowed read error would erase
      // the player's legacy unlocks.
      const read = readStorageItemChecked(UNLOCKS_KEY, adapter)
      if (!read.ok) throw new Error('Unlock storage is unreadable')
      const currentRaw = read.value
      const markerUnlocks = readUnlockMarkers(adapter)
      currentSnapshot = `${currentRaw ?? ''}\u0000${markerUnlocks.join('\u0000')}`

      if (currentSnapshot === cache.lastStorageSnapshot && cache.unlocks) {
        return Array.from(cache.unlocks)
      }

      let legacyUnlocks: string[] = []
      if (currentRaw) {
        try {
          const parsed: unknown = safeJsonParse(currentRaw)
          if (Array.isArray(parsed)) {
            legacyUnlocks = parsed.filter(
              (item): item is string => typeof item === 'string'
            )
          }
        } catch (_e) {
          legacyUnlocks = []
        }
      }

      return Array.from(new Set([...legacyUnlocks, ...markerUnlocks]))
    },
    UNLOCK_LOAD_FAILED
  )

  if (maybe === UNLOCK_LOAD_FAILED) return UNLOCK_LOAD_FAILED

  if (
    currentSnapshot !== null &&
    currentSnapshot === cache.lastStorageSnapshot &&
    cache.unlocks
  ) {
    return maybe
  }

  cache.unlocks = new Set(maybe)
  cache.lastStorageSnapshot = currentSnapshot
  return maybe
}

/**
 * Loads and validates unlocks from local storage.
 * @returns Array of unlocked strings.
 */
export const getUnlocks = (
  adapter: IStorageAdapter = defaultStorageAdapter
): string[] => {
  const result = loadUnlocks(adapter)
  if (result !== UNLOCK_LOAD_FAILED) return result
  const cached = unlockCaches.get(adapter)?.unlocks
  return cached ? Array.from(cached) : []
}

/**
 * How far a marker write actually reached.
 *
 * @remarks
 * `session_only` is a retained unlock that will not survive the process: the
 * adapter refused the write and the guard buffered it. Most callers can treat
 * that as success, because the marker stays readable for the session. A caller
 * that grants something irreversible against the marker cannot.
 */
export type UnlockMarkerPersistence = 'persisted' | 'session_only' | 'failed'

type UnlockMarkerWrite = {
  /** Whether this call put a new id into the unlock set. */
  added: boolean
  persistence: UnlockMarkerPersistence
}

const writeUnlockMarker = (
  unlockId: string,
  adapter: IStorageAdapter
): UnlockMarkerWrite => {
  if (typeof unlockId !== 'string')
    return { added: false, persistence: 'failed' }

  // Refresh cache from storage. loadUnlocks recreates the Set only when storage changed.
  const currentUnlocks = loadUnlocks(adapter)
  if (currentUnlocks === UNLOCK_LOAD_FAILED)
    return { added: false, persistence: 'failed' }
  const cache = unlockCaches.get(adapter)?.unlocks

  if (!cache) return { added: false, persistence: 'failed' }

  // Prevent duplicates in O(1) time
  if (cache.has(unlockId)) {
    return {
      added: false,
      persistence: getCache(adapter).sessionOnly.has(unlockId)
        ? 'session_only'
        : 'persisted'
    }
  }

  // `writeStorageItem` returns false when the marker was kept in the session
  // fallback rather than persisted — the unlock is still retained for this
  // session, and `readUnlockMarkers` enumerates buffered keys, so it stays
  // discoverable. Only a thrown write (the null sentinel) loses it outright.
  const markerWrite = safeStorageOperation<boolean | null>(
    'saveUnlockMarker',
    () =>
      writeStorageItem(
        `${UNLOCK_MARKER_PREFIX}${encodeURIComponent(unlockId)}`,
        '1',
        adapter
      ),
    null
  )

  if (markerWrite === null) return { added: false, persistence: 'failed' }

  cache.add(unlockId)
  currentUnlocks.push(unlockId)
  const sessionOnly = getCache(adapter).sessionOnly
  if (markerWrite) sessionOnly.delete(unlockId)
  else sessionOnly.add(unlockId)

  // Keep the legacy aggregate for existing saves and callers. The per-unlock
  // marker is authoritative for cross-tab safety: distinct marker keys cannot
  // overwrite each other when two tabs unlock different items concurrently.
  safeStorageOperation<boolean>(
    'saveUnlocks',
    () =>
      writeStorageItem(UNLOCKS_KEY, JSON.stringify(currentUnlocks), adapter),
    false
  )
  getCache(adapter).lastStorageSnapshot = null

  return {
    added: true,
    persistence: markerWrite ? 'persisted' : 'session_only'
  }
}

/**
 * Adds an unlock and reports whether its marker is durable.
 *
 * @param unlockId - The ID of the unlock to add.
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns Whether the marker reached persistent storage, was retained for the
 * session only, or was lost.
 *
 * @remarks
 * Use this instead of {@link addUnlock} when the caller grants something it
 * cannot take back, and so must not act on a marker that a reload would lose.
 * An id already in the set reports the durability of the write that put it
 * there, not `persisted` by default.
 */
export const addUnlockWithPersistence = (
  unlockId: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): UnlockMarkerPersistence => writeUnlockMarker(unlockId, adapter).persistence

/**
 * Adds a new unlock to storage if not already present.
 * @param unlockId - The ID of the unlock to add.
 * @returns True if the unlock was added (wasn't already present).
 */
export const addUnlock = (
  unlockId: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): boolean => writeUnlockMarker(unlockId, adapter).added

/**
 * Test-only hooks for resetting unlock-manager module cache.
 */
export const __testInternals = {
  clearCache: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      clearCache()
    }
  }
}
