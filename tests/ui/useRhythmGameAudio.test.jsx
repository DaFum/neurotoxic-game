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
  invalidateSongSequence: vi.fn(),
  resetGameplayState: vi.fn(),
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
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(async () => true),
  stopAudio: mocks.stopAudio,
  setupGigPhysics: mocks.setupGigPhysics,
  resolveActiveSetlist: mocks.resolveActiveSetlist,
  playSongSequence: mocks.playSongSequence,
  resetGigStateTracking: mocks.resetGigStateTracking,
  invalidateSongSequence: mocks.invalidateSongSequence
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
  logger: {
    warn: mocks.loggerWarn,
    error: mocks.loggerError,
    info: vi.fn(),
    debug: vi.fn()
  },
  isValidLogLevel: vi.fn(() => true),
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
}))

import { useGigSession } from '../../src/hooks/useGigSession'
import { useRhythmGameState } from '../../src/hooks/rhythmGame/useRhythmGameState'
import { processRhythmGameTick } from '../../src/utils/rhythmGameLoopUtils'
import { createHecklerSession } from '../../src/utils/hecklerLogic'
import { handleKeyDownLogic } from '../../src/utils/gigInputUtils'
import { useRhythmGameAudio } from '../../src/hooks/rhythmGame/useRhythmGameAudio'

const createMockSetters = (overrides = {}) => {
  const setAudioStatus = overrides.setAudioStatus ?? vi.fn()
  const setFailureKind = overrides.setFailureKind ?? vi.fn()
  const setInitStatus =
    overrides.setInitStatus ??
    vi.fn(status => {
      setAudioStatus(status.status)
      setFailureKind(status.status === 'failed' ? status.failureKind : null)
    })
  return {
    setIsGameOver: vi.fn(),
    ...overrides,
    setAudioStatus,
    setFailureKind,
    setInitStatus
  }
}

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

  it('keeps Escape pause coherent across blocked-audio retry and prevents overdue misses', async () => {
    mocks.ensureAudioContext.mockResolvedValueOnce(false)
    const actions = {
      addToast: vi.fn(),
      setLastGigStats: vi.fn(),
      endGig: vi.fn(),
      t: key => key
    }
    const tRef = { current: actions.t }
    const { result } = renderHook(() => {
      const rhythm = useRhythmGameState()
      const session = useGigSession({
        ...actions,
        tRef,
        gameStateRef: rhythm.gameStateRef
      })
      const audio = useRhythmGameAudio({
        ...rhythm,
        contextState: baseState,
        contextActions: actions
      })
      return { rhythm, session, audio }
    })
    await waitFor(() =>
      expect(result.current.rhythm.state.audioStatus).toBe('blocked')
    )
    act(() =>
      handleKeyDownLogic({
        e: new KeyboardEvent('keydown', { key: 'Escape' }),
        getLaneIndex: () => undefined,
        actions: { registerInput: vi.fn() },
        triggerBandAnimation: vi.fn(),
        onTogglePause: result.current.session.handleTogglePause,
        ensureAudioFromGesture: vi.fn()
      })
    )
    expect(result.current.session.isPaused).toBe(true)
    let retry
    await act(async () => {
      retry = result.current.audio.retryAudioInitialization()
      await Promise.resolve()
    })
    await act(async () => {
      result.current.audio.onStageReady()
      await retry
    })
    const state = result.current.rhythm.gameStateRef.current
    state.notes = [{ time: 100, laneIndex: 0, visible: true, hit: false }]
    state.totalDuration = 5000
    state.rng = () => 1
    const handleMiss = vi.fn()
    processRhythmGameTick({
      stateRef: state,
      isTransportRunning: true,
      transportState: 'started',
      activeEvent: null,
      dimensionsRef: { current: { width: 800, height: 600 } },
      hecklerSessionRef: { current: createHecklerSession() },
      deltaMS: 16,
      handleCollision: vi.fn(),
      setIsToxicMode: vi.fn(),
      setIsCorruptionBurstActive: vi.fn(),
      handleMiss,
      finalizeGigCallback: vi.fn(),
      getGigTimeMs: () => 1000,
      pauseAudio: vi.fn(),
      resumeAudio: vi.fn(),
      setCorruptionState: vi.fn(),
      disableCorruptionBurstAudio: vi.fn()
    })
    expect(handleMiss).not.toHaveBeenCalled()
    expect(state.notes[0].visible).toBe(true)
    expect(state.userPaused).toBe(true)
    expect(result.current.session.isPaused).toBe(true)
    act(() => result.current.session.handleTogglePause())
    await waitFor(() => expect(result.current.session.isPaused).toBe(false))
    expect(state.userPaused).toBe(false)
  })

  it('handles non-finite harmony gracefully', () => {
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()

    renderHook(() =>
      useRhythmGameAudio({
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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

    // A collapsed band already submitted the gig; Retry cannot submit it again.
    await result.current.retryAudioInitialization()

    expect(addToast).toHaveBeenCalledTimes(1)
    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('claims the gig result on low harmony so a Quit before the scene change cannot submit again (#3591)', async () => {
    const actions = {
      addToast: vi.fn(),
      setLastGigStats: vi.fn(),
      endGig: vi.fn(),
      t: key => key
    }
    const { result } = renderHook(() => {
      const rhythm = useRhythmGameState()
      const session = useGigSession({
        ...actions,
        tRef: { current: actions.t },
        gameStateRef: rhythm.gameStateRef
      })
      useRhythmGameAudio({
        ...rhythm,
        contextState: { ...baseState, band: { harmony: 0 } },
        contextActions: actions
      })
      return { rhythm, session }
    })

    expect(actions.setLastGigStats).toHaveBeenCalledTimes(1)
    expect(actions.endGig).toHaveBeenCalledTimes(1)

    // endGig only schedules the scene change; Quit stays reachable until it commits.
    await act(async () => {
      await result.current.session.handleQuitGig()
    })

    expect(actions.setLastGigStats).toHaveBeenCalledTimes(1)
    expect(actions.setLastGigStats.mock.calls[0][0]).toMatchObject({
      score: 0
    })
    expect(actions.endGig).toHaveBeenCalledTimes(1)
    expect(mocks.stopAudio).not.toHaveBeenCalled()
  })

  it('preserves gig event markers when retry resets gameplay', async () => {
    mocks.ensureAudioContext
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
    const setAudioStatus = vi.fn()
    const game = {
      lanes: [{}, {}, {}],
      hasSubmittedResults: false,
      isGameOver: false,
      gigIntroFired: true,
      gigMidFired: true,
      lastGigEventSongIndex: 2
    }
    const reset = vi.fn(() =>
      Object.assign(game, {
        gigIntroFired: false,
        gigMidFired: false,
        lastGigEventSongIndex: -1
      })
    )
    const { result } = renderHook(() =>
      useRhythmGameAudio({
        resetGameplayState: reset,
        gameStateRef: { current: game },
        setters: createMockSetters({ setAudioStatus }),
        contextState: baseState,
        contextActions: {
          addToast: vi.fn(),
          t: vi.fn(key => key),
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )
    await waitFor(() =>
      expect(setAudioStatus).toHaveBeenLastCalledWith('blocked')
    )
    await act(async () => {
      await result.current.retryAudioInitialization()
    })
    expect(reset).toHaveBeenCalledOnce()
    expect(game).toMatchObject({
      gigIntroFired: true,
      gigMidFired: true,
      lastGigEventSongIndex: 2
    })
  })

  it('stops audio on unmount cleanup', () => {
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()
    const { unmount } = renderHook(() =>
      useRhythmGameAudio({
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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
        resetGameplayState: mocks.resetGameplayState,
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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
          resetGameplayState: mocks.resetGameplayState,
          gameStateRef: { current: { lanes } },
          setters: createMockSetters({ setAudioStatus }),
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
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: { current: { lanes } },
        setters: createMockSetters({ setAudioStatus }),
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
        resetGameplayState: mocks.resetGameplayState,
        setters: createMockSetters({ setAudioStatus }),
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
        resetGameplayState: mocks.resetGameplayState,
        setters: createMockSetters({ setAudioStatus }),
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
        resetGameplayState: mocks.resetGameplayState,
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: createMockSetters({ setAudioStatus, setIsGameOver }),
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

describe('useRhythmGameAudio retry lifetime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    mocks.ensureAudioContext.mockResolvedValue(true)
  })

  afterEach(() => vi.useRealTimers())

  const advance = async ms => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  const renderRetryHook = () => {
    const gameStateRef = {
      current: {
        lanes: [{}, {}, {}],
        hasSubmittedResults: false,
        isGameOver: false
      }
    }
    // A real reset clears terminal flags; a no-op would conceal this regression.
    const resetGameplayState = vi.fn(() =>
      Object.assign(gameStateRef.current, {
        hasSubmittedResults: false,
        isGameOver: false
      })
    )
    const setAudioStatus = vi.fn()
    const setIsGameOver = vi.fn()
    const setFailureKind = vi.fn()
    const addToast = vi.fn()
    const rendered = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef,
        resetGameplayState,
        setters: createMockSetters({
          setAudioStatus,
          setIsGameOver,
          setFailureKind
        }),
        contextState: {
          band: { harmony: 50 },
          gameMap: { nodes: { n1: { layer: 0 } } },
          player: { currentNodeId: 'n1' },
          setlist: [{ id: 'song_1', name: 'Song 1', bpm: 120, duration: 60 }],
          gigModifiers: {},
          currentGig: { songId: 'song_1' }
        },
        contextActions: {
          addToast,
          t: key => key,
          setLastGigStats: vi.fn(),
          endGig: vi.fn()
        }
      })
    )
    return {
      ...rendered,
      gameStateRef,
      resetGameplayState,
      setAudioStatus,
      watched: [
        resetGameplayState,
        mocks.resetGigStateTracking,
        mocks.setupGigPhysics,
        mocks.stopMusic,
        mocks.playSongSequence,
        mocks.ensureAudioContext,
        setAudioStatus,
        setIsGameOver,
        setFailureKind,
        addToast,
        mocks.handleError
      ]
    }
  }

  it('does no new work when Retry is called after unmount', async () => {
    mocks.ensureAudioContext.mockResolvedValueOnce(false)
    const hook = renderRetryHook()
    await advance(0)
    expect(hook.setAudioStatus).toHaveBeenLastCalledWith('blocked')
    const retry = hook.result.current.retryAudioInitialization
    hook.unmount()
    await advance(0)
    const counts = hook.watched.map(fn => fn.mock.calls.length)

    await act(async () => {
      const pending = retry()
      await vi.advanceTimersByTimeAsync(16000)
      await pending
    })

    expect(hook.watched.map(fn => fn.mock.calls.length)).toEqual(counts)
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
  })

  it.each([
    { hasSubmittedResults: true, isGameOver: false },
    { hasSubmittedResults: false, isGameOver: true },
    { hasSubmittedResults: true, isGameOver: true }
  ])('preserves terminal flags on mounted Retry: %j', async flags => {
    mocks.ensureAudioContext.mockResolvedValueOnce(false)
    const hook = renderRetryHook()
    await advance(0)
    Object.assign(hook.gameStateRef.current, flags)
    const counts = hook.watched.map(fn => fn.mock.calls.length)

    await act(async () => {
      const pending = hook.result.current.retryAudioInitialization()
      await vi.advanceTimersByTimeAsync(16000)
      await pending
    })

    expect(hook.gameStateRef.current).toMatchObject(flags)
    expect(hook.resetGameplayState).not.toHaveBeenCalled()
    expect(hook.watched.map(fn => fn.mock.calls.length)).toEqual(counts)
  })

  it.each(
    ['hasSubmittedResults', 'isGameOver'].flatMap(endedFlag =>
      ['unlocked', 'blocked', 'rejected'].map(outcome => [endedFlag, outcome])
    )
  )(
    'preserves %s when a mounted retry unlock is %s after the gig ends',
    async (endedFlag, outcome) => {
      mocks.ensureAudioContext.mockResolvedValueOnce(false)
      const hook = renderRetryHook()
      await advance(0)
      expect(hook.setAudioStatus).toHaveBeenLastCalledWith('blocked')

      const retryUnlock = Promise.withResolvers()
      mocks.ensureAudioContext.mockReturnValueOnce(retryUnlock.promise)
      let retry
      act(() => {
        retry = hook.result.current.retryAudioInitialization()
      })
      expect(hook.resetGameplayState).toHaveBeenCalledTimes(1)
      expect(mocks.stopMusic).toHaveBeenCalledTimes(2)
      expect(mocks.ensureAudioContext).toHaveBeenCalledTimes(2)
      // Count only work after the retry's legitimate synchronous reset/unlock.
      const counts = hook.watched.map(fn => fn.mock.calls.length)
      hook.gameStateRef.current[endedFlag] = true
      const terminalState = structuredClone(hook.gameStateRef.current)

      await act(async () => {
        if (outcome === 'rejected') {
          retryUnlock.reject(new Error('audio unlock failed'))
        } else {
          retryUnlock.resolve(outcome === 'unlocked')
        }
        await vi.advanceTimersByTimeAsync(16000)
        await retry
      })

      expect(hook.gameStateRef.current).toEqual(terminalState)
      expect(hook.watched.map(fn => fn.mock.calls.length)).toEqual(counts)
      expect(mocks.playSongSequence).not.toHaveBeenCalled()
    }
  )

  it('resets a mounted retry once and plays once only after its new stage is ready', async () => {
    mocks.ensureAudioContext.mockResolvedValueOnce(false)
    const hook = renderRetryHook()
    await advance(0)
    expect(hook.setAudioStatus).toHaveBeenLastCalledWith('blocked')
    let retry
    await act(async () => {
      retry = hook.result.current.retryAudioInitialization()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(hook.resetGameplayState).toHaveBeenCalledTimes(1)
    expect(hook.setAudioStatus).toHaveBeenLastCalledWith('initializing')
    expect(mocks.playSongSequence).not.toHaveBeenCalled()
    await act(async () => {
      hook.result.current.onStageReady()
      await retry
    })
    expect(hook.setAudioStatus).toHaveBeenLastCalledWith('ready')
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
    await advance(16000)
    expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)
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
        resetGameplayState: mocks.resetGameplayState,
        setters: createMockSetters({
          setAudioStatus,
          setFailureKind
        }),
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
    expect(mocks.invalidateSongSequence).toHaveBeenCalledTimes(1)
    expect(
      mocks.invalidateSongSequence.mock.invocationCallOrder[0]
    ).toBeLessThan(mocks.stopAudio.mock.invocationCallOrder[0])
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
    expect(mocks.resetGameplayState).toHaveBeenCalledTimes(1)
    expect(mocks.resetGameplayState.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.resetGigStateTracking.mock.invocationCallOrder[1]
    )
    expect(mocks.playSongSequence.mock.calls[1][0]).toBe(0)
  })

  it('does not invalidate an already lost gig on a late stage failure', async () => {
    const gameStateRef = { current: { lanes: [{}, {}, {}], isGameOver: false } }
    const { result } = renderAudioHook(vi.fn(), gameStateRef)
    await advance(STAGE_READY_FALLBACK_MS)
    gameStateRef.current.isGameOver = true
    act(() => result.current.onStageInitError())
    expect(mocks.invalidateSongSequence).not.toHaveBeenCalled()
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

  it('shows the audio retry UI when a later song cannot start', async () => {
    const setAudioStatus = vi.fn()
    const setFailureKind = vi.fn()
    const gameStateRef = { current: { lanes: [{}, {}, {}] } }
    const { result } = renderAudioHook(
      setAudioStatus,
      gameStateRef,
      setFailureKind
    )
    await advance(0)
    act(() => result.current.onStageReady())
    await advance(0)
    expect(setAudioStatus).toHaveBeenLastCalledWith('ready')
    expect(gameStateRef.current.onPlaybackError).toBeTypeOf('function')
    act(() =>
      gameStateRef.current.onPlaybackError(new Error('backend unavailable'))
    )
    expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
    expect(setFailureKind).toHaveBeenLastCalledWith('audio')
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

    it('keeps a stage failure when the stopped playback then rejects', async () => {
      let rejectPlayback = () => {}
      mocks.playSongSequence.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectPlayback = reject
          })
      )
      const setAudioStatus = vi.fn()
      const setFailureKind = vi.fn()
      const { result } = renderAudioHook(
        setAudioStatus,
        undefined,
        setFailureKind
      )
      await advance(STAGE_READY_FALLBACK_MS)
      expect(mocks.playSongSequence).toHaveBeenCalledTimes(1)

      // The stage fails while playback is still starting; stopping it rejects.
      act(() => {
        result.current.onStageInitError()
      })
      await act(async () => {
        rejectPlayback(new Error('stopped'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(setAudioStatus).toHaveBeenLastCalledWith('failed')
      expect(setFailureKind).toHaveBeenLastCalledWith('stage')
      expect(setFailureKind).not.toHaveBeenLastCalledWith('audio')
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
