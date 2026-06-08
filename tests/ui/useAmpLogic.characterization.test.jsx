import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockCompleteAmpCalibration = vi.fn()
const mockChangeScene = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    completeAmpCalibration: mockCompleteAmpCalibration,
    changeScene: mockChangeScene
  }),
  useGameActions: () => ({
    completeAmpCalibration: mockCompleteAmpCalibration,
    changeScene: mockChangeScene
  }),
  useGameSelector: selector => selector({})
}))

// High RNG suppresses the stochastic phases (anomaly/drift/hijack) so the
// update loop is deterministic; target init = 0.99 * 800 + 100 = 892.
vi.mock('../../src/utils/crypto', () => ({
  getSafeRandom: vi.fn(() => 0.99),
  secureRandom: vi.fn(() => 0.99),
  getSafeUUID: vi.fn(() => 'test-uuid')
}))

import { useAmpLogic } from '../../src/hooks/minigames/useAmpLogic'

describe('useAmpLogic (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('starts with the expected baseline state', () => {
    const { result } = renderHook(() => useAmpLogic())
    expect(result.current.timeLeft).toBe(15)
    expect(result.current.isGameOver).toBe(false)
    expect(result.current.isOverdriveActive).toBe(false)
    expect(result.current.hijacksOverridden).toBe(0)
    expect(typeof result.current.update).toBe('function')
  })

  it('update() decrements the timer by elapsed seconds', () => {
    const { result } = renderHook(() => useAmpLogic())
    act(() => result.current.update(1000))
    expect(result.current.timeLeft).toBeCloseTo(14)
    expect(Number.isFinite(result.current.score)).toBe(true)
  })

  it('update() past the remaining time ends the game and reports the result once', () => {
    const { result } = renderHook(() => useAmpLogic())
    act(() => result.current.update(20_000))
    expect(result.current.isGameOver).toBe(true)
    expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(1)
  })

  it('finishMinigame reports accumulated score, resonance, purges, and hijack overrides', () => {
    const { result } = renderHook(() => useAmpLogic())
    act(() => result.current.purgeInterference())
    act(() => result.current.finishMinigame())

    expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(1)
    const [score, voidResonance, purgesUsed, hijacksOverridden] =
      mockCompleteAmpCalibration.mock.calls[0]
    expect(Number.isFinite(score)).toBe(true)
    expect(voidResonance).toBe(0)
    expect(purgesUsed).toBe(1)
    expect(hijacksOverridden).toBe(0)
  })

  it('finishMinigame is idempotent', () => {
    const { result } = renderHook(() => useAmpLogic())
    act(() => result.current.finishMinigame())
    act(() => result.current.finishMinigame())
    expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(1)
  })

  it('purgeInterference resets accumulated interference to zero', () => {
    const { result } = renderHook(() => useAmpLogic())
    // Build interference over several seconds (+5/sec), then flush the 100ms sync.
    act(() => result.current.update(2000))
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.interference).toBeGreaterThan(0)

    act(() => result.current.purgeInterference())
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.interference).toBe(0)
  })

  it('exposes overdrive toggling through setIsOverdriveActive', () => {
    const { result } = renderHook(() => useAmpLogic())
    act(() => result.current.setIsOverdriveActive(true))
    expect(result.current.isOverdriveActive).toBe(true)
  })
})
