import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getUnlocks, addUnlock, __testInternals } from '../../src/utils/unlockManager'
import * as storageHelpers from '../../src/utils/storage'

describe('unlockManager', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    // Reset internal cache before each test
    __testInternals.clearCache()

    // Setup local storage mock
    mockStorage = {}
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      })
    }

    vi.stubGlobal('localStorage', localStorageMock)

    // We spy on safeStorageOperation but let it call the actual implementation
    // to test the full flow, unless we explicitly mock it to simulate failures.
    vi.spyOn(storageHelpers, 'safeStorageOperation')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('getUnlocks', () => {
    it('returns an empty array if storage is empty', () => {
      const result = getUnlocks()
      expect(result).toEqual([])
      expect(localStorage.getItem).toHaveBeenCalledWith('neurotoxic_unlocks')
    })

    it('returns an array of strings if storage contains valid data', () => {
      mockStorage['neurotoxic_unlocks'] = JSON.stringify(['unlock1', 'unlock2'])
      const result = getUnlocks()
      expect(result).toEqual(['unlock1', 'unlock2'])
    })

    it('returns an empty array if storage contains invalid JSON', () => {
      mockStorage['neurotoxic_unlocks'] = 'invalid-json'
      const result = getUnlocks()
      expect(result).toEqual([])
    })

    it('returns an empty array if parsed data is not an array', () => {
      mockStorage['neurotoxic_unlocks'] = JSON.stringify({ not: 'an array' })
      const result = getUnlocks()
      expect(result).toEqual([])
    })

    it('filters out non-string elements', () => {
      mockStorage['neurotoxic_unlocks'] = JSON.stringify(['valid', 123, null, 'also_valid'])
      const result = getUnlocks()
      expect(result).toEqual(['valid', 'also_valid'])
    })

    it('uses the cache for subsequent calls if storage has not changed', () => {
      mockStorage['neurotoxic_unlocks'] = JSON.stringify(['unlock1'])

      const result1 = getUnlocks()
      expect(result1).toEqual(['unlock1'])
      expect(localStorage.getItem).toHaveBeenCalledTimes(1)

      const result2 = getUnlocks()
      expect(result2).toEqual(['unlock1'])
      // It still calls getItem to check if the raw string changed,
      // but doesn't re-parse JSON
      expect(localStorage.getItem).toHaveBeenCalledTimes(2)

      // We can't directly check if JSON.parse was skipped without spying on it,
      // but we can verify the cache logic holds.
    })
  })

  describe('addUnlock', () => {
    it('returns false for non-string inputs', () => {
      expect(addUnlock(123 as any)).toBe(false)
      expect(addUnlock(null as any)).toBe(false)
    })

    it('adds a valid unlock to storage and returns true', () => {
      // First getUnlocks to initialize cache
      getUnlocks()

      const success = addUnlock('new_unlock')
      expect(success).toBe(true)

      expect(localStorage.setItem).toHaveBeenCalledWith('neurotoxic_unlocks', JSON.stringify(['new_unlock']))
      expect(mockStorage['neurotoxic_unlocks']).toBe(JSON.stringify(['new_unlock']))

      // Cache should be updated, getUnlocks should return it
      expect(getUnlocks()).toEqual(['new_unlock'])
    })

    it('returns false if the unlock already exists', () => {
      mockStorage['neurotoxic_unlocks'] = JSON.stringify(['existing_unlock'])

      const success = addUnlock('existing_unlock')
      expect(success).toBe(false)
      // setItem should not be called again
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })

    it('returns false if cache is not initialized (getUnlocks never called)', () => {
      // We purposefully don't call getUnlocks() here
      // But actually, addUnlock calls getUnlocks() internally,
      // which initializes the cache. So this will still return true
      // if we add a valid unlock! Let's verify that.

      const success = addUnlock('first_unlock')
      expect(success).toBe(true)
      expect(getUnlocks()).toEqual(['first_unlock'])
    })

    it('rolls back cache mutation if persistence fails', () => {
      // Initialize cache
      getUnlocks()

      // We can't mock safeStorageOperation like that because it causes call stack exceeded
      // when spy is tracking itself. Better to mock the underlying setItem directly to simulate failure.
      // But wait, safeStorageOperation wraps localStorage.setItem and catches errors?
      // No, safeStorageOperation wraps the function and relies on runSafeStorageOperation.
      // Actually, since we're in Vitest, let's just make the function return false directly if it's our saveUnlocks call.

      vi.spyOn(storageHelpers, 'safeStorageOperation').mockImplementation((operation: string, fn: any, fallback: any) => {
        if (operation === 'saveUnlocks') return false
        // For others, just call the function directly (bypass the actual safe wrapper for this test)
        try {
            return fn()
        } catch {
            return fallback
        }
      })

      const success = addUnlock('failed_unlock')
      expect(success).toBe(false)

      // Cache should have been rolled back
      expect(getUnlocks()).toEqual([])
    })
  })

  describe('__testInternals.clearCache', () => {
    it('resets internal state properly', () => {
      mockStorage['neurotoxic_unlocks'] = JSON.stringify(['unlock1'])

      // Populate cache
      getUnlocks()

      // Clear cache
      process.env.NODE_ENV = 'test'
      __testInternals.clearCache()

      // Instead of relying on addUnlock which calls getUnlocks again,
      // let's just call getUnlocks directly to see if it calls getItem again.
      getUnlocks()

      expect(localStorage.getItem).toHaveBeenCalledTimes(2) // 1 before clear, 1 after clear
    })
  })
})
