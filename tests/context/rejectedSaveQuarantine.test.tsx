import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { LoadGameResult } from '../../src/types'

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
const { resetStorageFallback } = await import('../../src/utils/storage')
const { getQuarantineKey } = await import('../../src/utils/saveQuarantine')

const TRUNCATED = '{"version":2,"player":{"money":'
// Parses, carries the current version, but fails shape validation.
const INVALID_FIELD = JSON.stringify({
  version: CURRENT_SAVE_VERSION,
  player: { money: 100 },
  band: { members: [{ relationships: { matze: 101 } }] },
  social: {},
  gameMap: null
})
const NOT_AN_OBJECT = '[1,2,3]'

const renderPersistence = () => {
  const dispatch = vi.fn()
  const addToast = vi.fn()
  const stateRef = { current: createInitialState({ unlocks: [] }) }
  const tRef = { current: vi.fn((key: string) => key) }
  const hook = renderHook(() =>
    usePersistence({
      currentScene: GAME_PHASES.MENU as string,
      stateRef,
      dispatch,
      addToast,
      tRef: tRef as never
    })
  )
  return { ...hook, dispatch }
}

const readQuarantine = (version: number) => {
  const stored = localStorage.getItem(getQuarantineKey(version))
  return stored === null
    ? null
    : (JSON.parse(stored) as { version: number; reason: string; raw: string })
}

describe('rejected save quarantine', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it.each([
    ['truncated JSON', TRUNCATED, 0, 'Save JSON parsing failed'],
    ['non-object root', NOT_AN_OBJECT, 0, 'Stored save is not an object'],
    [
      'failed validation',
      INVALID_FIELD,
      CURRENT_SAVE_VERSION,
      'Save validation failed'
    ]
  ])('copies a %s save aside on a real load', (_name, raw, version, prefix) => {
    localStorage.setItem(SAVE_KEY, raw)
    const { result } = renderPersistence()

    let loaded: LoadGameResult | undefined
    act(() => {
      loaded = result.current.loadGame()
    })

    expect(loaded).toEqual({ ok: false, reason: 'corrupt' })
    const quarantined = readQuarantine(version)
    expect(quarantined?.raw).toBe(raw)
    expect(quarantined?.reason.startsWith(prefix)).toBe(true)
  })

  it.each([
    ['truncated JSON', TRUNCATED, 0],
    ['non-object root', NOT_AN_OBJECT, 0],
    ['failed validation', INVALID_FIELD, CURRENT_SAVE_VERSION]
  ])('writes nothing when previewing a %s save', (_name, raw, version) => {
    localStorage.setItem(SAVE_KEY, raw)
    const { result } = renderPersistence()

    act(() => {
      result.current.previewLoadGame()
    })

    expect(readQuarantine(version)).toBeNull()
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
  })

  it('keeps the rejected payload after the next autosave overwrites the slot', () => {
    localStorage.setItem(SAVE_KEY, INVALID_FIELD)
    const { result } = renderPersistence()

    act(() => {
      result.current.loadGame()
    })
    act(() => {
      expect(result.current.saveGame(true)).toBe(true)
    })

    expect(localStorage.getItem(SAVE_KEY)).not.toBe(INVALID_FIELD)
    expect(readQuarantine(CURRENT_SAVE_VERSION)?.raw).toBe(INVALID_FIELD)
  })
})
