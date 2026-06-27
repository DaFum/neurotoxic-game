import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { useKabelsalatGameEnd } from '../../src/scenes/kabelsalat/hooks/useKabelsalatGameEnd'
import { logger } from '../../src/utils/logger'
import * as errorHandler from '../../src/utils/errorHandler'

const mockCompleteKabelsalatMinigame = vi.fn()
const mockChangeScene = vi.fn()

const mockGameActions = {
  completeKabelsalatMinigame: mockCompleteKabelsalatMinigame,
  changeScene: mockChangeScene
}
const mockGameState = {
  currentScene: 'KABELSALAT',
  player: { day: 1, money: 0 },
  settings: { crtEnabled: false }
}

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({ ...mockGameState, ...mockGameActions }),
  useGameActions: () => mockGameActions,
  useGameSelector: selector => selector(mockGameState)
}))

vi.mock('../../src/utils/logger', () => ({
  logger: { error: vi.fn() }
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn(),
  StateError: class StateError extends Error {}
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

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: false,
      timeLeft: 0,
      voidSurgesPurged: 0
    })
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })

  it('routes to GIG and completes win payload when powered on triggers', () => {
    renderHook(() => useKabelsalatGameEnd(true, false, 12))

    vi.advanceTimersByTime(2500)

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: true,
      timeLeft: 12,
      voidSurgesPurged: 0
    })
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })

  it('uses the latest timeLeft value when the timeout fires', () => {
    const { rerender } = renderHook(
      ({ isPoweredOn, isGameOver, timeLeft }) =>
        useKabelsalatGameEnd(isPoweredOn, isGameOver, timeLeft),
      {
        initialProps: { isPoweredOn: true, isGameOver: false, timeLeft: 12 }
      }
    )

    rerender({ isPoweredOn: true, isGameOver: false, timeLeft: 8 })

    vi.advanceTimersByTime(2500)

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: true,
      timeLeft: 8,
      voidSurgesPurged: 0
    })
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })

  it('survives StrictMode effect replay and still transitions once', () => {
    renderHook(() => useKabelsalatGameEnd(true, false, 9), {
      wrapper: StrictMode
    })

    vi.advanceTimersByTime(2500)

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: true,
      timeLeft: 9,
      voidSurgesPurged: 0
    })
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })

  it('forceAdvance triggers immediate idempotent transition', () => {
    const { result } = renderHook(() => useKabelsalatGameEnd(false, false, 7))

    result.current.forceAdvance(true)
    result.current.forceAdvance(true)

    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockCompleteKabelsalatMinigame).toHaveBeenCalledWith({
      isPoweredOn: true,
      timeLeft: 7,
      voidSurgesPurged: 0
    })
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })

  it('logs an error when import error occurs during error handling', async () => {
    mockCompleteKabelsalatMinigame.mockImplementationOnce(() => {
      throw new Error('sync minigame error')
    })
    errorHandler.handleError.mockImplementationOnce(() => {
      throw new Error('handle error failure')
    })

    const { result } = renderHook(() => useKabelsalatGameEnd(false, false, 7))

    result.current.forceAdvance(true)

    await vi.runAllTimersAsync()

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      'Kabelsalat',
      'Failed to complete minigame (import error)',
      expect.any(Error)
    )
    expect(mockChangeScene).toHaveBeenCalledWith('GIG')
  })
})
