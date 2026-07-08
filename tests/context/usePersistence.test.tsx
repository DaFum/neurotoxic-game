import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

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
  safeStorageOperation: vi.fn((_operation, fn) => fn())
}))

vi.mock('../../src/utils/gameState', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../src/utils/gameState')>()
  return {
    ...actual,
    normalizeSetlistForSave: vi.fn(),
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
  const actual = await importOriginal<typeof import('../../src/utils/logger')>()
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  }
})

const { usePersistence, SAVE_KEY, createRawLoadPayload } =
  await import('../../src/context/usePersistence')
const { handleError, StateError } = await import('../../src/utils/errorHandler')
const { safeStorageOperation } = await import('../../src/utils/storage')

describe('usePersistence', () => {
  let mockStateRef: { current: unknown }
  let mockDispatch: ReturnType<typeof vi.fn>
  let mockAddToast: ReturnType<typeof vi.fn>
  let mockTRef: { current: unknown }

  beforeEach(() => {
    vi.resetAllMocks()

    mockStateRef = { current: { currentScene: 'MOCK_SCENE' } }
    mockDispatch = vi.fn()
    mockAddToast = vi.fn()
    mockTRef = {
      current: vi.fn((key, options) => options?.defaultValue ?? key)
    }

    vi.spyOn(Storage.prototype, 'getItem')
    vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'removeItem')

    vi.mocked(safeStorageOperation).mockImplementation((_operation, fn) => fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadGame', () => {
    it('should return false and call handleError when save file contains invalid JSON', () => {
      localStorage.setItem(SAVE_KEY, '{invalid-json}')
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{invalid-json}')

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

      expect(safeStorageOperation).toHaveBeenCalledTimes(1)

      expect(loadResult).toBe(false)
      expect(handleError).toHaveBeenCalledTimes(1)
      expect(handleError).toHaveBeenCalledWith(
        expect.any(StateError),
        expect.objectContaining({ addToast: mockAddToast })
      )

      const mockCalls = vi.mocked(handleError).mock.calls
      expect(mockCalls.length).toBeGreaterThan(0)
      const firstCall = mockCalls[0]
      expect(firstCall).toBeDefined()
      const errorArg = firstCall![0] as Error
      expect(errorArg.message).toBe(
        'Save file parsing failed. Falling back to initial state.'
      )
    })
  })

  describe('createRawLoadPayload', () => {
    it('accepts finite number and string versions', () => {
      expect(createRawLoadPayload({ version: 3 }, []).version).toBe(3)
      expect(createRawLoadPayload({ version: '3' }, []).version).toBe('3')
    })

    it('rejects non-finite number versions', () => {
      expect(
        createRawLoadPayload({ version: Number.NaN }, [])
      ).not.toHaveProperty('version')
      expect(
        createRawLoadPayload({ version: Number.POSITIVE_INFINITY }, [])
      ).not.toHaveProperty('version')
    })
  })
})
