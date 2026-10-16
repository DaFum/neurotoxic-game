import { useReducer } from 'react'
import i18next from 'i18next'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMainMenuStart } from '../../src/scenes/mainmenu/hooks/useMainMenuStart'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'
import {
  createResetStateAction,
  createUpdatePlayerAction
} from '../../src/context/actionCreators'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { InMemoryAdapter } from '../../src/utils/storageAdapter'
import {
  isStorageDegraded,
  readStorageItem,
  resetStorageFallback
} from '../../src/utils/storage'

vi.mock('../../src/utils/fullscreen', () => ({
  enterFullscreen: vi.fn().mockResolvedValue(undefined)
}))

const PLAYER_ID = '12345678-1234-4123-8123-123456789abc'
const ID_KEY = 'neurotoxic_player_id'
const NAME_KEY = 'neurotoxic_player_name'

const renderStartFlow = () => {
  const resetStorage = new InMemoryAdapter()
  const updatePlayer = vi.fn()
  const changeScene = vi.fn()
  // Audio may stay pending without delaying the player's new tour.
  const initializeAudio = vi.fn(() => new Promise<void>(() => {}))
  const { result } = renderHook(() => {
    const [state, dispatch] = useReducer(gameReducer, undefined, () =>
      createInitialState({ savedSettings: {}, rngSeed: 1, runSeed: 1 })
    )
    const start = useMainMenuStart({
      setIsStarting: vi.fn(),
      resetState: () => dispatch(createResetStateAction({}, resetStorage)),
      updatePlayer: identity => {
        updatePlayer(identity)
        dispatch(createUpdatePlayerAction(identity))
      },
      changeScene,
      initializeAudio,
      setShowNameInput: vi.fn(),
      setShowExistingSavePrompt: vi.fn(),
      playerNameInput: '  TestPlayer  ',
      addToast: vi.fn(),
      tRef: { current: i18next.t }
    })
    return { state, start }
  })
  return { result, updatePlayer, changeScene, initializeAudio }
}

describe('useMainMenuStart identity handoff', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStorageFallback()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(PLAYER_ID)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    resetStorageFallback()
  })

  it.each(['available', 'unreadable', 'unwritable'] as const)(
    'keeps the submitted identity after reset when storage is %s',
    storageStatus => {
      const flow = renderStartFlow()
      if (storageStatus === 'unreadable') {
        vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
          throw new Error('Storage reads are unavailable')
        })
      } else if (storageStatus === 'unwritable') {
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
          throw new Error('Storage writes are unavailable')
        })
      }

      act(() => flow.result.current.start.handleNameSubmit())

      expect(flow.result.current.state.player).toMatchObject({
        playerId: PLAYER_ID,
        playerName: 'TestPlayer'
      })
      expect(flow.updatePlayer).toHaveBeenCalledExactlyOnceWith({
        playerId: PLAYER_ID,
        playerName: 'TestPlayer'
      })
      expect(flow.changeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      expect(flow.initializeAudio).toHaveBeenCalledOnce()

      if (storageStatus === 'unwritable') {
        expect(isStorageDegraded()).toBe(true)
        expect(readStorageItem(ID_KEY)).toBe(PLAYER_ID)
        expect(readStorageItem(NAME_KEY)).toBe('TestPlayer')
      }
    }
  )

  it.each([false, true])(
    'keeps the resolved existing identity when repeated storage reads fail: %s',
    failRepeatedReads => {
      localStorage.setItem(ID_KEY, 'existing-id')
      localStorage.setItem(NAME_KEY, 'ExistingPlayer')
      const flow = renderStartFlow()
      if (failRepeatedReads) {
        const getItem = window.localStorage.getItem.bind(window.localStorage)
        const reads = new Set<string>()
        vi.spyOn(window.localStorage, 'getItem').mockImplementation(key => {
          if (key === ID_KEY || key === NAME_KEY) {
            if (reads.has(key)) throw new Error('Storage became unreadable')
            reads.add(key)
          }
          return getItem(key)
        })
      }

      act(() => flow.result.current.start.handleStartTour())

      expect(flow.result.current.state.player).toMatchObject({
        playerId: 'existing-id',
        playerName: 'ExistingPlayer'
      })
      expect(flow.updatePlayer).toHaveBeenCalledExactlyOnceWith({
        playerId: 'existing-id',
        playerName: 'ExistingPlayer'
      })
      expect(flow.changeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      expect(flow.initializeAudio).toHaveBeenCalledOnce()
    }
  )
})
