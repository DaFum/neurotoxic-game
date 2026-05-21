import { safeStorageOperation } from './storage'

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

/**
 * Clears the in-memory cache. Used primarily for testing.
 */
export const clearCache = (): void => {
  unlocksCache = null
}

/**
 * Loads and validates unlocks from local storage.
 * @returns {string[]} Array of unlocked strings.
 */
export const getUnlocks = (): string[] => {
  if (unlocksCache) {
    return Array.from(unlocksCache)
  }

  const maybe = safeStorageOperation<string[]>(
    'loadUnlocks',
    () => {
      const raw = localStorage.getItem(UNLOCKS_KEY)
      if (!raw) return []

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch (_e) {
        return []
      }

      if (!Array.isArray(parsed)) return []

      // Filter out non-string elements to ensure type safety
      return parsed.filter(item => typeof item === 'string') as string[]
    },
    []
  )

  const result = maybe ?? []
  unlocksCache = new Set(result)
  return result
}

/**
 * Adds a new unlock to storage if not already present.
 * @param {string} unlockId - The ID of the unlock to add.
 * @returns {boolean} True if the unlock was added (wasn't already present).
 */
export const addUnlock = (unlockId: string): boolean => {
  if (typeof unlockId !== 'string') return false

  // Ensure cache is populated
  if (!unlocksCache) {
    getUnlocks()
  }

  // Prevent duplicates in O(1) time
  if (unlocksCache!.has(unlockId)) return false

  unlocksCache!.add(unlockId)
  const currentUnlocks = Array.from(unlocksCache!)

  return (
    safeStorageOperation<boolean>(
      'saveUnlocks',
      () => {
        localStorage.setItem(UNLOCKS_KEY, JSON.stringify(currentUnlocks))
        return true
      },
      false
    ) ?? false
  )
}
