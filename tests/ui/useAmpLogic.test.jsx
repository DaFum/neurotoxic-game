import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAmpLogic } from '../../src/hooks/minigames/useAmpLogic'
import { GAME_PHASES } from '../../src/context/gameConstants'

const mockCompleteAmpCalibration = vi.fn()
const mockChangeScene = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    completeAmpCalibration: mockCompleteAmpCalibration,
    changeScene: mockChangeScene
  })
}))

describe('useAmpLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-advances to GIG after game over fallback delay', () => {
    const { result } = renderHook(() => useAmpLogic())

    act(() => {
      result.current.finishMinigame()
    })

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.GIG)
  })

  it('cleans up fallback timer on unmount', () => {
    const { result, unmount } = renderHook(() => useAmpLogic())

    act(() => {
      result.current.finishMinigame()
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(mockChangeScene).not.toHaveBeenCalled()
  })

  it('allows overriding a hijack', async () => {
    vi.resetModules()
    // We mock crypto so we get a specific random number for the spawn threshold
    vi.doMock('../../src/utils/crypto', () => ({
      getSafeRandom: () => 0.0001
    }))

    try {
      const { useAmpLogic: useMockedAmpLogic } =
        await import('../../src/hooks/minigames/useAmpLogic')
      const { result } = renderHook(() => useMockedAmpLogic())

      expect(result.current.hijacksOverridden).toBe(0)
      expect(result.current.isHijackActive).toBe(false)

      act(() => {
        // 0.0001 < Math.min(1, 0.02 * (5000 / 100)) = 1.0 => guaranteed hijack trigger
        result.current.update(5000)
      })

      // Give state a moment to flush
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.isHijackActive).toBe(true)

      act(() => {
        result.current.overrideHijack()
      })

      expect(result.current.isHijackActive).toBe(false)
      expect(result.current.hijacksOverridden).toBe(1)

      // Idempotency: calling overrideHijack when no hijack is active is a no-op
      act(() => {
        result.current.overrideHijack()
      })

      expect(result.current.isHijackActive).toBe(false)
      expect(result.current.hijacksOverridden).toBe(1)
    } finally {
      vi.doUnmock('../../src/utils/crypto')
    }
  })
})
