import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVoidSermon } from '../../src/hooks/useVoidSermon'
import { VOID_SERMON_REQUIRED_ZEALOTRY } from '../../src/data/zealotryActionGates'

vi.mock('../../src/utils/audio/audioEngine', () => {
  const playSFX = vi.fn()
  return {
    audioManager: { playSFX },
    audioService: { playSFX }
  }
})

const mockGameState = {
  player: { day: 5, money: 2000 },
  band: { harmony: 80 },
  social: { zealotry: 50, lastVoidSermonDay: 0 },
  expedition: undefined,
  voidSermon: vi.fn()
}

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameActions: () => mockGameState,
  useGameSelector: selector => selector(mockGameState)
}))

describe('useVoidSermon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGameState.player = { day: 5, money: 2000 }
    mockGameState.band = { harmony: 80 }
    mockGameState.social = { zealotry: 50, lastVoidSermonDay: 0 }
    mockGameState.expedition = undefined
  })

  it('pins the sermon tuning values', () => {
    const { result } = renderHook(() => useVoidSermon())
    expect(result.current.VOID_SERMON_CONFIG).toEqual({
      COST: 750,
      FAME_GAIN: 400,
      ZEALOTRY_GAIN: 25,
      CONTROVERSY_GAIN: 40,
      HARMONY_COST: 25,
      REQUIRED_ZEALOTRY: VOID_SERMON_REQUIRED_ZEALOTRY
    })
    expect(VOID_SERMON_REQUIRED_ZEALOTRY).toBe(35)
  })

  it('can sermon when requirements are met', () => {
    const { result } = renderHook(() => useVoidSermon())
    expect(result.current.canSermon).toBe(true)
  })

  it('cannot sermon below the zealotry gate', () => {
    mockGameState.social.zealotry = VOID_SERMON_REQUIRED_ZEALOTRY - 1
    const { result } = renderHook(() => useVoidSermon())
    expect(result.current.canSermon).toBe(false)
  })

  it('cannot sermon when protected expedition cash leaves too little spendable', () => {
    mockGameState.player = { day: 5, money: 1000 }
    mockGameState.expedition = { status: 'active', protectedCareerCash: 500 }
    const { result } = renderHook(() => useVoidSermon())
    expect(result.current.canSermon).toBe(false)
  })

  it('can sermon when spendable expedition cash covers the cost', () => {
    mockGameState.player = { day: 5, money: 1000 }
    mockGameState.expedition = { status: 'active', protectedCareerCash: 200 }
    const { result } = renderHook(() => useVoidSermon())
    expect(result.current.canSermon).toBe(true)
  })
})
