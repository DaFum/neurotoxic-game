import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  stopMusic: vi.fn(),
  ensureAudioContext: vi.fn(async () => true),
  stopAudio: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
  handleError: vi.fn(),
  setupGigPhysics: vi.fn(() => ({
    mergedModifiers: {},
    speed: 500,
    hitWindows: [100, 100, 100]
  })),
  resolveActiveSetlist: vi.fn(() => [{ id: 'song_1', name: 'Song 1' }]),
  playSongSequence: vi.fn(async () => {}),
  resetGigStateTracking: vi.fn()
}))

vi.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: {
    stopMusic: mocks.stopMusic,
    ensureAudioContext: mocks.ensureAudioContext
  }
}))

vi.mock('../../src/utils/audio/audioEngine', () => ({
  stopAudio: mocks.stopAudio
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: mocks.handleError,
  AudioError: class AudioError extends Error {}
}))

vi.mock('../../src/utils/logger', () => ({
  logger: { warn: mocks.loggerWarn, error: mocks.loggerError, info: vi.fn() },
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
}))

vi.mock('../../src/utils/audio/rhythmGameAudioUtils', () => ({
  setupGigPhysics: mocks.setupGigPhysics,
  resolveActiveSetlist: mocks.resolveActiveSetlist,
  playSongSequence: mocks.playSongSequence,
  resetGigStateTracking: mocks.resetGigStateTracking
}))

import { useRhythmGameAudio } from '../../src/hooks/rhythmGame/useRhythmGameAudio'

describe('useRhythmGameAudio', () => {
  const baseState = {
    band: { harmony: 50 },
    gameMap: { nodes: { n1: { layer: 0 } } },
    player: { currentNodeId: 'n1' },
    setlist: [{ id: 'song_1', name: 'Song 1', bpm: 120, duration: 60 }],
    gigModifiers: {},
    currentGig: { songId: 'song_1' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles non-finite harmony gracefully', () => {
    const setIsAudioReady = vi.fn()
    const setIsGameOver = vi.fn()

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setIsAudioReady, setIsGameOver },
        contextState: { ...baseState, band: { harmony: NaN } },
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )

    // Should not throw, should warn, and non-finite harmony should be clamped to 1 (triggering low harmony guard)
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      'RhythmGame',
      'Band harmony too low to start gig.'
    )
    expect(setIsAudioReady).toHaveBeenCalledWith(true)
    expect(setIsGameOver).toHaveBeenCalledWith(true)
  })

  it('finalizes the gig instead of showing the audio lock on low harmony', () => {
    const setIsAudioReady = vi.fn()
    const setIsGameOver = vi.fn()
    const setLastGigStats = vi.fn()
    const endGig = vi.fn()
    const addToast = vi.fn()

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setIsAudioReady, setIsGameOver },
        contextState: { ...baseState, band: { harmony: 0 } },
        contextActions: {
          addToast,
          t: vi.fn(key => key),
          setLastGigStats,
          endGig
        }
      })
    )

    expect(mocks.stopMusic).toHaveBeenCalled()
    expect(setIsAudioReady).toHaveBeenCalledWith(true)
    expect(setIsGameOver).toHaveBeenCalledWith(true)
    expect(addToast).toHaveBeenCalledWith(
      'ui:gig.toasts.bandCollapsed',
      'error'
    )
    expect(setLastGigStats).toHaveBeenCalledWith(
      expect.objectContaining({ score: 0 })
    )
    expect(endGig).toHaveBeenCalled()
  })

  it('stops audio on unmount cleanup', () => {
    const setIsAudioReady = vi.fn()
    const setIsGameOver = vi.fn()
    const { unmount } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: { setIsAudioReady, setIsGameOver },
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )

    unmount()
    expect(mocks.stopAudio).toHaveBeenCalled()
  })

  it('starts gig audio after requesting a fresh gig state reset', async () => {
    const setIsAudioReady = vi.fn()
    const setIsGameOver = vi.fn()
    const gameStateRef = {
      current: {
        lanes: [{}, {}, {}],
        hasSubmittedResults: true,
        isGameOver: true,
        notesVersion: 0
      }
    }

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef,
        setters: { setIsAudioReady, setIsGameOver },
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )

    await waitFor(() => {
      expect(mocks.resetGigStateTracking).toHaveBeenCalledWith(gameStateRef)
    })

    await waitFor(() => {
      expect(mocks.playSongSequence).toHaveBeenCalled()
    })
  })
})
