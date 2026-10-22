import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../src/utils/logger', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/utils/logger')>()
  return {
    ...actual,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
  }
})

const { usePersistence, SAVE_KEY } =
  await import('../../src/context/usePersistence')
const { CURRENT_SAVE_VERSION } =
  await import('../../src/context/reducers/migrations')
const { GAME_PHASES } = await import('../../src/context/gameConstants')
const { createInitialState } = await import('../../src/context/initialState')
const { ActionTypes } = await import('../../src/context/actionTypes')
const { resetStorageFallback } = await import('../../src/utils/storage')

const INCOMPATIBLE_KEY = 'ui:save.incompatibleVersion'

// A save written by a build one schema ahead: it carries a field this build
// has never heard of, which a load-then-save round trip would silently drop.
const FUTURE_SAVE = JSON.stringify({
  version: CURRENT_SAVE_VERSION + 1,
  player: { money: 4321 },
  band: {},
  social: {},
  gameMap: null,
  futureProgress: { chapter: 7, secrets: ['a', 'b'] }
})

const savePayload = (version: number) =>
  JSON.stringify({
    version,
    player: { money: 100 },
    band: {},
    social: {},
    gameMap: null
  })

const renderPersistence = () => {
  const dispatch = vi.fn()
  const addToast = vi.fn()
  const stateRef = { current: createInitialState({ unlocks: [] }) }
  const tRef = { current: vi.fn((key: string) => key) }
  const hook = renderHook(
    ({ currentScene }) =>
      usePersistence({
        currentScene,
        stateRef,
        dispatch,
        addToast,
        // The hook only ever calls tRef.current(key, options).
        tRef: tRef as never
      }),
    { initialProps: { currentScene: GAME_PHASES.MENU as string } }
  )
  return { ...hook, dispatch, addToast }
}

const toastMessages = (addToast: ReturnType<typeof vi.fn>): string[] =>
  addToast.mock.calls.map(call => String(call[0]))

describe('future-version save protection', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('refuses to load a newer save and tells the player why', () => {
    localStorage.setItem(SAVE_KEY, FUTURE_SAVE)
    const { result, dispatch, addToast } = renderPersistence()

    let loaded: boolean | undefined
    act(() => {
      loaded = result.current.loadGame()
    })

    expect(loaded).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
    expect(
      toastMessages(addToast).some(m => m.includes(INCOMPATIBLE_KEY))
    ).toBe(true)
    expect(localStorage.getItem(SAVE_KEY)).toBe(FUTURE_SAVE)
  })

  it('keeps the newer save byte-for-byte through navigation and every save request', () => {
    localStorage.setItem(SAVE_KEY, FUTURE_SAVE)
    const { result, rerender } = renderPersistence()

    act(() => {
      result.current.loadGame()
    })

    let saved: boolean | undefined
    act(() => {
      saved = result.current.saveGame(true)
    })
    expect(saved).toBe(false)

    const onSaved = vi.fn()
    act(() => {
      result.current.saveGameAfterStateCommit(onSaved)
    })
    expect(onSaved).toHaveBeenCalledWith(false)

    // Both autosaving transitions.
    rerender({ currentScene: GAME_PHASES.OVERWORLD })
    rerender({ currentScene: GAME_PHASES.GAMEOVER })
    rerender({ currentScene: GAME_PHASES.POST_GIG })
    rerender({ currentScene: GAME_PHASES.OVERWORLD })

    expect(localStorage.getItem(SAVE_KEY)).toBe(FUTURE_SAVE)
  })

  it('will not overwrite a newer save another tab wrote mid-session', () => {
    localStorage.setItem(SAVE_KEY, savePayload(CURRENT_SAVE_VERSION))
    const { result, addToast } = renderPersistence()

    act(() => {
      expect(result.current.loadGame()).toBe(true)
    })

    localStorage.setItem(SAVE_KEY, FUTURE_SAVE)

    let saved: boolean | undefined
    act(() => {
      saved = result.current.saveGame(false)
    })

    expect(saved).toBe(false)
    expect(localStorage.getItem(SAVE_KEY)).toBe(FUTURE_SAVE)
    expect(
      toastMessages(addToast).some(m => m.includes(INCOMPATIBLE_KEY))
    ).toBe(true)
  })

  it('still loads a current-version save and an older one', () => {
    for (const version of [CURRENT_SAVE_VERSION, 1]) {
      localStorage.setItem(SAVE_KEY, savePayload(version))
      const { result, dispatch, unmount } = renderPersistence()

      let loaded: boolean | undefined
      act(() => {
        loaded = result.current.loadGame()
      })

      expect(loaded, `version ${version}`).toBe(true)
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: ActionTypes.LOAD_GAME })
      )
      unmount()
    }
  })

  it('saves normally over a current-version save', () => {
    localStorage.setItem(SAVE_KEY, savePayload(CURRENT_SAVE_VERSION))
    const { result } = renderPersistence()

    let saved: boolean | undefined
    act(() => {
      saved = result.current.saveGame(false)
    })

    expect(saved).toBe(true)
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}').version).toBe(
      CURRENT_SAVE_VERSION
    )
  })
})
