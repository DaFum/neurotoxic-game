import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRhythmGameInput } from '../../src/hooks/rhythmGame/useRhythmGameInput'
import { useHandleMiss } from '../../src/hooks/rhythmGame/scoring/useHandleMiss'
import { AudioEngineProvider } from '../../src/context/AudioEngineContext'
import { NullAudioEngine } from '../../src/utils/audio/audioEngineInterface'

// Hoisted: `vi.mock` is lifted above module-scope consts, so the factory below
// would otherwise close over an uninitialised binding.
const { reached, forbidden } = vi.hoisted(() => {
  const hubCalls = []
  return {
    reached: hubCalls,
    forbidden: name => () => {
      hubCalls.push(name)
      throw new Error(`real audio hub reached: ${name}`)
    }
  }
})

// Every runtime audio capability throws. A tree wrapped in NullAudioEngine must
// not reach any of them -- that is the whole promise of the engine seam, and it
// only holds once the consumers stopped importing the hub directly.
//
// The pure helpers (`getScheduledHitTimeMs` and friends) stay real: they take
// explicit arguments and touch no audio state, so they are deliberately NOT
// part of the injected boundary.
vi.mock('../../src/utils/audio/audioEngine', () => ({
  getTransportState: forbidden('getTransportState'),
  getGigTimeMs: forbidden('getGigTimeMs'),
  pauseAudio: forbidden('pauseAudio'),
  resumeAudio: forbidden('resumeAudio'),
  setCorruptionEffect: forbidden('setCorruptionEffect'),
  enableCorruptionBurstAudio: forbidden('enableCorruptionBurstAudio'),
  getToneAbsoluteTimeMs: forbidden('getToneAbsoluteTimeMs'),
  getPlayRequestId: forbidden('getPlayRequestId'),
  stopAudio: forbidden('stopAudio'),
  stopGigPlayback: forbidden('stopGigPlayback'),
  startGigPlayback: forbidden('startGigPlayback'),
  playNoteAtTime: forbidden('playNoteAtTime'),
  playSongSequence: forbidden('playSongSequence'),
  audioManager: {
    ensureAudioContext: forbidden('audioManager.ensureAudioContext')
  },
  audioService: {
    playSFX: forbidden('audioService.playSFX'),
    stopMusic: forbidden('audioService.stopMusic')
  }
}))

const wrapper = ({ children }) => (
  <AudioEngineProvider engine={new NullAudioEngine()}>
    {children}
  </AudioEngineProvider>
)

describe('gig hooks reach no audio hub function under a substituted engine', () => {
  beforeEach(() => {
    reached.length = 0
  })

  it('drives input without touching the hub', () => {
    const gameStateRef = {
      current: {
        lanes: [{ active: false }, { active: false }],
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: false
      }
    }

    const { result } = renderHook(
      () =>
        useRhythmGameInput({
          gameStateRef,
          scoringActions: { handleHit: vi.fn() },
          contextState: { activeEvent: null }
        }),
      { wrapper }
    )

    act(() => {
      result.current.registerInput(0, true)
      result.current.registerInput(0, false)
    })

    expect(reached).toEqual([])
  })

  it('drives a miss through to band collapse without touching the hub', () => {
    const gameOverTimerRef = { current: null }
    const gameStateRef = {
      current: {
        // Health low enough that a single miss triggers the game-over branch,
        // which is where stopAudio and the play-request id are read.
        health: 1,
        overload: 0,
        combo: 10,
        score: 0,
        isToxicMode: false,
        isGameOver: false,
        songStats: [],
        toxicTimeTotal: 0,
        modifiers: {},
        stats: { misses: 0, perfectHits: 0, hits: 0, corruptionLevel: 0 }
      }
    }

    const { result } = renderHook(
      () =>
        useHandleMiss({
          gameStateRef,
          setters: {
            setCombo: vi.fn(),
            setHealth: vi.fn(),
            setIsGameOver: vi.fn(),
            setIsToxicMode: vi.fn(),
            setOverload: vi.fn(),
            setAccuracy: vi.fn()
          },
          contextActions: {
            addToast: vi.fn(),
            setLastGigStats: vi.fn(),
            endGig: vi.fn()
          },
          baseCrowdDecay: 1,
          gameOverTimerRef
        }),
      { wrapper }
    )

    try {
      act(() => {
        result.current(1, false)
      })

      expect(gameStateRef.current.isGameOver).toBe(true)
      expect(reached).toEqual([])
    } finally {
      // The collapse path schedules a real 4s timeout. Nulling the ref would
      // not cancel it -- the callback would still fire into this test's mocks
      // long after it finished -- so cancel the handle itself.
      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current)
        gameOverTimerRef.current = null
      }
    }
  })
})
