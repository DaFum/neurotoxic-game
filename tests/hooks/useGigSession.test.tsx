import { buildGigStatsSnapshot } from '../../src/utils/gigStats'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGigSession } from '../../src/hooks/useGigSession'
import {
  stopAudio,
  pauseAudio,
  resumeAudio
} from '../../src/utils/audio/audioEngine'
import { handleError } from '../../src/utils/errorHandler'
import type { TFunction } from 'i18next'
import type { RhythmGameRefState } from '../../src/types/rhythmGame'

vi.mock('../../src/utils/audio/audioEngine', () => ({
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(),
  stopAudio: vi.fn(),
  audioManager: {},
  audioService: {}
}))

vi.mock('../../src/utils/gigStats', () => ({
  buildGigStatsSnapshot: vi.fn().mockReturnValue({})
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))

describe('useGigSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('handles error during handleQuitGig when stopAudio fails', async () => {
    const mockAddToast = vi.fn()
    const mockSetLastGigStats = vi.fn()
    const mockEndGig = vi.fn()
    const mockTRef = {
      current: vi.fn(
        (key, options) => options.defaultValue
      ) as unknown as TFunction
    }
    const mockGameStateRef = {
      current: {
        score: 100,
        stats: {},
        toxicTimeTotal: 0,
        songStats: []
      } as unknown as RhythmGameRefState
    }

    const mockError = new Error('Audio stop failed')
    vi.mocked(stopAudio).mockImplementation(() => {
      throw mockError
    })

    const { result } = renderHook(() =>
      useGigSession({
        addToast: mockAddToast,
        setLastGigStats: mockSetLastGigStats,
        endGig: mockEndGig,
        tRef: mockTRef,
        gameStateRef: mockGameStateRef
      })
    )

    await act(async () => {
      await result.current.handleQuitGig()
    })

    expect(handleError).toHaveBeenCalledWith(
      mockError,
      expect.objectContaining({
        addToast: mockAddToast,
        fallbackMessage: 'Audio cleanup failed.'
      })
    )

    // It should still call setLastGigStats and endGig due to finally block
    expect(mockSetLastGigStats).toHaveBeenCalled()
    expect(mockEndGig).toHaveBeenCalled()
    expect(buildGigStatsSnapshot).toHaveBeenCalledWith(
      100,
      {
        perfectHits: 0,
        perfects: 0,
        hits: 0,
        misses: 0,
        earlyHits: 0,
        lateHits: 0,
        maxCombo: 0,
        peakHype: 0,
        corruptionLevel: 0
      },
      0,
      []
    )
    expect(mockGameStateRef.current.hasSubmittedResults).toBe(true)
  })

  it('handles handleQuitGig gracefully when gameStateRef.current is undefined', async () => {
    const mockAddToast = vi.fn()
    const mockSetLastGigStats = vi.fn()
    const mockEndGig = vi.fn()
    const mockTRef = {
      current: vi.fn(
        (key, options) => options.defaultValue
      ) as unknown as TFunction
    }
    const mockGameStateRef = {
      current: undefined as unknown as RhythmGameRefState
    }

    const { result } = renderHook(() =>
      useGigSession({
        addToast: mockAddToast,
        setLastGigStats: mockSetLastGigStats,
        endGig: mockEndGig,
        tRef: mockTRef,
        gameStateRef: mockGameStateRef
      })
    )

    await act(async () => {
      await result.current.handleQuitGig()
    })

    expect(stopAudio).toHaveBeenCalled()
    expect(mockSetLastGigStats).toHaveBeenCalled()
    expect(mockEndGig).toHaveBeenCalled()
    expect(buildGigStatsSnapshot).toHaveBeenCalledWith(
      0,
      {
        perfectHits: 0,
        perfects: 0,
        hits: 0,
        misses: 0,
        earlyHits: 0,
        lateHits: 0,
        maxCombo: 0,
        peakHype: 0,
        corruptionLevel: 0
      },
      0,
      []
    )
  })

  it('handles pause toggle correctly', () => {
    const mockAddToast = vi.fn()
    const mockSetLastGigStats = vi.fn()
    const mockEndGig = vi.fn()
    const mockTRef = {
      current: vi.fn(
        (key, options) => options.defaultValue
      ) as unknown as TFunction
    }
    const mockGameStateRef = { current: {} as unknown as RhythmGameRefState }

    const { result } = renderHook(() =>
      useGigSession({
        addToast: mockAddToast,
        setLastGigStats: mockSetLastGigStats,
        endGig: mockEndGig,
        tRef: mockTRef,
        gameStateRef: mockGameStateRef
      })
    )

    expect(result.current.isPaused).toBe(false)

    act(() => {
      result.current.handleTogglePause()
    })

    expect(result.current.isPaused).toBe(true)
  })

  it('handles pause effect (toggling pause on and off)', () => {
    const mockAddToast = vi.fn()
    const mockSetLastGigStats = vi.fn()
    const mockEndGig = vi.fn()
    const mockTRef = {
      current: vi.fn(
        (key, options) => options.defaultValue
      ) as unknown as TFunction
    }
    const mockGameStateRef = { current: {} as unknown as RhythmGameRefState }

    const { result } = renderHook(() =>
      useGigSession({
        addToast: mockAddToast,
        setLastGigStats: mockSetLastGigStats,
        endGig: mockEndGig,
        tRef: mockTRef,
        gameStateRef: mockGameStateRef
      })
    )

    // First render does not trigger pause/resume toast since it starts unpaused
    expect(mockAddToast).not.toHaveBeenCalled()

    // Toggle pause on
    act(() => {
      result.current.handleTogglePause()
    })

    expect(result.current.isPaused).toBe(true)
    // The effect should run and pause audio
    expect(pauseAudio).toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith('PAUSED', 'info')

    // Toggle pause off
    act(() => {
      result.current.handleTogglePause()
    })

    expect(result.current.isPaused).toBe(false)
    expect(resumeAudio).toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith('RESUMED', 'info')
  })
})
