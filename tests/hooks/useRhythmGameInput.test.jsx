// TODO: Implement this
import { renderHook, act } from '@testing-library/react'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'
import { useRhythmGameInput } from '../../src/hooks/rhythmGame/useRhythmGameInput.js'
import * as audioEngine from '../../src/utils/audioEngine.js'

vi.mock('../../src/utils/audioEngine.js', () => ({
  getTransportState: vi.fn()
}))

describe('useRhythmGameInput', () => {
  let gameStateRef
  let scoringActions
  let contextState

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    gameStateRef = {
      current: {
        lanes: [
          { active: false },
          { active: false },
          { active: false },
          { active: false }
        ],
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: false
      }
    }

    scoringActions = {
      handleHit: vi.fn()
    }

    contextState = {
      activeEvent: null
    }

    audioEngine.getTransportState.mockReturnValue('started')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers input correctly on key down (happy path)', () => {
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(1, true)
    })

    expect(gameStateRef.current.lanes[1].active).toBe(true)
    expect(scoringActions.handleHit).toHaveBeenCalledWith(1)
    expect(scoringActions.handleHit).toHaveBeenCalledTimes(1)
  })

  it('toggles lane active state on key up without scoring', () => {
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    // Set lane as active first
    gameStateRef.current.lanes[2].active = true

    act(() => {
      result.current.registerInput(2, false)
    })

    expect(gameStateRef.current.lanes[2].active).toBe(false)
    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('ignores input when activeEvent is set', () => {
    contextState.activeEvent = 'some_event'
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(0, true)
    })

    expect(gameStateRef.current.lanes[0].active).toBe(false)
    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('ignores input when song is transitioning', () => {
    gameStateRef.current.songTransitioning = true
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(0, true)
    })

    expect(gameStateRef.current.lanes[0].active).toBe(false)
    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('ignores input when game is over', () => {
    gameStateRef.current.isGameOver = true
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(0, true)
    })

    expect(gameStateRef.current.lanes[0].active).toBe(false)
    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('ignores input when results are submitted', () => {
    gameStateRef.current.hasSubmittedResults = true
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(0, true)
    })

    expect(gameStateRef.current.lanes[0].active).toBe(false)
    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('ignores input when transport is not running', () => {
    audioEngine.getTransportState.mockReturnValue('stopped')
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(0, true)
    })

    expect(gameStateRef.current.lanes[0].active).toBe(false)
    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('ignores invalid lane indexes', () => {
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    act(() => {
      result.current.registerInput(-1, true)
      result.current.registerInput(4, true)
    })

    expect(scoringActions.handleHit).not.toHaveBeenCalled()
  })

  it('debounces rapid inputs within 50ms', () => {
    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    // First input
    act(() => {
      result.current.registerInput(1, true)
    })
    expect(scoringActions.handleHit).toHaveBeenCalledTimes(1)

    // Second input immediately (should be ignored)
    act(() => {
      result.current.registerInput(1, true)
    })
    expect(scoringActions.handleHit).toHaveBeenCalledTimes(1)

    // Advance time by 49ms
    vi.advanceTimersByTime(49)

    // Third input at 49ms (should be ignored)
    act(() => {
      result.current.registerInput(1, true)
    })
    expect(scoringActions.handleHit).toHaveBeenCalledTimes(1)

    // Advance time to surpass 50ms limit
    vi.advanceTimersByTime(2)

    // Fourth input after 50ms (should succeed)
    act(() => {
      result.current.registerInput(1, true)
    })
    expect(scoringActions.handleHit).toHaveBeenCalledTimes(2)
  })
})
