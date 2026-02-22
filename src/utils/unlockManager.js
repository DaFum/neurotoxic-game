import { safeStorageOperation } from './errorHandler.js'

const UNLOCKS_KEY = 'neurotoxic_unlocks'

/**
 * Loads and validates unlocks from local storage.
 * @returns {string[]} Array of unlocked strings.
 */
const getUnlocks = () => {
  return safeStorageOperation(
    'loadUnlocks',
    () => {
      const raw = localStorage.getItem(UNLOCKS_KEY)
      if (!raw) return []

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch (_e) {
        return []
      }

      if (!Array.isArray(parsed)) return []

      // Filter out non-string elements to ensure type safety
      return parsed.filter(item => typeof item === 'string')
    },
    []
  )
}

/**
 * Adds a new unlock to storage if not already present.
 * @param {string} unlockId - The ID of the unlock to add.
 * @returns {boolean} True if the unlock was added (wasn't already present).
 */
export const addUnlock = unlockId => {
  if (typeof unlockId !== 'string') return false

  // Get current validated unlocks
  const currentUnlocks = getUnlocks()

  // Prevent duplicates
  if (currentUnlocks.includes(unlockId)) return false

  currentUnlocks.push(unlockId)

  return safeStorageOperation(
    'saveUnlocks',
    () => {
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(currentUnlocks))
      return true
    },
    false
  )
}
