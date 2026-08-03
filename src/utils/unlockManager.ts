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
    cache = { unlocks: null, lastStorageSnapshot: null }
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
 * Adds a new unlock to storage if not already present.
 * @param unlockId - The ID of the unlock to add.
 * @returns True if the unlock was added (wasn't already present).
 */
export const addUnlock = (
  unlockId: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): boolean => {
  if (typeof unlockId !== 'string') return false

  // Refresh cache from storage. loadUnlocks recreates the Set only when storage changed.
  const currentUnlocks = loadUnlocks(adapter)
  if (currentUnlocks === UNLOCK_LOAD_FAILED) return false
  const cache = unlockCaches.get(adapter)?.unlocks

  if (!cache) return false

  // Prevent duplicates in O(1) time
  if (cache.has(unlockId)) return false

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

  if (markerWrite === null) return false

  cache.add(unlockId)
  currentUnlocks.push(unlockId)

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

  return true
}

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
