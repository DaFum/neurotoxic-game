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
const { finalizeGig } = await import('../../src/utils/rhythmGameLoopUtils')

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
