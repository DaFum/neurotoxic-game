import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/context/reducers/migrations', () => ({
  CURRENT_SAVE_VERSION: 2,
  SAVE_MIGRATIONS: [],
  runSaveMigrations: vi.fn()
}))

vi.mock('../../src/utils/logger', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/utils/logger')>()
  return {
    ...actual,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  }
})

const { migrateLoadedSave } = await import('../../src/context/usePersistence')
const { runSaveMigrations } =
  await import('../../src/context/reducers/migrations')
const { getQuarantineKey, quarantineSave } =
  await import('../../src/utils/saveQuarantine')

describe('migrateLoadedSave', () => {
  const rawSave = '{"version":1,"player":{"money":100}}'
  const parsed = { version: 1, player: { money: 100 } }

  beforeEach(() => {
    vi.mocked(runSaveMigrations).mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('stamps the current version on a successfully migrated payload', () => {
    vi.mocked(runSaveMigrations).mockReturnValue({
      ...parsed,
      player: { money: 250 }
    })

    expect(migrateLoadedSave(parsed, rawSave)).toEqual({
      version: 2,
      player: { money: 250 }
    })
    expect(localStorage.getItem(getQuarantineKey(1))).toBeNull()
  })

  it('skips the chain for a payload already at the current version', () => {
    const current = { version: 2, player: { money: 100 } }

    expect(migrateLoadedSave(current, rawSave)).toBe(current)
    expect(runSaveMigrations).not.toHaveBeenCalled()
  })

  it('quarantines the raw payload before giving up on a throwing migration', () => {
    vi.mocked(runSaveMigrations).mockImplementation(() => {
      throw new Error('v1_to_v2 exploded')
    })

    expect(migrateLoadedSave(parsed, rawSave)).toBeNull()

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

    expect(migrateLoadedSave(parsed, rawSave)).toBeNull()
    expect(localStorage.getItem(getQuarantineKey(1))).not.toBeNull()
  })

  it('treats a missing or unusable version marker as version 0', () => {
    vi.mocked(runSaveMigrations).mockImplementation(() => {
      throw new Error('boom')
    })

    expect(migrateLoadedSave({ player: {} }, rawSave)).toBeNull()
    expect(localStorage.getItem(getQuarantineKey(0))).not.toBeNull()
  })
})

describe('quarantineSave', () => {
  beforeEach(() => {
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
