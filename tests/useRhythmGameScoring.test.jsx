import { describe, it as test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock Dependencies
const mockAudioEngine = {
  playHit: vi.fn(),
  playMiss: vi.fn(),
  stopAudio: vi.fn(),
  setMusicVolume: vi.fn(),
  setSfxVolume: vi.fn(),
  getGigTimeMs: vi.fn(),
  getAudioTimeMs: vi.fn(),
  playNoteAtTime: vi.fn(),
  getScheduledHitTimeMs: vi.fn(),
  getPlayRequestId: vi.fn(),
  subscribeToAudioState: vi.fn(),
  playSFX: vi.fn()
}

const mockGigStats = {
  calculateScore: vi.fn(),
  calculateAccuracy: vi.fn(() => 100),
  applyGameModifiers: vi.fn(),
  updateGigPerformanceStats: vi.fn(x => x),
  buildGigStatsSnapshot: vi.fn()
}

const mockRhythmUtils = {
  checkHit: vi.fn(),
  getNoteScore: vi.fn(),
  generateLanes: vi.fn()
}

vi.mock('../src/utils/AudioManager.js', () => ({
  audioManager: mockAudioEngine
}))
vi.mock('../src/utils/audioEngine.js', () => mockAudioEngine)
vi.mock('../src/utils/audio/timingUtils.js', () => mockAudioEngine)

vi.mock('../src/utils/gigStats.js', () => mockGigStats)

vi.mock('../src/utils/rhythmUtils.js', () => mockRhythmUtils)
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: k => k })
}))
vi.mock('tone', () => ({
  getContext: vi.fn(() => ({ rawContext: {} })),
  Transport: {},
  start: vi.fn()
}))

const setupRhythmGameScoringTest = async () => {
  const { useRhythmGameScoring } =
    await import('../src/hooks/rhythmGame/useRhythmGameScoring.js')
  return { useRhythmGameScoring }
}

const createMockGameState = () => ({
  score: 0,
  combo: 0,
  health: 100,
  overload: 0,
  isToxicMode: false,
  isGameOver: false,
  stats: { misses: 0, perfectHits: 0 },
  lanes: [
    { id: 'l1', hitWindow: 100 },
    { id: 'l2', hitWindow: 100 },
    { id: 'l3', hitWindow: 100 }
  ],
  modifiers: {},
  notes: [],
  toxicModeEndTime: 0,
  toxicTimeTotal: 0
})

const createMockSetters = gameStateRef => ({
  setScore: vi.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.score)
        : updater
    gameStateRef.current.score = next
    return next
  }),
  setCombo: vi.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.combo)
        : updater
    gameStateRef.current.combo = next
    return next
  }),
  setHealth: vi.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.health)
        : updater
    gameStateRef.current.health = next
    return next
  }),
  setOverload: vi.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.overload)
        : updater
    gameStateRef.current.overload = next
    return next
  }),
  setIsToxicMode: vi.fn(val => {
    gameStateRef.current.isToxicMode = val
  }),
  setIsGameOver: vi.fn(val => {
    gameStateRef.current.isGameOver = val
  }),
  setAccuracy: vi.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.accuracy)
        : updater
    gameStateRef.current.accuracy = next
    return next
  })
})

describe('useRhythmGameScoring', () => {
  let useRhythmGameScoring, gameStateRef, setters, contextActions

  let originalLocalStorageSetItem

  beforeEach(async () => {
    setupJSDOM()

    originalLocalStorageSetItem = window.localStorage.setItem
    window.localStorage.setItem = vi.fn()

    vi.clearAllMocks()

    gameStateRef = { current: createMockGameState() }
    setters = createMockSetters(gameStateRef)
    contextActions = {
      addToast: vi.fn(),
      setLastGigStats: vi.fn(),
      endGig: vi.fn()
    }

    mockAudioEngine.getGigTimeMs.mockImplementation(() => 1000)
    mockRhythmUtils.checkHit.mockImplementation(() => ({
      hit: false,
      visible: true,
      time: 1000,
      originalNote: { p: 60 }
    }))

    const loaded = await setupRhythmGameScoringTest()
    useRhythmGameScoring = loaded.useRhythmGameScoring
  })

  afterEach(() => {
    try {
      cleanup()
      teardownJSDOM()
    } finally {
      if (originalLocalStorageSetItem) {
        window.localStorage.setItem = originalLocalStorageSetItem
      }
    }
  })

  test('initializes and handles various hit/miss scenarios efficiently', () => {
    const { result, unmount } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: { drumMultiplier: 1.5, crowdDecay: 1.0 },
        contextActions
      })
    )

    expect(typeof result.current.handleHit).toBe('function')
    expect(typeof result.current.handleMiss).toBe('function')

    let hitResult

    // Basic valid hit
    act(() => {
      hitResult = result.current.handleHit(0)
    })
    expect(hitResult).toBe(true)
    expect(setters.setAccuracy).toHaveBeenCalled()
    expect(gameStateRef.current.score).toBe(100)
    expect(gameStateRef.current.combo).toBe(1)
    expect(gameStateRef.current.stats.perfectHits).toBe(1)

    // Valid hit with multiplier
    act(() => {
      hitResult = result.current.handleHit(1)
    })
    expect(hitResult).toBe(true)
    expect(gameStateRef.current.score).toBe(260) // 100 + 150 + 10 combo
    expect(gameStateRef.current.combo).toBe(2)
    expect(gameStateRef.current.stats.perfectHits).toBe(2)

    // Invalid hit
    mockRhythmUtils.checkHit.mockImplementationOnce(() => null)
    act(() => {
      hitResult = result.current.handleHit(0)
    })
    expect(hitResult).toBe(false)
    expect(setters.setAccuracy).toHaveBeenCalled()
    expect(gameStateRef.current.combo).toBe(0)
    expect(gameStateRef.current.health).toBe(99)

    // Handle Miss (real miss)
    gameStateRef.current.combo = 10
    gameStateRef.current.health = 50
    act(() => {
      result.current.handleMiss(1, false)
    })
    expect(gameStateRef.current.combo).toBe(0)
    expect(setters.setAccuracy).toHaveBeenCalled()
    expect(gameStateRef.current.health).toBe(48)

    // Game Over via health depletion
    gameStateRef.current.health = 1
    act(() => {
      result.current.handleMiss(1, false)
    })
    expect(gameStateRef.current.health).toBe(0)
    expect(gameStateRef.current.isGameOver).toBe(true)
    expect(mockAudioEngine.stopAudio).toHaveBeenCalledTimes(1)
    expect(contextActions.addToast.mock.calls[0][0]).toBe(
      'ui:gig.toasts.bandCollapsed'
    )

    unmount()
  })

  test('handles toxic mode activation, scoring, and deactivation', () => {
    const { result, unmount } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.activateToxicMode()
    })
    expect(gameStateRef.current.isToxicMode).toBe(true)
    expect(gameStateRef.current.toxicModeEndTime).toBe(11000) // mockedGetGigTimeMs (1000) + 10000
    expect(
      contextActions.addToast.mock.calls.some(
        c => c[0] === 'ui:gig.toasts.toxicOverload'
      )
    ).toBe(true)

    gameStateRef.current.health = 50
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.score).toBe(400)
    expect(gameStateRef.current.health).toBe(51)

    act(() => {
      result.current.handleMiss(1, true)
    })
    expect(gameStateRef.current.isToxicMode).toBe(true)

    contextActions.addToast.mockClear()
    act(() => {
      result.current.handleMiss(1, false)
    })
    expect(gameStateRef.current.isToxicMode).toBe(false)
    expect(contextActions.addToast.mock.calls[0][0]).toBe(
      'ui:gig.toasts.toxicModeLost'
    )

    contextActions.addToast.mockClear()
    gameStateRef.current.overload = 96
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.isToxicMode).toBe(true)
    expect(gameStateRef.current.overload).toBe(0)
    expect(
      contextActions.addToast.mock.calls.some(
        c => c[0] === 'ui:gig.toasts.toxicOverload'
      )
    ).toBe(true)

    unmount()
  })

  test('applies game modifiers correctly (Guestlist, Perfektionist)', () => {
    const { result, unmount } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    gameStateRef.current.modifiers = { guestlist: true }
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.score).toBe(120)

    gameStateRef.current.score = 0
    gameStateRef.current.combo = 0

    gameStateRef.current.modifiers = {
      hasPerfektionist: true,
      guestlist: false
    }
    mockGigStats.calculateAccuracy.mockImplementationOnce(() => 90)
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.score).toBe(114)

    gameStateRef.current.score = 0
    gameStateRef.current.combo = 0

    gameStateRef.current.modifiers = {
      hasPerfektionist: true,
      guestlist: false
    }
    mockGigStats.calculateAccuracy.mockImplementationOnce(() => 85)
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.score).toBe(100)

    gameStateRef.current.score = 0
    gameStateRef.current.combo = 0

    gameStateRef.current.modifiers = {
      hasPerfektionist: true,
      guestlist: false
    }
    mockGigStats.calculateAccuracy.mockImplementationOnce(() => 86)
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.score).toBe(114)

    gameStateRef.current.score = 0
    gameStateRef.current.combo = 0

    gameStateRef.current.modifiers = {
      hasPerfektionist: true,
      guestlist: false
    }
    mockGigStats.calculateAccuracy.mockImplementationOnce(() => 80)
    act(() => {
      result.current.handleHit(0)
    })
    expect(gameStateRef.current.score).toBe(100)

    unmount()
  })

  test('handleMiss triggers game over timeout toast', () => {
    vi.useFakeTimers()
    try {
      mockAudioEngine.getPlayRequestId.mockReturnValue('mock-req')
      gameStateRef.current.health = 1
      const { result, unmount } = renderHook(() =>
        useRhythmGameScoring({
          gameStateRef,
          setters,
          performance: {},
          contextActions
        })
      )

      act(() => {
        result.current.handleMiss(1, false)
      })
      expect(gameStateRef.current.isGameOver).toBe(true)

      contextActions.addToast.mockClear()
      // Mock snapshot return
      const mockSnapshot = { score: 100, requestId: 'mock-req' }
      mockGigStats.buildGigStatsSnapshot.mockReturnValue(mockSnapshot)
      mockAudioEngine.getPlayRequestId.mockReturnValue('mock-req')

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(contextActions.addToast.mock.calls[0][0]).toBe(
        'ui:gig.toasts.gigFailed'
      )
      expect(mockGigStats.buildGigStatsSnapshot).toHaveBeenCalledWith(
        gameStateRef.current.score,
        gameStateRef.current.stats,
        gameStateRef.current.toxicTimeTotal,
        expect.any(Object) // The performance options passed
      )
      expect(contextActions.setLastGigStats).toHaveBeenCalledTimes(1)
      expect(contextActions.setLastGigStats).toHaveBeenCalledWith(mockSnapshot)
      expect(contextActions.endGig).toHaveBeenCalledTimes(1)

      unmount()
    } finally {
      vi.useRealTimers()
    }
  })
})
