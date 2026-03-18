import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicModules,
  resetAllMocks,
  mockRhythmGameLogicDependencies
} from './useRhythmGameLogicTestUtils.js'

const { mockAudioEngine, mockGigStats, mockRhythmUtils } =
  mockRhythmGameLogicDependencies

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

  // Parametrized: handleHit valid hits with different multipliers
  const handleHitValidVariants = [
    {
      label: 'updates score and combo on valid hit [no multiplier]',
      performance: {},
      laneIndex: 0,
      expectedScore: 100,
      expectedCombo: 1,
      expectedPerfectHits: 1
    },
    {
      label: 'applies lane multipliers [drumMultiplier: 1.5]',
      performance: { drumMultiplier: 1.5 },
      laneIndex: 1,
      expectedScore: 150,
      expectedCombo: 1,
      expectedPerfectHits: 1
    }
  ]

  handleHitValidVariants.forEach(variant => {
    test(`handleHit ${variant.label}`, () => {
      const { result } = renderHook(() =>
        useRhythmGameScoring({
          gameStateRef,
          setters,
          performance: variant.performance,
          contextActions
        })
      )

      let hitResult
      act(() => {
        hitResult = result.current.handleHit(variant.laneIndex)
      })

      assert.equal(hitResult, true, 'Should return true on valid hit')
      assert.equal(
        gameStateRef.current.score,
        variant.expectedScore,
        `Score should be ${variant.expectedScore}`
      )
      assert.equal(
        gameStateRef.current.combo,
        variant.expectedCombo,
        'Combo should increment'
      )
      assert.equal(
        gameStateRef.current.stats.perfectHits,
        variant.expectedPerfectHits,
        'Perfect hits should increment'
      )
    })
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
      'ui:gig.toasts.bandCollapsed'
    )
  })

  test('handleMiss triggers game over timeout toast', () => {
    mock.timers.enable({ apis: ['setTimeout'] })

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

    assert.equal(gameStateRef.current.isGameOver, true)

    // Clear the initial mock calls for addToast from "BAND COLLAPSED"
    contextActions.addToast.mock.resetCalls()

    act(() => {
      mock.timers.tick(4000)
    })

    assert.equal(
      contextActions.addToast.mock.calls[0].arguments[0],
      'ui:gig.toasts.gigFailed'
    )
    assert.equal(contextActions.setLastGigStats.mock.calls.length, 1)
    assert.equal(contextActions.endGig.mock.calls.length, 1)

    mock.timers.reset()
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
      'ui:gig.toasts.toxicOverload'
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

  // Parametrized: Toxic Mode deactivation on miss
  const toxicMissVariants = [
    {
      label: 'deactivates on real miss',
      isEmptyHit: false,
      shouldDeactivate: true,
      expectedToast: 'ui:gig.toasts.toxicModeLost'
    },
    {
      label: 'does not deactivate on empty hit',
      isEmptyHit: true,
      shouldDeactivate: false
    }
  ]

  toxicMissVariants.forEach(variant => {
    test(`Toxic Mode ${variant.label}`, () => {
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
        result.current.handleMiss(1, variant.isEmptyHit)
      })

      assert.equal(
        gameStateRef.current.isToxicMode,
        !variant.shouldDeactivate,
        `Toxic Mode should be ${!variant.shouldDeactivate}`
      )

      if (variant.shouldDeactivate) {
        assert.equal(setters.setIsToxicMode.mock.calls[0].arguments[0], false)
        assert.equal(
          contextActions.addToast.mock.calls[0].arguments[0],
          variant.expectedToast
        )
      } else {
        const calls = setters.setIsToxicMode.mock.calls.filter(
          c => c.arguments[0] === false
        )
        assert.equal(
          calls.length,
          0,
          'Should not deactivate Toxic Mode on empty hit'
        )
      }
    })
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

  // Parametrized: Perfektionist trait score variations
  const perfektionistVariants = [
    {
      label: 'applies bonus score at high accuracy [90%]',
      accuracy: 90,
      expectedScore: 114
    },
    {
      label: 'does not apply bonus score at boundary (exclusive) [85%]',
      accuracy: 85,
      expectedScore: 100
    },
    {
      label: 'applies bonus score just above boundary [86%]',
      accuracy: 86,
      expectedScore: 114
    },
    {
      label: 'does not apply bonus score at low accuracy [80%]',
      accuracy: 80,
      expectedScore: 100
    }
  ]

  perfektionistVariants.forEach(variant => {
    test(`Perfektionist trait ${variant.label}`, () => {
      gameStateRef.current.modifiers = { hasPerfektionist: true }
      mockGigStats.calculateAccuracy.mock.mockImplementation(
        () => variant.accuracy
      )

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

      assert.equal(
        gameStateRef.current.score,
        variant.expectedScore,
        `Score should be ${variant.expectedScore} at ${variant.accuracy}% accuracy`
      )
    })
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
      'ui:gig.toasts.toxicOverload'
    )
  })
})
