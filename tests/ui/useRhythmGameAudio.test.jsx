import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

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

vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    stopMusic: mocks.stopMusic,
    ensureAudioContext: mocks.ensureAudioContext
  }
}))

vi.mock('../../src/utils/audioEngine', () => ({
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

vi.mock('../../src/utils/rhythmGameAudioUtils.js', () => ({
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

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setIsAudioReady },
        contextState: { ...baseState, band: { harmony: NaN } },
        contextActions: { addToast: vi.fn(), t: vi.fn() }
      })
    )

    // Should not throw, should warn, and non-finite harmony should be clamped to 1 (triggering low harmony guard)
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      'RhythmGame',
      'Band harmony too low to start gig.'
    )
    expect(setIsAudioReady).toHaveBeenCalledWith(false)
  })

  it('fails fast on low harmony and sets audio not ready', () => {
    const setIsAudioReady = vi.fn()

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setIsAudioReady },
        contextState: { ...baseState, band: { harmony: 0 } },
        contextActions: { addToast: vi.fn() }
      })
    )

    expect(mocks.stopMusic).toHaveBeenCalled()
    expect(setIsAudioReady).toHaveBeenCalledWith(false)
  })

  it('stops audio on unmount cleanup', () => {
    const setIsAudioReady = vi.fn()
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
        setters: { setIsAudioReady },
        contextState: baseState,
        contextActions: { addToast: vi.fn() }
      })
    )

    unmount()
    expect(mocks.stopAudio).toHaveBeenCalled()
  })
})
