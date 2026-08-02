import { safeStorageOperation, writeStorageItem } from './storage'
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

// In-memory cache for O(1) duplicate checks
let unlocksCache: Set<string> | null = null
let lastStorageSnapshot: string | null = null
const UNLOCK_LOAD_FAILED = Symbol('UNLOCK_LOAD_FAILED')

const readUnlockMarkers = (storage: Storage): string[] => {
  if (typeof storage.key !== 'function' || !Number.isFinite(storage.length)) {
    return []
  }

  const markerUnlocks: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key?.startsWith(UNLOCK_MARKER_PREFIX)) continue
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
 * Clears the in-memory cache. Used primarily for testing.
 */
const clearCache = (): void => {
  unlocksCache = null
  lastStorageSnapshot = null
}

/**
 * Loads and validates unlocks from local storage.
 * @returns Array of unlocked strings.
 */
const loadUnlocks = (): string[] | typeof UNLOCK_LOAD_FAILED => {
  let currentSnapshot: string | null = null

  const maybe = safeStorageOperation<string[] | typeof UNLOCK_LOAD_FAILED>(
    'loadUnlocks',
    () => {
      const storage = localStorage
      const currentRaw = storage.getItem(UNLOCKS_KEY)
      const markerUnlocks = readUnlockMarkers(storage)
      currentSnapshot = `${currentRaw ?? ''}\u0000${markerUnlocks.join('\u0000')}`

      if (currentSnapshot === lastStorageSnapshot && unlocksCache) {
        return Array.from(unlocksCache)
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
    currentSnapshot === lastStorageSnapshot &&
    unlocksCache
  ) {
    return maybe
  }

  unlocksCache = new Set(maybe)
  lastStorageSnapshot = currentSnapshot
  return maybe
}

/**
 * Loads and validates unlocks from local storage.
 * @returns Array of unlocked strings.
 */
export const getUnlocks = (): string[] => {
  const result = loadUnlocks()
  if (result !== UNLOCK_LOAD_FAILED) return result
  return unlocksCache ? Array.from(unlocksCache) : []
}

/**
 * Adds a new unlock to storage if not already present.
 * @param unlockId - The ID of the unlock to add.
 * @returns True if the unlock was added (wasn't already present).
 */
export const addUnlock = (unlockId: string): boolean => {
  if (typeof unlockId !== 'string') return false

  // Refresh cache from storage. loadUnlocks recreates the Set only when storage changed.
  const currentUnlocks = loadUnlocks()
  if (currentUnlocks === UNLOCK_LOAD_FAILED) return false
  const cache = unlocksCache

  if (!cache) return false

  // Prevent duplicates in O(1) time
  if (cache.has(unlockId)) return false

  const markerSuccess =
    safeStorageOperation<boolean>(
      'saveUnlockMarker',
      () =>
        writeStorageItem(
          `${UNLOCK_MARKER_PREFIX}${encodeURIComponent(unlockId)}`,
          '1'
        ),
      false
    ) ?? false

  if (!markerSuccess) return false

  cache.add(unlockId)
  currentUnlocks.push(unlockId)

  // Keep the legacy aggregate for existing saves and callers. The per-unlock
  // marker is authoritative for cross-tab safety: distinct marker keys cannot
  // overwrite each other when two tabs unlock different items concurrently.
  safeStorageOperation<boolean>(
    'saveUnlocks',
    () => writeStorageItem(UNLOCKS_KEY, JSON.stringify(currentUnlocks)),
    false
  )
  lastStorageSnapshot = null

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
