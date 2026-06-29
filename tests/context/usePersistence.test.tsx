import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistence, SAVE_KEY } from '../../src/context/usePersistence'
import { handleError, StateError } from '../../src/utils/errorHandler'
import { safeStorageOperation } from '../../src/utils/storage'

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn(),
  StateError: class StateError extends Error {
    details: Record<string, unknown>
    constructor(message: string, details: Record<string, unknown> = {}) {
      super(message)
      this.details = details
    }
  },
  StorageError: class StorageError extends Error {}
}))

vi.mock('../../src/utils/storage', () => ({
  safeStorageOperation: vi.fn((operation, fn, fallback) => {
    try {
      return fn()
    } catch (e) {
      if (fallback !== undefined) return fallback
      return false
    }
  })
}))

vi.mock('../../src/utils/gameState', () => ({
  normalizeSetlistForSave: vi.fn()
}))

vi.mock('../../src/utils/objectUtils', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    safeJsonParse: vi.fn(() => {
      throw new Error('JSON Parse error')
    }),
    isLooseRecord: vi.fn().mockReturnValue(true)
  }
})

vi.mock('../../src/utils/saveValidator', () => ({
  validateSaveData: vi.fn()
}))

vi.mock('../../src/utils/unlockManager', () => ({
  addUnlock: vi.fn(),
  getUnlocks: vi.fn().mockReturnValue([])
}))

vi.mock('../../src/utils/logger', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  }
})

describe('usePersistence', () => {
  let mockStateRef: any
  let mockDispatch: any
  let mockAddToast: any
  let mockTRef: any

  beforeEach(() => {
    vi.resetAllMocks()

    mockStateRef = { current: { currentScene: 'MOCK_SCENE' } }
    mockDispatch = vi.fn()
    mockAddToast = vi.fn()
    mockTRef = {
      current: vi.fn((key, options) => options?.defaultValue || key)
    }

    vi.spyOn(Storage.prototype, 'getItem')
    vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'removeItem')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadGame', () => {
    it('should return false and call handleError when save file contains invalid JSON', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => '{invalid-json}')
      localStorage.setItem(SAVE_KEY, '{invalid-json}')

      const { result } = renderHook(() =>
        usePersistence({
          currentScene: 'MOCK_SCENE',
          stateRef: mockStateRef,
          dispatch: mockDispatch,
          addToast: mockAddToast,
          tRef: mockTRef
        })
      )

      let loadResult
      act(() => {
        loadResult = result.current.loadGame()
      })

      expect(loadResult).toBe(false)
      expect(handleError).toHaveBeenCalledTimes(1)
      expect(handleError).toHaveBeenCalledWith(
        expect.any(StateError),
        expect.objectContaining({ addToast: mockAddToast })
      )

      const errorArg = vi.mocked(handleError).mock.calls[0][0] as Error
      expect(errorArg.message).toBe('Save file parsing failed. Falling back to initial state.')
    })
  })
})
