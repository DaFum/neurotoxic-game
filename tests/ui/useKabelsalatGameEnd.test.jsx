import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKabelsalatGameEnd } from '../../src/scenes/kabelsalat/hooks/useKabelsalatGameEnd'

const mockCompleteKabelsalatMinigame = vi.fn()
const mockChangeScene = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    completeKabelsalatMinigame: mockCompleteKabelsalatMinigame,
    changeScene: mockChangeScene
  })
}))

describe('useKabelsalatGameEnd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('routes to GIG and completes loss payload when game over triggers', () => {
    renderHook(() => useKabelsalatGameEnd(false, true, 0))

    vi.advanceTimersByTime(3500)

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: false,
      timeLeft: 0
    })
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })

  it('routes to GIG and completes win payload when powered on triggers', () => {
    renderHook(() => useKabelsalatGameEnd(true, false, 12))

    vi.advanceTimersByTime(2500)

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: true,
      timeLeft: 12
    })
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })
})
