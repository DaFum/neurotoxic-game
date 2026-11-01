import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  stopMusic: vi.fn(),
  ensureAudioContext: vi.fn(async () => true),
  stopAudio: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
  handleError: vi.fn(() => ({ severity: 'medium' })),
  setupGigPhysics: vi.fn(() => ({
    mergedModifiers: {},
    speed: 500,
    hitWindows: [100, 100, 100]
  })),
  resolveActiveSetlist: vi.fn(() => [{ id: 'song_1', name: 'Song 1' }]),
  playSongSequence: vi.fn(async () => {}),
  resetGigStateTracking: vi.fn(),
  musicVolume: 0.5,
  sfxVolume: 0.5,
  muted: false,
  isPlaying: false,
  currentSongId: null
}))

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioManager: {
    stopMusic: mocks.stopMusic,
    ensureAudioContext: mocks.ensureAudioContext
  },
  audioService: {
    get musicVolume() {
      return mocks.musicVolume
    },
    get sfxVolume() {
      return mocks.sfxVolume
    },
    get muted() {
      return mocks.muted
    },
    get isPlaying() {
      return mocks.isPlaying
    },
    get currentSongId() {
      return mocks.currentSongId
    },
    stopMusic: mocks.stopMusic,
    ensureAudioContext: mocks.ensureAudioContext
  },
  stopAudio: mocks.stopAudio,
  setupGigPhysics: mocks.setupGigPhysics,
  resolveActiveSetlist: mocks.resolveActiveSetlist,
  playSongSequence: mocks.playSongSequence,
  resetGigStateTracking: mocks.resetGigStateTracking
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: mocks.handleError,
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  AudioError: class AudioError extends Error {}
}))

vi.mock('../../src/utils/logger', () => ({
  logger: { warn: mocks.loggerWarn, error: mocks.loggerError, info: vi.fn() },
  isValidLogLevel: vi.fn(() => true),
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
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
    const setAudioStatus = vi.fn()
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
        setters: { setAudioStatus, setIsGameOver },
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
    expect(setAudioStatus).toHaveBeenCalledWith('ready')
    expect(setIsGameOver).toHaveBeenCalledWith(true)
  })

  it('finalizes the gig instead of showing the audio lock on low harmony and acts idempotently', async () => {
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()
    const setLastGigStats = vi.fn()
    const endGig = vi.fn()
    const addToast = vi.fn()

    const { result } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setAudioStatus, setIsGameOver },
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
    expect(setAudioStatus).toHaveBeenCalledWith('ready')
    expect(setIsGameOver).toHaveBeenCalledWith(true)
    expect(addToast).toHaveBeenCalledWith(
      'ui:gig.toasts.bandCollapsed',
      'error'
    )
    expect(addToast).toHaveBeenCalledTimes(1)
    expect(setLastGigStats).toHaveBeenCalledWith(
      expect.objectContaining({ score: 0 })
    )
    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)

    // retry shouldn't cause side effects to run again
    await result.current.retryAudioInitialization()

    expect(addToast).toHaveBeenCalledTimes(1)
    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('stops audio on unmount cleanup', () => {
    const setAudioStatus = vi.fn()
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
        setters: { setAudioStatus, setIsGameOver },
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

  it('reports initialization failures with a translated fallback message', async () => {
    mocks.playSongSequence.mockRejectedValueOnce(new Error('boom'))
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()
    const addToast = vi.fn()

    const { result } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: { setAudioStatus, setIsGameOver },
        contextState: baseState,
        contextActions: {
          addToast,
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )
    act(() => {
      result.current.onStageReady()
    })

    await waitFor(() => {
      expect(mocks.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          addToast,
          fallbackMessage: 'ui:gig.errors.initFailed'
        })
      )
    })
    // handleError owns the toast (it toasts the translated fallback, never the
    // raw Error message), so the hook must not toast a second time.
    expect(addToast).not.toHaveBeenCalled()
  })

  it('marks audio as failed and stops playback when initialization fails', async () => {
    mocks.playSongSequence.mockRejectedValueOnce(new Error('boom'))
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()
    const addToast = vi.fn()

    const { result } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: { setAudioStatus, setIsGameOver },
        contextState: baseState,
        contextActions: {
          addToast,
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )
    act(() => {
      result.current.onStageReady()
    })

    await waitFor(() => {
      expect(setAudioStatus).toHaveBeenCalledWith('failed')
    })
    expect(mocks.stopAudio).toHaveBeenCalled()
  })

  it('starts gig audio after requesting a fresh gig state reset', async () => {
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()
    const gameStateRef = {
      current: {
        lanes: [{}, {}, {}],
        hasSubmittedResults: true,
        isGameOver: true,
        notesVersion: 0
      }
    }

    const { result } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef,
        setters: { setAudioStatus, setIsGameOver },
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )
    act(() => {
      result.current.onStageReady()
    })

    await waitFor(() => {
      expect(mocks.resetGigStateTracking).toHaveBeenCalledWith(gameStateRef)
    })

    await waitFor(() => {
      expect(mocks.playSongSequence).toHaveBeenCalled()
    })
  })

  it.each([
    ['NaN', [100, 100, NaN]],
    ['infinity', [100, 100, Infinity]],
    ['a numeric string', [100, 100, '100']],
    ['null', [100, 100, null]],
    ['a sparse entry', Object.assign(new Array(3), { 0: 100, 2: 100 })],
    ['a short array', [100, 100]]
  ])(
    'rejects %s hit windows without partially updating lanes',
    async (_, hitWindows) => {
      mocks.setupGigPhysics.mockReturnValueOnce({
        mergedModifiers: {},
        speed: 500,
        hitWindows
      })
      const lanes = [{ hitWindow: 10 }, { hitWindow: 20 }, { hitWindow: 30 }]
      const setAudioStatus = vi.fn()

      renderHook(() =>
        useRhythmGameAudio({
          gameStateRef: { current: { lanes } },
          setters: { setAudioStatus, setIsGameOver: vi.fn() },
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
        expect(setAudioStatus).toHaveBeenCalledWith('failed')
      })
      expect(lanes.map(lane => lane.hitWindow)).toEqual([10, 20, 30])
      expect(mocks.playSongSequence).not.toHaveBeenCalled()
      expect(mocks.stopAudio).toHaveBeenCalled()
    }
  )

  it.each([
    ['a missing lane', [{ hitWindow: 10 }, { hitWindow: 20 }]],
    ['a null lane', [{ hitWindow: 10 }, { hitWindow: 20 }, null]],
    [
      'a sparse lane',
      Object.assign(new Array(3), {
        0: { hitWindow: 10 },
        2: { hitWindow: 30 }
      })
    ]
  ])('rejects %s without updating the remaining lanes', async (_, lanes) => {
    const initialLanes = structuredClone(lanes)
    const setAudioStatus = vi.fn()

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: { current: { lanes } },
        setters: { setAudioStatus, setIsGameOver: vi.fn() },
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
      expect(setAudioStatus).toHaveBeenCalledWith('failed')
    })
    expect(lanes).toEqual(initialLanes)
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
  })

  it('applies all validated hit windows before starting playback', async () => {
    mocks.setupGigPhysics.mockReturnValueOnce({
      mergedModifiers: {},
      speed: 500,
      hitWindows: [0, 120, 150]
    })
    const gameStateRef = { current: { lanes: [{}, {}, {}] } }
    mocks.playSongSequence.mockImplementationOnce(async () => {
      expect(gameStateRef.current.lanes.map(lane => lane.hitWindow)).toEqual([
        0, 120, 150
      ])
    })
    const setAudioStatus = vi.fn()

    const { result } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef,
        setters: { setAudioStatus, setIsGameOver: vi.fn() },
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )
    act(() => {
      result.current.onStageReady()
    })

    await waitFor(() => {
      expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
    })
    expect(setAudioStatus).toHaveBeenCalledWith('ready')
    expect(mocks.handleError).not.toHaveBeenCalled()
  })

  it('does not initialize or start playback if unmounted while audio unlock is pending', async () => {
    const audioUnlock = Promise.withResolvers()
    mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
    const setAudioStatus = vi.fn()
    const gameStateRef = { current: { lanes: [{}, {}, {}] } }

    const { unmount } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef,
        setters: { setAudioStatus, setIsGameOver: vi.fn() },
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
    await act(async () => {
      audioUnlock.resolve(true)
      await audioUnlock.promise
    })

    expect(mocks.resetGigStateTracking).not.toHaveBeenCalled()
    expect(mocks.setupGigPhysics).not.toHaveBeenCalled()
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
    expect(setAudioStatus).not.toHaveBeenCalled()
    expect(mocks.stopAudio).toHaveBeenCalled()
  })

  it('updates currentStatusRef to failed if physics setup fails and allows retry', async () => {
    // Mock setupGigPhysics to simulate a failure
    mocks.setupGigPhysics.mockReturnValueOnce(null)
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()

    const { result } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setAudioStatus, setIsGameOver },
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )

    // Wait for the initialization error path to complete
    await waitFor(() => {
      expect(setAudioStatus).toHaveBeenCalledWith('failed')
    })

    // Now currentStatusRef.current should be 'failed'.
    // Calling retryAudioInitialization should clear it and attempt to initialize again.

    // Clear mocks so we can check if it tries again
    mocks.setupGigPhysics.mockClear()
    mocks.setupGigPhysics.mockReturnValueOnce({
      mergedModifiers: {},
      speed: 500,
      hitWindows: [100, 100, 100]
    })

    const retry = result.current.retryAudioInitialization()
    act(() => {
      result.current.onStageReady()
    })
    await retry

    // It should have called setupGigPhysics again
    expect(mocks.setupGigPhysics).toHaveBeenCalled()
  })
})

describe('useRhythmGameAudio stage readiness gate', () => {
  const baseState = {
    band: { harmony: 50 },
    gameMap: { nodes: { n1: { layer: 0 } } },
    player: { currentNodeId: 'n1' },
    setlist: [{ id: 'song_1', name: 'Song 1', bpm: 120, duration: 60 }],
    gigModifiers: {},
    currentGig: { songId: 'song_1' }
  }
  // Mirrors the hook's unexported no-stage fallback (STAGE_READY_FALLBACK_MS).
  const STAGE_READY_FALLBACK_MS = 15_000

  const renderAudioHook = setAudioStatus =>
    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: { current: { lanes: [{}, {}, {}] } },
        setters: { setAudioStatus, setIsGameOver: vi.fn() },
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )

  const advance = async ms => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps gig audio unstarted while the stage is pending and starts the song clock once it is ready', async () => {
    let songStartedAt = null
    mocks.playSongSequence.mockImplementationOnce(async () => {
      songStartedAt = Date.now()
    })
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)

    // Audio unlocks at once, but the stage needs 10 s (asset loads hitting
    // their timeout) before its first frame.
    await advance(10_000)
    expect(mocks.ensureAudioContext).toHaveBeenCalled()
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
    expect(setAudioStatus).not.toHaveBeenCalledWith('ready')

    const readyAt = Date.now()
    await act(async () => {
      result.current.onStageReady()
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
    // The song clock (and its lead-in) starts when the stage can draw, so no
    // song time elapses unseen and the opening notes are still ahead of it.
    expect(songStartedAt).toBe(readyAt)
  })

  it('starts right after the audio unlock when the stage was ready first', async () => {
    const audioUnlock = Promise.withResolvers()
    mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
    const { result } = renderAudioHook(vi.fn())

    act(() => {
      result.current.onStageReady()
    })
    expect(mocks.playSongSequence).not.toHaveBeenCalled()

    await act(async () => {
      audioUnlock.resolve(true)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
  })

  it('falls back to starting without a stage after the bounded wait', async () => {
    renderAudioHook(vi.fn())

    await advance(STAGE_READY_FALLBACK_MS - 1)
    expect(mocks.playSongSequence).not.toHaveBeenCalled()

    await advance(1)
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      'RhythmGame',
      expect.stringContaining('stage')
    )
  })

  it('waits for the remounted stage again after a blocked-audio retry', async () => {
    mocks.ensureAudioContext.mockResolvedValueOnce(false)
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)

    act(() => {
      result.current.onStageReady()
    })
    await advance(0)
    expect(setAudioStatus).toHaveBeenLastCalledWith('blocked')

    // The blocked overlay replaced the stage; the retry must leave it and
    // wait for the new stage instead of trusting the old signal.
    let retry
    await act(async () => {
      retry = result.current.retryAudioInitialization()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('initializing')
    expect(mocks.playSongSequence).not.toHaveBeenCalled()

    await act(async () => {
      result.current.onStageReady()
      await retry
    })
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
  })

  it('never starts playback when unmounted while waiting for the stage', async () => {
    const { unmount } = renderAudioHook(vi.fn())
    await advance(0)

    unmount()
    await advance(STAGE_READY_FALLBACK_MS)

    expect(mocks.playSongSequence).not.toHaveBeenCalled()
    expect(mocks.stopAudio).toHaveBeenCalled()
  })
})
