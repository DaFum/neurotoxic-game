import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicModules,
  resetAllMocks,
  mockRhythmGameLogicDependencies
} from './useRhythmGameLogicTestUtils.js'

const {
  mockUseGameState,
  mockSimulationUtils,
  mockAudioManager,
  mockAudioEngine,
  mockAudioTimingUtils,
  mockGigStats,
  mockRhythmUtils,
  mockHecklerLogic,
  mockErrorHandler,
  mockLogger,
  mockSongs
} = mockRhythmGameLogicDependencies

// Setup the test environment
const setupRhythmGameScoringTest = async () => {
  mockRhythmGameLogicModules()
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
  stats: {
    misses: 0,
    perfectHits: 0
  },
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
  setScore: mock.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.score)
        : updater
    gameStateRef.current.score = next
    return next
  }),
  setCombo: mock.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.combo)
        : updater
    gameStateRef.current.combo = next
    return next
  }),
  setHealth: mock.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.health)
        : updater
    gameStateRef.current.health = next
    return next
  }),
  setOverload: mock.fn(updater => {
    const next =
      typeof updater === 'function'
        ? updater(gameStateRef.current.overload)
        : updater
    gameStateRef.current.overload = next
    return next
  }),
  setIsToxicMode: mock.fn(val => {
    gameStateRef.current.isToxicMode = val
  }),
  setIsGameOver: mock.fn(val => {
    gameStateRef.current.isGameOver = val
  }),
  setAccuracy: mock.fn()
})

describe('useRhythmGameScoring', async () => {
  let useRhythmGameScoring
  let gameStateRef
  let setters
  let contextActions

  const loaded = await setupRhythmGameScoringTest()
  useRhythmGameScoring = loaded.useRhythmGameScoring

  beforeEach(() => {
    setupJSDOM()
    resetAllMocks()

    gameStateRef = { current: createMockGameState() }
    setters = createMockSetters(gameStateRef)
    contextActions = {
      addToast: mock.fn(),
      setLastGigStats: mock.fn(),
      endGig: mock.fn()
    }

    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 1000)
    mockRhythmUtils.checkHit.mock.mockImplementation(() => ({
      hit: false,
      visible: true,
      time: 1000,
      originalNote: { p: 60 }
    }))
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initialization returns handlers', () => {
    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    assert.equal(typeof result.current.handleHit, 'function')
    assert.equal(typeof result.current.handleMiss, 'function')
    assert.equal(typeof result.current.activateToxicMode, 'function')
  })

  test('handleHit updates score and combo on valid hit', () => {
    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    let hitResult
    act(() => {
      hitResult = result.current.handleHit(0)
    })

    assert.equal(hitResult, true)
    assert.equal(gameStateRef.current.score, 100)
    assert.equal(gameStateRef.current.combo, 1)
    assert.equal(gameStateRef.current.stats.perfectHits, 1)
  })

  test('handleHit triggers miss on invalid hit', () => {
    mockRhythmUtils.checkHit.mock.mockImplementation(() => null)

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    let hitResult
    act(() => {
      hitResult = result.current.handleHit(0)
    })

    assert.equal(hitResult, false)
    assert.equal(gameStateRef.current.combo, 0)
    // Health 100 - 1 = 99
    assert.equal(gameStateRef.current.health, 99)
  })

  test('handleHit applies lane multipliers', () => {
    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: { drumMultiplier: 1.5 },
        contextActions
      })
    )

    act(() => {
      result.current.handleHit(1)
    })

    assert.equal(gameStateRef.current.score, 150)
  })

  test('handleMiss resets combo and applies penalties', () => {
    gameStateRef.current.combo = 10
    gameStateRef.current.health = 50

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: { crowdDecay: 1.0 },
        contextActions
      })
    )

    act(() => {
      result.current.handleMiss(1, false) // Real miss
    })

    assert.equal(gameStateRef.current.combo, 0)
    assert.equal(gameStateRef.current.health, 48)
  })

  test('handleMiss triggers game over when health depleted', () => {
    gameStateRef.current.health = 1

    const { result } = renderHook(() =>
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

    assert.equal(gameStateRef.current.health, 0)
    assert.equal(gameStateRef.current.isGameOver, true)
    assert.equal(mockAudioEngine.stopAudio.mock.calls.length, 1)
    assert.equal(
      contextActions.addToast.mock.calls[0].arguments[0],
      'BAND COLLAPSED'
    )
  })

  test('activateToxicMode sets flag and toast', () => {
    const { result } = renderHook(() =>
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

    assert.equal(gameStateRef.current.isToxicMode, true)
    assert.equal(
      contextActions.addToast.mock.calls[0].arguments[0],
      'TOXIC OVERLOAD!'
    )
  })

  test('Toxic Mode applies 4x score multiplier', () => {
    gameStateRef.current.isToxicMode = true
    gameStateRef.current.health = 50

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleHit(0)
    })

    // (100 base + 0 combo) * 4 = 400
    assert.equal(gameStateRef.current.score, 400)
    // Health regen in Toxic Mode is 1 instead of 2. 50 + 1 = 51
    assert.equal(gameStateRef.current.health, 51)
  })

  test('Real miss deactivates Toxic Mode', () => {
    gameStateRef.current.isToxicMode = true

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleMiss(1, false) // Real miss
    })

    assert.equal(gameStateRef.current.isToxicMode, false)
    assert.equal(setters.setIsToxicMode.mock.calls[0].arguments[0], false)
    assert.equal(
      contextActions.addToast.mock.calls[0].arguments[0],
      'TOXIC MODE LOST!'
    )
  })

  test('Empty hit does not deactivate Toxic Mode', () => {
    gameStateRef.current.isToxicMode = true

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleMiss(1, true) // Empty hit
    })

    assert.equal(gameStateRef.current.isToxicMode, true)
    // setIsToxicMode should not have been called with false
    const calls = setters.setIsToxicMode.mock.calls.filter(
      c => c.arguments[0] === false
    )
    assert.equal(calls.length, 0)
  })

  test('Guestlist modifier increases score', () => {
    gameStateRef.current.modifiers = { guestlist: true }

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleHit(0)
    })

    // 100 * 1.2 = 120
    assert.equal(gameStateRef.current.score, 120)
  })

  test('Perfektionist trait applies bonus score at high accuracy', () => {
    gameStateRef.current.modifiers = { hasPerfektionist: true }
    // Mock accuracy calculation to return high accuracy
    mockGigStats.calculateAccuracy.mock.mockImplementation(() => 90)

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleHit(0)
    })

    // 100 * 1.15 = 114.999... -> 114 (Math.floor)
    assert.equal(gameStateRef.current.score, 114)
  })

  test('Perfektionist trait does not apply bonus score at low accuracy', () => {
    gameStateRef.current.modifiers = { hasPerfektionist: true }
    // Mock accuracy calculation to return low accuracy
    mockGigStats.calculateAccuracy.mock.mockImplementation(() => 80)

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleHit(0)
    })

    assert.equal(gameStateRef.current.score, 100)
  })

  test('Overload increases on hit and triggers Toxic Mode when full', () => {
    gameStateRef.current.overload = 96

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        performance: {},
        contextActions
      })
    )

    act(() => {
      result.current.handleHit(0)
    })

    // Hit adds 4 overload. 96 + 4 = 100. Should trigger Toxic Mode.
    assert.equal(gameStateRef.current.isToxicMode, true)
    assert.equal(gameStateRef.current.overload, 0) // Reset to 0
    assert.equal(
      contextActions.addToast.mock.calls[0].arguments[0],
      'TOXIC OVERLOAD!'
    )
  })
})
