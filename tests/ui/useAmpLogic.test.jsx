import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAmpLogic } from '../../src/hooks/minigames/useAmpLogic'

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
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
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
})
