import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../../src/context/reducers/migrations', () => ({
  CURRENT_SAVE_VERSION: 2,
  SAVE_MIGRATIONS: [],
  runSaveMigrations: vi.fn()
}))

vi.mock('../../src/utils/logger', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/utils/logger')>()
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      setLevel: vi.fn()
    }
  }
})

const { migrateLoadedSave, usePersistence, createPersistedState, SAVE_KEY } =
  await import('../../src/context/usePersistence')
const { handleLoadGame } =
  await import('../../src/context/reducers/systemReducer')
const { createInitialState } = await import('../../src/context/initialState')
const { GAME_PHASES } = await import('../../src/context/gameConstants')
const { GameStateProvider, useGameActions } =
  await import('../../src/context/GameState')
const { StorageProvider } = await import('../../src/context/StorageContext')
const { InMemoryAdapter } = await import('../../src/utils/storageAdapter')
const { logger } = await import('../../src/utils/logger')
const { runSaveMigrations } =
  await import('../../src/context/reducers/migrations')
const { getQuarantineKey, quarantineSave } =
  await import('../../src/utils/saveQuarantine')
const { resetStorageFallback } = await import('../../src/utils/storage')

describe('migrateLoadedSave', () => {
  const rawSave = '{"version":1,"player":{"money":100}}'
  const parsed = { version: 1, player: { money: 100 } }

  beforeEach(() => {
    vi.mocked(runSaveMigrations).mockReset()
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    // writeStorageItem sets a module-level degraded flag and memory entry that
    // localStorage.clear() does not touch; leaking it poisons later suites.
    resetStorageFallback()
    localStorage.clear()
  })

  it('stamps the current version on a successfully migrated payload', () => {
    vi.mocked(runSaveMigrations).mockReturnValue({
      ...parsed,
      player: { money: 250 }
    })

    expect(migrateLoadedSave(parsed, rawSave)).toEqual({
      ok: true,
      migrated: { version: 2, player: { money: 250 } }
    })
    expect(localStorage.getItem(getQuarantineKey(1))).toBeNull()
  })

  it('skips the chain for a payload already at the current version', () => {
    const current = { version: 2, player: { money: 100 } }

    expect(migrateLoadedSave(current, rawSave)).toEqual({
      ok: true,
      migrated: current
    })
    expect(runSaveMigrations).not.toHaveBeenCalled()
  })

  it('quarantines the raw payload before giving up on a throwing migration', () => {
    vi.mocked(runSaveMigrations).mockImplementation(() => {
      throw new Error('v1_to_v2 exploded')
    })

    expect(migrateLoadedSave(parsed, rawSave)).toEqual({
      ok: false,
      quarantined: true
    })

    const quarantined = localStorage.getItem(getQuarantineKey(1))
    expect(quarantined).not.toBeNull()
    expect(JSON.parse(quarantined ?? '{}')).toEqual({
      version: 1,
      reason: 'v1_to_v2 exploded',
      raw: rawSave
    })
  })

  it('quarantines when a migration returns a non-object payload', () => {
    vi.mocked(runSaveMigrations).mockReturnValue('corrupt')

    expect(migrateLoadedSave(parsed, rawSave)).toEqual({
      ok: false,
      quarantined: true
    })
    expect(localStorage.getItem(getQuarantineKey(1))).not.toBeNull()
  })

  it('treats a missing or unusable version marker as version 0', () => {
    vi.mocked(runSaveMigrations).mockImplementation(() => {
      throw new Error('boom')
    })

    expect(migrateLoadedSave({ player: {} }, rawSave)).toEqual({
      ok: false,
      quarantined: true
    })
    expect(localStorage.getItem(getQuarantineKey(0))).not.toBeNull()
  })
})

describe('quarantineSave', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('reports failure instead of throwing when storage refuses the write', () => {
    const setItem = vi
      .spyOn(window.localStorage, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

    try {
      expect(quarantineSave('{}', 1, 'reason')).toBe(false)
    } finally {
      setItem.mockRestore()
    }
  })
})

/** Rejects quarantine writes the way a full storage quota would. */
const refuseQuarantineWrites = () => {
  const setItem = window.localStorage.setItem.bind(window.localStorage)
  return vi
    .spyOn(window.localStorage, 'setItem')
    .mockImplementation((key: string, value: string) => {
      if (key.startsWith('neurotoxic:save:quarantine:')) {
        throw new DOMException('QuotaExceededError')
      }
      setItem(key, value)
    })
}

describe('migrateLoadedSave quarantine outcome', () => {
  beforeEach(() => {
    vi.mocked(runSaveMigrations).mockReset()
    vi.mocked(runSaveMigrations).mockImplementation(() => {
      throw new Error('boom')
    })
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  it('reports the copy as not kept when storage refuses it', () => {
    refuseQuarantineWrites()

    expect(migrateLoadedSave({ version: 1 }, '{"version":1}')).toEqual({
      ok: false,
      quarantined: false
    })
  })

  it('writes nothing and claims no copy for a preview', () => {
    expect(
      migrateLoadedSave({ version: 1 }, '{"version":1}', undefined, {
        quarantine: false
      })
    ).toEqual({ ok: false, quarantined: false })
    expect(localStorage.getItem(getQuarantineKey(1))).toBeNull()
  })
})

describe('handleLoadGame version marker', () => {
  beforeEach(() => {
    vi.mocked(runSaveMigrations).mockReset()
    vi.mocked(logger.error).mockClear()
  })

  it('migrates a versionless payload from version 0', () => {
    vi.mocked(runSaveMigrations).mockImplementation((payload, fromVersion) =>
      fromVersion < 2
        ? { ...(payload as object), player: { money: 999 } }
        : payload
    )

    const loaded = handleLoadGame(createInitialState(), {
      player: { money: 100 }
    })

    expect(runSaveMigrations).toHaveBeenCalledWith(expect.anything(), 0)
    expect(loaded.player.money).toBe(999)
    expect(loaded.version).toBe(2)
  })

  it('still honors an explicit version marker', () => {
    vi.mocked(runSaveMigrations).mockImplementation(payload => payload)

    handleLoadGame(createInitialState(), { version: 1, player: {} })

    expect(runSaveMigrations).toHaveBeenCalledWith(expect.anything(), 1)
  })

  it('loads the unmigrated payload when a versionless migration throws', () => {
    vi.mocked(runSaveMigrations).mockImplementation((payload, fromVersion) => {
      if (fromVersion < 2) throw new Error('v0 step exploded')
      return payload
    })

    const loaded = handleLoadGame(createInitialState(), {
      player: { money: 100 }
    })

    expect(loaded.player.money).toBe(100)
    expect(loaded.currentScene).toBe(GAME_PHASES.OVERWORLD)
    expect(logger.error).toHaveBeenCalledWith(
      'GameState',
      'Save migration from version 0 failed; loading unmigrated payload',
      'v0 step exploded'
    )
  })
})

describe('failed migration whose recovery copy is refused', () => {
  const v1Save = JSON.stringify({
    ...createPersistedState(createInitialState()),
    version: 1
  })

  const renderPersistence = () => {
    const addToast = vi.fn()
    const stateRef = { current: createInitialState({ unlocks: [] }) }
    const tRef = { current: vi.fn((key: string) => key) }
    const hook = renderHook(() =>
      usePersistence({
        currentScene: GAME_PHASES.MENU as string,
        stateRef,
        dispatch: vi.fn(),
        addToast,
        tRef: tRef as never
      })
    )
    return { ...hook, addToast }
  }

  const toastMessages = (addToast: ReturnType<typeof vi.fn>): string[] =>
    addToast.mock.calls.map(call => String(call[0]))

  beforeEach(() => {
    vi.mocked(runSaveMigrations).mockReset()
    vi.mocked(runSaveMigrations).mockImplementation(() => {
      throw new Error('v1_to_v2 exploded')
    })
    resetStorageFallback()
    localStorage.clear()
    localStorage.setItem(SAVE_KEY, v1Save)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  it('says a copy was kept and keeps saving when the quarantine landed', () => {
    const { result, addToast } = renderPersistence()

    act(() => {
      expect(result.current.loadGame()).toEqual({
        ok: false,
        reason: 'corrupt'
      })
    })
    expect(toastMessages(addToast)).toContain('ui:save.migrationFailed')

    act(() => {
      expect(result.current.saveGame(false)).toBe(true)
    })
    expect(localStorage.getItem(SAVE_KEY)).not.toBe(v1Save)
    expect(localStorage.getItem(getQuarantineKey(1))).toContain(
      'v1_to_v2 exploded'
    )
  })

  it('warns that no copy was kept and refuses to save over the slot', () => {
    refuseQuarantineWrites()
    const { result, addToast } = renderPersistence()

    act(() => {
      result.current.loadGame()
    })
    const messages = toastMessages(addToast)
    expect(messages).toContain('ui:save.migrationFailedNotKept')
    expect(messages).not.toContain('ui:save.migrationFailed')

    act(() => {
      expect(result.current.saveGame(false)).toBe(false)
    })
    expect(localStorage.getItem(SAVE_KEY)).toBe(v1Save)
  })

  it('saves over the slot again once the block is released', () => {
    refuseQuarantineWrites()
    const { result } = renderPersistence()

    act(() => {
      result.current.loadGame()
    })
    act(() => {
      result.current.releaseUnprotectedSlot()
    })
    act(() => {
      expect(result.current.saveGame(false)).toBe(true)
    })
    expect(localStorage.getItem(SAVE_KEY)).not.toBe(v1Save)
  })

  it('releases the block when the player starts a new run', () => {
    // Refuses only the recovery copy, like a quota the larger escaped copy
    // exceeds while the smaller save still fits.
    class QuarantineRefusingAdapter extends InMemoryAdapter {
      override set(key: string, value: string): boolean {
        if (key.startsWith('neurotoxic:save:quarantine:')) return false
        return super.set(key, value)
      }
    }
    const adapter = new QuarantineRefusingAdapter()
    adapter.set(SAVE_KEY, v1Save)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider adapter={adapter}>
        <GameStateProvider>{children}</GameStateProvider>
      </StorageProvider>
    )
    const { result } = renderHook(() => useGameActions(), { wrapper })

    act(() => {
      result.current.loadGame()
    })
    act(() => {
      result.current.saveGame(false)
    })
    expect(adapter.get(SAVE_KEY)).toBe(v1Save)

    act(() => {
      result.current.resetState()
    })
    act(() => {
      result.current.saveGame(false)
    })
    expect(adapter.get(SAVE_KEY)).not.toBe(v1Save)
  })

  it('tells the player a save was refused, once per block and on every manual save', () => {
    refuseQuarantineWrites()
    const { result, addToast } = renderPersistence()
    const pausedNotices = () =>
      toastMessages(addToast).filter(m => m === 'ui:save.savePaused').length

    act(() => {
      result.current.loadGame()
    })
    expect(pausedNotices()).toBe(0)

    act(() => {
      result.current.saveGame(false)
      result.current.saveGame(false)
    })
    expect(pausedNotices()).toBe(1)

    act(() => {
      expect(result.current.saveGame()).toBe(false)
    })
    expect(pausedNotices()).toBe(2)
    expect(localStorage.getItem(SAVE_KEY)).toBe(v1Save)
  })

  describe('through the game actions', () => {
    // Refuses only the recovery copy, like a quota the larger escaped copy
    // exceeds while the smaller save still fits.
    class QuarantineRefusingAdapter extends InMemoryAdapter {
      override set(key: string, value: string): boolean {
        if (key.startsWith('neurotoxic:save:quarantine:')) return false
        return super.set(key, value)
      }
    }

    const renderActionsAfterBlockedLoad = () => {
      const adapter = new QuarantineRefusingAdapter()
      adapter.set(SAVE_KEY, v1Save)
      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider adapter={adapter}>
          <GameStateProvider>{children}</GameStateProvider>
        </StorageProvider>
      )
      const { result } = renderHook(() => useGameActions(), { wrapper })
      act(() => {
        result.current.loadGame()
      })
      return { result, adapter }
    }

    it('lifts the block when an Expedition run is committed', () => {
      const { result, adapter } = renderActionsAfterBlockedLoad()

      // TourPrep's commit releases the block before its save request.
      act(() => {
        result.current.releaseUnprotectedSlot()
      })
      act(() => {
        result.current.saveGame(false)
      })
      expect(adapter.get(SAVE_KEY)).not.toBe(v1Save)
    })

    it('keeps the block through another Continue/Load', () => {
      const { result, adapter } = renderActionsAfterBlockedLoad()

      act(() => {
        result.current.loadGame()
      })
      act(() => {
        expect(result.current.saveGame(false)).toBe(false)
      })
      expect(adapter.get(SAVE_KEY)).toBe(v1Save)
    })
  })
})
