import { safeStorageOperation } from './storage'
import { safeJsonParse } from './gameStateUtils'

/**
 * Persistence layer for earned unlock IDs.
 * Reads and writes `neurotoxic_unlocks` in localStorage.
 *
 * Does NOT evaluate whether state qualifies for an unlock.
 * For eligibility logic, see ./unlockCheck.ts.
 */

const UNLOCKS_KEY = 'neurotoxic_unlocks'

// In-memory cache for O(1) duplicate checks
let unlocksCache: Set<string> | null = null
let lastRawUnlocks: string | null = null

/**
 * Clears the in-memory cache. Used primarily for testing.
 */
export const clearCache = (): void => {
  unlocksCache = null
  lastRawUnlocks = null
}

/**
 * Loads and validates unlocks from local storage.
 * @returns {string[]} Array of unlocked strings.
 */
export const getUnlocks = (): string[] => {
  let currentRaw: string | null = null

  const maybe = safeStorageOperation<string[]>(
    'loadUnlocks',
    () => {
      currentRaw = localStorage.getItem(UNLOCKS_KEY)

      if (
        currentRaw !== null &&
        currentRaw === lastRawUnlocks &&
        unlocksCache
      ) {
        return Array.from(unlocksCache)
      }

      if (!currentRaw) return []

      let parsed: unknown
      try {
        parsed = safeJsonParse(currentRaw)
      } catch (_e) {
        return []
      }

      if (!Array.isArray(parsed)) return []

      // Filter out non-string elements to ensure type safety
      return parsed.filter(item => typeof item === 'string') as string[]
    },
    []
  )

  // If the raw string hasn't changed and we have a cache, just return it
  if (currentRaw !== null && currentRaw === lastRawUnlocks && unlocksCache) {
    return maybe ?? []
  }

  const result = maybe ?? []
  unlocksCache = new Set(result)
  lastRawUnlocks = currentRaw
  return result
}

/**
 * Adds a new unlock to storage if not already present.
 * @param {string} unlockId - The ID of the unlock to add.
 * @returns {boolean} True if the unlock was added (wasn't already present).
 */
export const addUnlock = (unlockId: string): boolean => {
  if (typeof unlockId !== 'string') return false

  // Refresh cache from storage. getUnlocks will recreate the Set ONLY if storage actually changed
  const currentUnlocks = getUnlocks()
  const cache = unlocksCache

  if (!cache) return false

  // Prevent duplicates in O(1) time
  if (cache.has(unlockId)) return false

  cache.add(unlockId)
  currentUnlocks.push(unlockId)

  const success =
    safeStorageOperation<boolean>(
      'saveUnlocks',
      () => {
        const newRaw = JSON.stringify(currentUnlocks)
        localStorage.setItem(UNLOCKS_KEY, newRaw)
        // Update our cache reference immediately so we don't invalidate our own write
        lastRawUnlocks = newRaw
        return true
      },
      false
    ) ?? false

  if (!success) {
    // Roll back cache mutation if persistence fails
    cache.delete(unlockId)
    // Force a fresh read next time since we don't know the exact valid storage state
    lastRawUnlocks = null
  }

  return success
}
