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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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
          setters: {
            setAudioStatus,
            setIsGameOver: vi.fn(),
            setFailureKind: vi.fn()
          },
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
        setters: {
          setAudioStatus,
          setIsGameOver: vi.fn(),
          setFailureKind: vi.fn()
        },
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
        setters: {
          setAudioStatus,
          setIsGameOver: vi.fn(),
          setFailureKind: vi.fn()
        },
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
        setters: {
          setAudioStatus,
          setIsGameOver: vi.fn(),
          setFailureKind: vi.fn()
        },
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
        setters: { setAudioStatus, setIsGameOver, setFailureKind: vi.fn() },
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

  const renderAudioHook = (
    setAudioStatus,
    gameStateRef = { current: { lanes: [{}, {}, {}] } },
    setFailureKind = vi.fn()
  ) =>
    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef,
        setters: {
          setAudioStatus,
          setIsGameOver: vi.fn(),
          setFailureKind
        },
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

  it('routes a stage init failure to the failed state without starting playback', async () => {
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)
    await advance(0)
    expect(setAudioStatus).toHaveBeenLastCalledWith('initializing')

    await act(async () => {
      result.current.onStageInitError()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
    expect(setAudioStatus).not.toHaveBeenCalledWith('ready')
    expect(mocks.stopAudio).toHaveBeenCalled()

    // The no-stage fallback must not start the song later either.
    await advance(STAGE_READY_FALLBACK_MS)
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
  })

  it('fails without starting when the stage failed before the audio unlock', async () => {
    const audioUnlock = Promise.withResolvers()
    mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)

    act(() => {
      result.current.onStageInitError()
    })
    await act(async () => {
      audioUnlock.resolve(true)
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
  })

  it('waits for the remounted stage after a retry from a stage failure', async () => {
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)
    await advance(0)
    await act(async () => {
      result.current.onStageInitError()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')

    // 'initializing' lifts the failed overlay so a fresh stage mounts; the
    // retry waits for that stage instead of the old failure.
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
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
  })

  it('stops the song and fails when the stage fails after the fallback started it', async () => {
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)
    await advance(STAGE_READY_FALLBACK_MS)
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
    mocks.stopAudio.mockClear()

    // The hung stage init finally rejects while the song is already playing.
    act(() => {
      result.current.onStageInitError()
    })

    expect(mocks.stopAudio).toHaveBeenCalledTimes(1)
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
  })

  it('restarts the song once on a retry after a late stage failure', async () => {
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)
    await advance(STAGE_READY_FALLBACK_MS)
    act(() => {
      result.current.onStageInitError()
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')

    let retry
    await act(async () => {
      retry = result.current.retryAudioInitialization()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('initializing')
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.onStageReady()
      await retry
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(2)
  })

  it('does not fail a normally finalized gig on a late stage failure', async () => {
    const setAudioStatus = vi.fn()
    const gameStateRef = {
      current: {
        lanes: [{}, {}, {}],
        isGameOver: false,
        hasSubmittedResults: false
      }
    }
    const { result } = renderAudioHook(setAudioStatus, gameStateRef)
    await advance(STAGE_READY_FALLBACK_MS)
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
    mocks.stopAudio.mockClear()

    // finalizeGig() submits the results before endGig(); isGameOver stays
    // false until unmount, so the completion transition is in flight.
    gameStateRef.current.hasSubmittedResults = true
    act(() => {
      result.current.onStageInitError()
    })

    expect(setAudioStatus).not.toHaveBeenCalledWith('failed')
    expect(mocks.stopAudio).not.toHaveBeenCalled()
  })

  it('shows the failure at once when the stage fails while the audio unlock is pending', async () => {
    const audioUnlock = Promise.withResolvers()
    mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)
    await advance(0)

    act(() => {
      result.current.onStageInitError()
    })
    // The unlock may never settle; the Retry/Quit overlay must not wait on it.
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')

    await act(async () => {
      audioUnlock.resolve(true)
      await vi.advanceTimersByTimeAsync(STAGE_READY_FALLBACK_MS)
    })
    // The in-flight initialization keeps 'failed' and never starts the song.
    expect(setAudioStatus.mock.calls.flat()).toEqual(
      setAudioStatus.mock.calls.map(() => 'failed')
    )
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
  })

  it('keeps a stage failure when the pending audio unlock then reports blocked', async () => {
    const audioUnlock = Promise.withResolvers()
    mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)

    act(() => {
      result.current.onStageInitError()
    })
    await act(async () => {
      audioUnlock.resolve(false)
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
    expect(setAudioStatus).not.toHaveBeenCalledWith('blocked')
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
  })

  it.each(['isGameOver', 'hasSubmittedResults'])(
    'does not fail an initializing gig that has already ended (%s)',
    async endedFlag => {
      const audioUnlock = Promise.withResolvers()
      mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
      const setAudioStatus = vi.fn()
      const gameStateRef = {
        current: {
          lanes: [{}, {}, {}],
          isGameOver: false,
          hasSubmittedResults: false
        }
      }
      const { result } = renderAudioHook(setAudioStatus, gameStateRef)
      await advance(0)

      gameStateRef.current[endedFlag] = true
      act(() => {
        result.current.onStageInitError()
      })

      expect(setAudioStatus).not.toHaveBeenCalledWith('failed')
    }
  )

  it('recovers on a retry after an immediate stage failure despite the stale unlock', async () => {
    const staleUnlock = Promise.withResolvers()
    mocks.ensureAudioContext.mockReturnValueOnce(staleUnlock.promise)
    const setAudioStatus = vi.fn()
    const { result } = renderAudioHook(setAudioStatus)
    await advance(0)
    act(() => {
      result.current.onStageInitError()
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')

    let retry
    await act(async () => {
      retry = result.current.retryAudioInitialization()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('initializing')

    // The first attempt's unlock settles late; it must not touch the retry.
    await act(async () => {
      staleUnlock.resolve(false)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('initializing')
    expect(setAudioStatus).not.toHaveBeenCalledWith('blocked')

    await act(async () => {
      result.current.onStageReady()
      await retry
    })
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
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

  describe('failure kind', () => {
    it('reports a stage failure, clears it on retry and reports a following setup failure as audio', async () => {
      const setAudioStatus = vi.fn()
      const setFailureKind = vi.fn()
      const { result } = renderAudioHook(
        setAudioStatus,
        undefined,
        setFailureKind
      )
      await advance(0)
      await act(async () => {
        result.current.onStageInitError()
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
      expect(setFailureKind).toHaveBeenLastCalledWith('stage')
      setFailureKind.mockClear()

      mocks.setupGigPhysics.mockReturnValueOnce(null)
      await act(async () => {
        await result.current.retryAudioInitialization()
      })

      expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
      expect(setFailureKind.mock.calls.map(([kind]) => kind)).toEqual([
        null,
        'audio'
      ])
    })

    it('reports a stage failure that lands before the audio unlock', async () => {
      const audioUnlock = Promise.withResolvers()
      mocks.ensureAudioContext.mockReturnValueOnce(audioUnlock.promise)
      const setFailureKind = vi.fn()
      const { result } = renderAudioHook(vi.fn(), undefined, setFailureKind)

      act(() => {
        result.current.onStageInitError()
      })
      await act(async () => {
        audioUnlock.resolve(true)
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(setFailureKind).toHaveBeenLastCalledWith('stage')
      expect(setFailureKind).not.toHaveBeenCalledWith('audio')
    })

    it('clears the kind when the song starts and reports a late stage failure', async () => {
      const setFailureKind = vi.fn()
      const { result } = renderAudioHook(vi.fn(), undefined, setFailureKind)
      await advance(STAGE_READY_FALLBACK_MS)
      expect(setFailureKind).toHaveBeenLastCalledWith(null)

      act(() => {
        result.current.onStageInitError()
      })

      expect(setFailureKind).toHaveBeenLastCalledWith('stage')
    })

    it('reports a playback start failure as audio', async () => {
      mocks.playSongSequence.mockRejectedValueOnce(new Error('boom'))
      const setAudioStatus = vi.fn()
      const setFailureKind = vi.fn()
      const { result } = renderAudioHook(
        setAudioStatus,
        undefined,
        setFailureKind
      )
      await act(async () => {
        result.current.onStageReady()
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
      expect(setFailureKind).toHaveBeenLastCalledWith('audio')
    })
  })
})
