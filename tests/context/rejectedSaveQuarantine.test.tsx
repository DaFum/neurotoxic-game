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
const { getQuarantineKey, listQuarantineCopies } =
  await import('../../src/utils/saveQuarantine')

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
  return { ...hook, dispatch, addToast }
}

/** Newest copy of a refused save's quarantine family. */
const readQuarantine = (version: number | null) => {
  const newest = listQuarantineCopies(getQuarantineKey(version, 'rejected'))[0]
  const stored = newest ? localStorage.getItem(newest.key) : null
  return stored === null
    ? null
    : (JSON.parse(stored) as {
        version: number | null
        reason: string
        raw: string
      })
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
    ['truncated JSON', TRUNCATED, null, 'Save JSON parsing failed'],
    ['non-object root', NOT_AN_OBJECT, null, 'Stored save is not an object'],
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
    ['truncated JSON', TRUNCATED],
    ['non-object root', NOT_AN_OBJECT]
  ])(
    'files an unreadable %s save apart from an earlier v0 migration copy',
    (_name, raw) => {
      const v0Copy = JSON.stringify({
        version: 0,
        reason: 'v0 migration failed',
        raw: '{"player":{"money":5000}}'
      })
      const v0Key = `${getQuarantineKey(0)}:1-1`
      localStorage.setItem(v0Key, v0Copy)
      localStorage.setItem(SAVE_KEY, raw)
      const { result } = renderPersistence()

      act(() => {
        result.current.loadGame()
      })

      expect(localStorage.getItem(v0Key)).toBe(v0Copy)
      expect(getQuarantineKey(null, 'rejected')).toBe(
        'neurotoxic:save:quarantine:rejected:vunknown'
      )
      expect(readQuarantine(null)).toMatchObject({ version: null, raw })
    }
  )

  it.each([
    ['truncated JSON', TRUNCATED, null],
    ['non-object root', NOT_AN_OBJECT, null],
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

  it.each([
    ['truncated JSON', TRUNCATED],
    ['failed validation', INVALID_FIELD]
  ])(
    'pauses saving over a %s save whose recovery copy storage refused',
    (_name, raw) => {
      localStorage.setItem(SAVE_KEY, raw)
      const setItem = window.localStorage.setItem.bind(window.localStorage)
      const spy = vi
        .spyOn(window.localStorage, 'setItem')
        .mockImplementation((key: string, value: string) => {
          if (key.startsWith('neurotoxic:save:quarantine:')) {
            throw new DOMException('QuotaExceededError')
          }
          setItem(key, value)
        })
      try {
        const { result, addToast } = renderPersistence()

        act(() => {
          result.current.loadGame()
        })
        act(() => {
          expect(result.current.saveGame(false)).toBe(false)
        })

        expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
        expect(addToast.mock.calls.map(call => String(call[0]))).toContain(
          'ui:save.savePaused'
        )
      } finally {
        spy.mockRestore()
      }
    }
  )

  it('keeps both copies when two unparseable saves fail in a row', () => {
    const { result } = renderPersistence()
    const second = '{"version":2,"band":'

    localStorage.setItem(SAVE_KEY, TRUNCATED)
    act(() => {
      result.current.loadGame()
    })
    localStorage.setItem(SAVE_KEY, second)
    act(() => {
      result.current.loadGame()
    })

    const copies = listQuarantineCopies(getQuarantineKey(null, 'rejected')).map(
      copy => JSON.parse(localStorage.getItem(copy.key) ?? '{}').raw
    )
    expect(copies).toEqual([second, TRUNCATED])
  })
})
