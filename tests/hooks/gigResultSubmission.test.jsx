// Composed exactly-once contract for gig results (#3574): normal completion
// (`finalizeGig`), Quit (`useGigSession`) and the delayed collapse timer
// (`useHandleMiss`) all run against ONE shared rhythm ref, so overlapping
// completion paths must publish exactly one result snapshot between them.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'

const { engine, hubStopAudio } = vi.hoisted(() => {
  let playRequestId = 1
  return {
    // The injected gig engine the miss handler reads (`useAudioEngine`). Its
    // generation is independent of the hub `stopAudio` Quit calls, exactly as
    // with an `AudioEngineProvider` stub or `NullAudioEngine`.
    engine: {
      stopAudio: vi.fn(),
      playSFX: vi.fn(),
      getPlayRequestId: vi.fn(() => playRequestId),
      bumpPlayRequestId: () => {
        playRequestId++
      }
    },
    hubStopAudio: vi.fn()
  }
})

vi.mock('../../src/utils/audio/audioEngine', () => ({
  stopAudio: hubStopAudio,
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(() => Promise.resolve(true)),
  audioManager: {},
  audioService: {}
}))

vi.mock('../../src/context/AudioEngineContext', () => ({
  useAudioEngine: () => engine
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key, fallback) => fallback ?? key })
}))

const { useGigSession } = await import('../../src/hooks/useGigSession')
const { useHandleMiss } =
  await import('../../src/hooks/rhythmGame/scoring/useHandleMiss')
const { finalizeGig, processRhythmGameTick } =
  await import('../../src/utils/rhythmGameLoopUtils')
const { createHecklerSession } = await import('../../src/utils/hecklerLogic')

const COLLAPSE_DELAY_MS = 4000

const createRhythmState = () => ({
  score: 4321,
  stats: {
    misses: 0,
    perfectHits: 3,
    hits: 2,
    maxCombo: 5,
    peakHype: 0,
    corruptionLevel: 0
  },
  toxicTimeTotal: 0,
  songStats: [],
  health: 1,
  overload: 0,
  combo: 0,
  isToxicMode: false,
  isGameOver: false,
  hasSubmittedResults: false,
  rivalPenaltyActive: false,
  modifiers: {}
})

describe('gig result submission across completion paths (#3574)', () => {
  let gameStateRef
  let gameOverTimerRef
  let addToast
  let setLastGigStats
  let endGig

  const renderSession = () =>
    renderHook(() => {
      const session = useGigSession({
        addToast,
        setLastGigStats,
        endGig,
        tRef: { current: (key, options) => options?.defaultValue ?? key },
        gameStateRef
      })
      const handleMiss = useHandleMiss({
        gameStateRef,
        setters: {
          setCombo: vi.fn(),
          setHealth: vi.fn(),
          setIsGameOver: vi.fn(),
          setIsToxicMode: vi.fn(),
          setOverload: vi.fn(),
          setAccuracy: vi.fn()
        },
        contextActions: { addToast, setLastGigStats, endGig },
        gameOverTimerRef
      })
      return { ...session, handleMiss }
    })

  const collapse = result => {
    act(() => {
      result.current.handleMiss(50, false)
    })
    expect(gameStateRef.current.isGameOver).toBe(true)
  }

  const quit = async result => {
    await act(async () => {
      await result.current.handleQuitGig()
    })
  }

  const fireCollapseTimer = () => {
    act(() => {
      vi.advanceTimersByTime(COLLAPSE_DELAY_MS)
    })
  }

  const complete = (stopAudio = vi.fn()) =>
    finalizeGig(gameStateRef.current, setLastGigStats, endGig, stopAudio)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    engine.stopAudio.mockImplementation(() => {})
    hubStopAudio.mockImplementation(() => {})
    gameStateRef = { current: createRhythmState() }
    gameOverTimerRef = { current: null }
    addToast = vi.fn()
    setLastGigStats = vi.fn()
    endGig = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('final-tick collision collapse wins: one failed result via the collapse timer (#3592)', () => {
    const { result } = renderSession()
    const stopAudio = vi.fn()
    // Last song done and near its end; a projectile is about to cross the hit line.
    Object.assign(gameStateRef.current, {
      setlistCompleted: true,
      totalDuration: 1000,
      notes: [],
      nextMissCheckIndex: 0,
      lastTickTimeMs: 999,
      rng: () => 1,
      projectiles: [
        {
          id: 1,
          x: 0,
          y: 925,
          vx: 0,
          vy: 1,
          rotation: 0,
          vr: 0,
          type: 'bottle'
        }
      ]
    })
    const finalTick = () =>
      processRhythmGameTick({
        stateRef: gameStateRef.current,
        isTransportRunning: true,
        transportState: 'started',
        activeEvent: null,
        dimensionsRef: { current: { width: 1920, height: 1080 } },
        hecklerSessionRef: { current: createHecklerSession() },
        deltaMS: 16,
        handleCollision: () => result.current.handleMiss(1, false),
        setIsToxicMode: vi.fn(),
        setIsCorruptionBurstActive: vi.fn(),
        handleMiss: result.current.handleMiss,
        finalizeGigCallback: stateRef =>
          finalizeGig(stateRef, setLastGigStats, endGig, stopAudio),
        getGigTimeMs: () => 999,
        pauseAudio: vi.fn(),
        resumeAudio: vi.fn(() => true),
        setCorruptionState: vi.fn(),
        disableCorruptionBurstAudio: vi.fn()
      })

    act(() => {
      finalTick()
    })

    expect(gameStateRef.current.isGameOver).toBe(true)
    expect(addToast).toHaveBeenCalledWith('BAND COLLAPSED', 'error')
    expect(setLastGigStats).not.toHaveBeenCalled()
    expect(stopAudio).not.toHaveBeenCalled()

    fireCollapseTimer()

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({ failed: true })
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('collapse -> later completion ticks -> timer: one failed result via the collapse timer (#3592)', () => {
    const { result } = renderSession()
    const stopAudio = vi.fn()
    Object.assign(gameStateRef.current, {
      setlistCompleted: true,
      totalDuration: 1000,
      notes: [],
      nextMissCheckIndex: 0,
      lastTickTimeMs: 999,
      rng: () => 1,
      projectiles: []
    })
    const tick = ({ isTransportRunning, transportState }) =>
      processRhythmGameTick({
        stateRef: gameStateRef.current,
        isTransportRunning,
        transportState,
        activeEvent: null,
        dimensionsRef: { current: { width: 1920, height: 1080 } },
        hecklerSessionRef: { current: createHecklerSession() },
        deltaMS: 16,
        handleCollision: vi.fn(),
        setIsToxicMode: vi.fn(),
        setIsCorruptionBurstActive: vi.fn(),
        handleMiss: result.current.handleMiss,
        finalizeGigCallback: stateRef =>
          finalizeGig(stateRef, setLastGigStats, endGig, stopAudio),
        getGigTimeMs: () => 1000,
        pauseAudio: vi.fn(),
        resumeAudio: vi.fn(() => true),
        setCorruptionState: vi.fn(),
        disableCorruptionBurstAudio: vi.fn()
      })

    collapse(result)
    // The collapse stopped audio; later frames see a stopped transport at the
    // track end, and a still-running one at the near-end window.
    act(() => {
      tick({ isTransportRunning: false, transportState: 'stopped' })
      tick({ isTransportRunning: true, transportState: 'started' })
    })

    expect(setLastGigStats).not.toHaveBeenCalled()
    expect(stopAudio).not.toHaveBeenCalled()
    expect(endGig).not.toHaveBeenCalled()

    fireCollapseTimer()

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({ failed: true })
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('completion -> Quit: Quit neither resubmits nor ends the gig again', async () => {
    const { result } = renderSession()

    complete()
    await quit(result)

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({
      score: 4321,
      failed: false
    })
    expect(endGig).toHaveBeenCalledTimes(1)
    expect(hubStopAudio).not.toHaveBeenCalled()
  })

  it('collapse -> Quit -> timer: the delayed collapse timer does not resubmit', async () => {
    const { result } = renderSession()

    collapse(result)
    await quit(result)
    fireCollapseTimer()

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({ failed: true })
    expect(endGig).toHaveBeenCalledTimes(1)
    // The timer lost the arbitration: no "Gig Failed" toast either.
    expect(addToast).not.toHaveBeenCalledWith(
      'Gig Failed! Reviewing impact...',
      'info'
    )
  })

  it('collapse -> timer -> Quit: a Quit before the scene change does not resubmit', async () => {
    const { result } = renderSession()

    collapse(result)
    fireCollapseTimer()
    await quit(result)

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({ failed: true })
    expect(endGig).toHaveBeenCalledTimes(1)
    expect(hubStopAudio).not.toHaveBeenCalled()
  })

  it('collapse -> Quit with failing audio cleanup -> timer: still one submission', async () => {
    hubStopAudio.mockImplementation(() => {
      throw new Error('stop failed')
    })
    const { result } = renderSession()

    collapse(result)
    await quit(result)
    fireCollapseTimer()

    expect(hubStopAudio).toHaveBeenCalledTimes(1)
    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('a stale collapse timer (new audio session) neither submits nor claims', async () => {
    const { result } = renderSession()

    collapse(result)
    engine.bumpPlayRequestId()
    fireCollapseTimer()

    expect(setLastGigStats).not.toHaveBeenCalled()
    expect(endGig).not.toHaveBeenCalled()
    expect(gameStateRef.current.hasSubmittedResults).toBe(false)

    // The claim is still open, so a later Quit ends the gig exactly once.
    await quit(result)
    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('a collapse whose audio stop throws leaves the claim to Quit', async () => {
    engine.stopAudio.mockImplementation(() => {
      throw new Error('stop failed')
    })
    const { result } = renderSession()

    expect(() => result.current.handleMiss(50, false)).toThrow('stop failed')
    expect(gameOverTimerRef.current).toBeNull()

    await quit(result)
    fireCollapseTimer()

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({ failed: true })
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('completion with failing audio cleanup still ends the gig once, and Quit stays inert', async () => {
    const { result } = renderSession()

    expect(() =>
      complete(() => {
        throw new Error('stop failed')
      })
    ).toThrow('stop failed')
    await quit(result)

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('a Quit re-entered from the collapse publisher does not resubmit', async () => {
    const { result } = renderSession()
    setLastGigStats.mockImplementationOnce(() => {
      void result.current.handleQuitGig()
    })

    collapse(result)
    fireCollapseTimer()

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({ failed: true })
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('a failed collapse submission keeps the claim: a later Quit does not resubmit', async () => {
    const { result } = renderSession()
    setLastGigStats.mockImplementationOnce(() => {
      throw new Error('publish failed')
    })

    collapse(result)
    expect(() => vi.advanceTimersByTime(COLLAPSE_DELAY_MS)).toThrow(
      'publish failed'
    )
    await quit(result)

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(gameStateRef.current.hasSubmittedResults).toBe(true)
    // The timer still leaves the scene, so the claim cannot strand the gig.
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('completion with a failing publish still stops audio and ends the gig once', () => {
    setLastGigStats.mockImplementationOnce(() => {
      throw new Error('publish failed')
    })
    const stopAudio = vi.fn()

    expect(() => complete(stopAudio)).toThrow('publish failed')

    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
    expect(gameStateRef.current.hasSubmittedResults).toBe(true)
  })

  it('collapse timer still ends the gig when its toast throws after the claim', () => {
    const { result } = renderSession()
    collapse(result)
    addToast.mockImplementation(() => {
      throw new Error('toast failed')
    })

    expect(() => vi.advanceTimersByTime(COLLAPSE_DELAY_MS)).toThrow(
      'toast failed'
    )

    expect(endGig).toHaveBeenCalledTimes(1)
    expect(setLastGigStats).not.toHaveBeenCalled()
  })

  it('Quit with a failing publish still ends the gig once', async () => {
    const { result } = renderSession()
    setLastGigStats.mockImplementationOnce(() => {
      throw new Error('publish failed')
    })

    await expect(quit(result)).rejects.toThrow('publish failed')
    await quit(result)

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(endGig).toHaveBeenCalledTimes(1)
  })

  it('null ref: repeated Quits submit and end the gig once', async () => {
    gameStateRef.current = null
    const { result } = renderSession()

    await quit(result)
    await quit(result)

    expect(setLastGigStats).toHaveBeenCalledTimes(1)
    expect(setLastGigStats.mock.calls[0][0]).toMatchObject({
      score: 0,
      failed: true,
      songStats: []
    })
    expect(endGig).toHaveBeenCalledTimes(1)
    expect(hubStopAudio).toHaveBeenCalledTimes(1)
  })
})
