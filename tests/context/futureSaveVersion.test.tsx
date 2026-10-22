import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../../src/utils/logger', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/utils/logger')>()
  return {
    ...actual,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
  }
})

const { usePersistence, SAVE_KEY, getSaveSlotKey } =
  await import('../../src/context/usePersistence')
const { CURRENT_SAVE_VERSION } =
  await import('../../src/context/reducers/migrations')
const { GAME_PHASES } = await import('../../src/context/gameConstants')
const { createInitialState } = await import('../../src/context/initialState')
const { ActionTypes } = await import('../../src/context/actionTypes')
const { resetStorageFallback } = await import('../../src/utils/storage')
const { InMemoryAdapter } = await import('../../src/utils/storageAdapter')
const { StorageProvider } = await import('../../src/context/StorageContext')

const INCOMPATIBLE_KEY = 'ui:save.incompatibleVersion'

// The slot a build one schema ahead writes. Literal on purpose: no build at
// the current version can produce it.
const NEWER_SLOT = `${SAVE_KEY}.v3`

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

const savePayload = (version: number, money = 100) =>
  JSON.stringify({
    version,
    player: { money },
    band: {},
    social: {},
    gameMap: null
  })

const renderPersistence = (adapter?: InstanceType<typeof InMemoryAdapter>) => {
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
    {
      initialProps: { currentScene: GAME_PHASES.MENU as string },
      ...(adapter && {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StorageProvider adapter={adapter}>{children}</StorageProvider>
        )
      })
    }
  )
  return { ...hook, dispatch, addToast }
}

const toastMessages = (addToast: ReturnType<typeof vi.fn>): string[] =>
  addToast.mock.calls.map(call => String(call[0]))

const loadedMoney = (dispatch: ReturnType<typeof vi.fn>): unknown =>
  (
    dispatch.mock.calls[0]?.[0] as {
      payload?: { player?: { money?: unknown } }
    }
  )?.payload?.player?.money

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

  it('fails closed while the slot cannot be read, so a memory fallback never shadows a newer save', () => {
    localStorage.setItem(SAVE_KEY, FUTURE_SAVE)
    const { result } = renderPersistence()

    const failing = () => {
      throw new Error('SecurityError')
    }
    const getSpy = vi
      .spyOn(window.localStorage, 'getItem')
      .mockImplementation(failing)
    const setSpy = vi
      .spyOn(window.localStorage, 'setItem')
      .mockImplementation(failing)

    let savedDuringOutage: boolean | undefined
    act(() => {
      savedDuringOutage = result.current.saveGame(false)
    })
    expect(savedDuringOutage).toBe(false)

    getSpy.mockRestore()
    setSpy.mockRestore()

    let savedAfterRecovery: boolean | undefined
    act(() => {
      savedAfterRecovery = result.current.saveGame(false)
    })
    expect(savedAfterRecovery).toBe(false)
    expect(localStorage.getItem(SAVE_KEY)).toBe(FUTURE_SAVE)
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

  // These run on an injected adapter: the global localStorage stub in
  // tests/vitest.setup.js cannot enumerate keys, and slot discovery does.
  describe('version-specific save slots', () => {
    let adapter: InstanceType<typeof InMemoryAdapter>

    beforeEach(() => {
      adapter = new InMemoryAdapter()
    })

    it('keeps the shared key for every shipped version and a slot of its own from v3 on', () => {
      expect(getSaveSlotKey(1)).toBe(SAVE_KEY)
      expect(getSaveSlotKey(2)).toBe(SAVE_KEY)
      expect(getSaveSlotKey(3)).toBe(NEWER_SLOT)
      expect(getSaveSlotKey(4)).toBe(`${SAVE_KEY}.v4`)
    })

    it('refuses to save while a newer build owns its own slot, and writes neither slot', () => {
      const currentSave = savePayload(CURRENT_SAVE_VERSION)
      adapter.set(SAVE_KEY, currentSave)
      adapter.set(NEWER_SLOT, FUTURE_SAVE)
      const { result, addToast } = renderPersistence(adapter)
      const setSpy = vi.spyOn(adapter, 'set')

      const outcomes: boolean[] = []
      act(() => {
        outcomes.push(result.current.saveGame(true))
        outcomes.push(result.current.saveGame(false))
      })

      expect(outcomes).toEqual([false, false])
      expect(
        toastMessages(addToast).filter(m => m.includes(INCOMPATIBLE_KEY))
      ).toHaveLength(1)
      expect(setSpy).not.toHaveBeenCalled()
      expect(adapter.get(SAVE_KEY)).toBe(currentSave)
      expect(adapter.get(NEWER_SLOT)).toBe(FUTURE_SAVE)
    })

    it('loads the shared slot, ignores newer slots and deletes nothing', () => {
      const currentSave = savePayload(CURRENT_SAVE_VERSION, 222)
      const furtherSave = savePayload(CURRENT_SAVE_VERSION + 5, 777)
      adapter.set(SAVE_KEY, currentSave)
      adapter.set(NEWER_SLOT, FUTURE_SAVE)
      adapter.set(`${SAVE_KEY}.v7`, furtherSave)
      const { result, dispatch } = renderPersistence(adapter)

      let loaded: boolean | undefined
      act(() => {
        loaded = result.current.loadGame()
      })

      expect(loaded).toBe(true)
      expect(loadedMoney(dispatch)).toBe(222)
      expect(adapter.get(SAVE_KEY)).toBe(currentSave)
      expect(adapter.get(NEWER_SLOT)).toBe(FUTURE_SAVE)
      expect(adapter.get(`${SAVE_KEY}.v7`)).toBe(furtherSave)
    })

    it('reports a newer save rather than none when only a newer slot exists', () => {
      adapter.set(NEWER_SLOT, FUTURE_SAVE)
      const { result, dispatch, addToast } = renderPersistence(adapter)

      let loaded: boolean | undefined
      act(() => {
        loaded = result.current.loadGame()
      })

      expect(loaded).toBe(false)
      expect(dispatch).not.toHaveBeenCalled()
      expect(
        toastMessages(addToast).some(m => m.includes(INCOMPATIBLE_KEY))
      ).toBe(true)
      expect(adapter.get(NEWER_SLOT)).toBe(FUTURE_SAVE)
    })

    it('keeps a newer save written between the version check and the write', () => {
      // A newer build follows the same scheme, so it writes the slot for its
      // own version. The adapter lets that write land at the worst moment:
      // after this build checked for newer saves, before its write lands.
      const newerSlot = getSaveSlotKey(CURRENT_SAVE_VERSION + 1)
      const ownSlot = getSaveSlotKey(CURRENT_SAVE_VERSION)
      class RacingAdapter extends InMemoryAdapter {
        raced = false
        override set(key: string, value: string): boolean {
          if (key === ownSlot && !this.raced) {
            this.raced = true
            super.set(newerSlot, FUTURE_SAVE)
          }
          return super.set(key, value)
        }
      }
      const racing = new RacingAdapter()
      const { result } = renderPersistence(racing)

      let saved: boolean | undefined
      act(() => {
        saved = result.current.saveGame(false)
      })

      expect(racing.raced).toBe(true)
      expect(saved).toBe(true)
      expect(racing.get(newerSlot)).toBe(FUTURE_SAVE)
      expect(JSON.parse(racing.get(ownSlot) ?? '{}').version).toBe(
        CURRENT_SAVE_VERSION
      )

      // From here on the newer save is visible, so this build stops writing.
      let savedAgain: boolean | undefined
      act(() => {
        savedAgain = result.current.saveGame(false)
      })
      expect(savedAgain).toBe(false)
      expect(racing.get(newerSlot)).toBe(FUTURE_SAVE)
    })
  })

  describe('a build that writes a version slot of its own', () => {
    // Models the first build past the shared key, so the slot choice on load
    // and on save can be exercised before such a build exists.
    const FUTURE_BUILD_VERSION = 4
    type PersistenceModule = typeof import('../../src/context/usePersistence')
    type StorageContextModule =
      typeof import('../../src/context/StorageContext')
    let futureBuild: PersistenceModule
    let futureStorageContext: StorageContextModule
    let adapter: InstanceType<typeof InMemoryAdapter>

    beforeEach(async () => {
      vi.resetModules()
      vi.doMock('../../src/context/reducers/migrations', async () => {
        const actual = await vi.importActual<
          typeof import('../../src/context/reducers/migrations')
        >('../../src/context/reducers/migrations')
        return { ...actual, CURRENT_SAVE_VERSION: FUTURE_BUILD_VERSION }
      })
      futureBuild = await import('../../src/context/usePersistence')
      futureStorageContext = await import('../../src/context/StorageContext')
      adapter = new InMemoryAdapter()
    })

    afterEach(() => {
      vi.doUnmock('../../src/context/reducers/migrations')
      vi.resetModules()
    })

    const renderFutureBuild = () => {
      const dispatch = vi.fn()
      const addToast = vi.fn()
      const stateRef = { current: createInitialState({ unlocks: [] }) }
      const tRef = { current: vi.fn((key: string) => key) }
      const { StorageProvider: FutureStorageProvider } = futureStorageContext
      const hook = renderHook(
        () =>
          futureBuild.usePersistence({
            currentScene: GAME_PHASES.MENU,
            stateRef,
            dispatch,
            addToast,
            tRef: tRef as never
          }),
        {
          wrapper: ({ children }: { children: ReactNode }) => (
            <FutureStorageProvider adapter={adapter}>
              {children}
            </FutureStorageProvider>
          )
        }
      )
      return { ...hook, dispatch, addToast }
    }

    it('loads the highest slot it supports and leaves the lower ones as they were', () => {
      const legacySave = savePayload(2, 222)
      const v3Save = savePayload(3, 333)
      const v5Save = savePayload(5, 555)
      adapter.set(SAVE_KEY, legacySave)
      adapter.set(NEWER_SLOT, v3Save)
      adapter.set(`${SAVE_KEY}.v5`, v5Save)
      const { result, dispatch } = renderFutureBuild()

      let loaded: boolean | undefined
      act(() => {
        loaded = result.current.loadGame()
      })

      expect(loaded).toBe(true)
      expect(loadedMoney(dispatch)).toBe(333)
      expect(adapter.get(SAVE_KEY)).toBe(legacySave)
      expect(adapter.get(NEWER_SLOT)).toBe(v3Save)
      expect(adapter.get(`${SAVE_KEY}.v5`)).toBe(v5Save)
    })

    it('writes only its own slot', () => {
      const legacySave = savePayload(2, 222)
      adapter.set(SAVE_KEY, legacySave)
      const { result } = renderFutureBuild()

      let saved: boolean | undefined
      act(() => {
        saved = result.current.saveGame(false)
      })

      expect(saved).toBe(true)
      expect(adapter.get(SAVE_KEY)).toBe(legacySave)
      expect(adapter.get(`${SAVE_KEY}.v4`)).not.toBeNull()
      expect(adapter.keys().sort()).toEqual([SAVE_KEY, `${SAVE_KEY}.v4`])
    })
  })
})
