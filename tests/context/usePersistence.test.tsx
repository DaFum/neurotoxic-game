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

vi.mock('../../src/utils/storage', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../src/utils/storage')>()
  return {
    ...actual,
    safeStorageOperation: vi.fn((_operation, fn) => fn())
  }
})

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
const gameStateModule = await import('../../src/utils/gameState')
const { writeStorageItem } = await import('../../src/utils/storage')
const { getUnlocks } = await import('../../src/utils/unlockManager')
const { CURRENT_SAVE_VERSION } =
  await import('../../src/context/reducers/migrations/index')
const { GAME_PHASES } = await import('../../src/context/gameConstants')

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

  it('flushes a queued save at the next commit, not at the next scene', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

    try {
      const { result, rerender } = renderHook(
        ({ currentScene }) =>
          usePersistence({
            currentScene,
            stateRef: mockStateRef,
            dispatch: mockDispatch,
            addToast: mockAddToast,
            tRef: mockTRef
          }),
        { initialProps: { currentScene: 'TRAVEL_MINIGAME' } }
      )

      // The commit a command makes without navigating: the state changes, the
      // scene does not. The request used to sit in a ref until some later
      // scene transition happened to run the effect, so a change like this one
      // was never written at all.
      act(() => {
        mockStateRef.current = {
          currentScene: 'TRAVEL_MINIGAME',
          currentGig: { id: 'venue_1' }
        }
        result.current.saveGameAfterStateCommit()
      })

      expect(safeStorageOperation).toHaveBeenCalledTimes(1)
      expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}')).toMatchObject({
        currentScene: 'TRAVEL_MINIGAME',
        currentGig: { id: 'venue_1' }
      })

      // One save per request, not one per render: a re-render that asked for
      // nothing must not rewrite the save.
      rerender({ currentScene: 'TRAVEL_MINIGAME' })
      expect(safeStorageOperation).toHaveBeenCalledTimes(1)
    } finally {
      setItemSpy.mockRestore()
    }
  })

  it('writes no POST_GIG save until the gig settlement record requests one', () => {
    const { result, rerender } = renderHook(
      ({ currentScene }) =>
        usePersistence({
          currentScene,
          stateRef: mockStateRef,
          dispatch: mockDispatch,
          addToast: mockAddToast,
          tRef: mockTRef
        }),
      { initialProps: { currentScene: GAME_PHASES.GIG as string } }
    )
    const savedState = () => JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}')
    const preGigSave = { currentScene: GAME_PHASES.PRE_GIG, marker: 'pre_gig' }
    writeStorageItem(SAVE_KEY, JSON.stringify(preGigSave))

    // The gig finishes: the scene flips before PostGig mounts and records the
    // settlement. A snapshot here would be a played gig with nothing to settle
    // on load, so a crash now must reload the pre-gig save instead.
    mockStateRef.current = {
      currentScene: GAME_PHASES.POST_GIG,
      lastGigStats: { score: 7100, accuracy: 80 },
      pendingGigSettlement: null
    }
    rerender({ currentScene: GAME_PHASES.POST_GIG })
    expect(safeStorageOperation).not.toHaveBeenCalled()
    expect(savedState()).toEqual(preGigSave)

    // PostGig's mount effect records the settlement and requests the save:
    // the first durable POST_GIG snapshot carries the record.
    const settlement = { id: 'settlement_1', gigId: 'venue_1', net: 250 }
    act(() => {
      mockStateRef.current = {
        ...(mockStateRef.current as Record<string, unknown>),
        pendingGigSettlement: settlement
      }
      result.current.saveGameAfterStateCommit()
    })
    expect(safeStorageOperation).toHaveBeenCalledTimes(1)
    expect(savedState()).toMatchObject({
      currentScene: GAME_PHASES.POST_GIG,
      pendingGigSettlement: settlement
    })

    // Leaving POST_GIG still autosaves, which covers screens that never record.
    mockStateRef.current = { currentScene: GAME_PHASES.OVERWORLD }
    rerender({ currentScene: GAME_PHASES.OVERWORLD })
    expect(safeStorageOperation).toHaveBeenCalledTimes(2)
    expect(savedState()).toMatchObject({ currentScene: GAME_PHASES.OVERWORLD })
  })

  it('autosaves the stranded ending when the Overworld hands over to GAMEOVER', () => {
    const { rerender } = renderHook(
      ({ currentScene }) =>
        usePersistence({
          currentScene,
          stateRef: mockStateRef,
          dispatch: mockDispatch,
          addToast: mockAddToast,
          tRef: mockTRef
        }),
      { initialProps: { currentScene: GAME_PHASES.OVERWORLD as string } }
    )
    // The stranded check saves before it changes scene, so that save has no
    // ending; only the save after the commit can make it durable.
    mockStateRef.current = {
      currentScene: GAME_PHASES.GAMEOVER,
      terminalOutcome: { reason: 'stranded' }
    }
    rerender({ currentScene: GAME_PHASES.GAMEOVER })

    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}')).toMatchObject({
      currentScene: GAME_PHASES.GAMEOVER,
      terminalOutcome: { reason: 'stranded' }
    })
  })

  it('persists the settled state when a load consumes a pending gig settlement', () => {
    const { isLooseRecord } = vi.mocked(gameStateModule)
    vi.mocked(getUnlocks).mockReturnValue([])
    isLooseRecord.mockImplementation(
      (value: unknown) =>
        typeof value === 'object' && value !== null && !Array.isArray(value)
    )
    const loadSave = (save: Record<string, unknown>) => {
      writeStorageItem(SAVE_KEY, JSON.stringify(save))
      const { result } = renderHook(() =>
        usePersistence({
          currentScene: 'MOCK_SCENE',
          stateRef: mockStateRef,
          dispatch: mockDispatch,
          addToast: mockAddToast,
          tRef: mockTRef
        })
      )
      vi.mocked(safeStorageOperation).mockClear()
      let loaded = false
      act(() => {
        loaded = result.current.loadGame()
      })
      expect(loaded).toBe(true)
      return vi
        .mocked(safeStorageOperation)
        .mock.calls.map(([operation]) => operation)
    }
    const baseSave = {
      version: CURRENT_SAVE_VERSION,
      player: {},
      band: {},
      unlocks: []
    }

    expect(
      loadSave({
        ...baseSave,
        pendingGigSettlement: { id: 'settlement_1', gigId: 'venue_1' }
      })
    ).toContain('saveGame')
    expect(loadSave({ ...baseSave, pendingGigSettlement: null })).not.toContain(
      'saveGame'
    )
  })

  it('reports the write outcome to a caller waiting on it', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

    try {
      const { result } = renderHook(() =>
        usePersistence({
          currentScene: 'MOCK_SCENE',
          stateRef: mockStateRef,
          dispatch: mockDispatch,
          addToast: mockAddToast,
          tRef: mockTRef
        })
      )

      let saved: boolean | null = null
      act(() => {
        result.current.saveGameAfterStateCommit(outcome => {
          saved = outcome
        })
      })
      expect(saved).toBe(true)

      // A refused write is the case the continuation exists for: the unlock
      // journal refunds on it rather than granting.
      vi.mocked(safeStorageOperation).mockReturnValue(false)
      let refused: boolean | null = null
      act(() => {
        result.current.saveGameAfterStateCommit(outcome => {
          refused = outcome
        })
      })
      expect(refused).toBe(false)
      // The player sees the localized save-failure copy, not the raw
      // StorageError message.
      expect(mockTRef.current).toHaveBeenCalledWith(
        'ui:save.saveFailed',
        expect.objectContaining({ defaultValue: 'Failed to save game.' })
      )
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          addToast: mockAddToast,
          fallbackMessage: 'Failed to save game.'
        })
      )
    } finally {
      setItemSpy.mockRestore()
    }
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
