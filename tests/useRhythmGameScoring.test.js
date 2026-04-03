import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicModules,
  resetAllMocks,
  mockRhythmGameLogicDependencies
} from './useRhythmGameLogicTestUtils.js'

const { mockAudioEngine, mockGigStats, mockRhythmUtils } = mockRhythmGameLogicDependencies

const setupRhythmGameScoringTest = async () => {
  mockRhythmGameLogicModules()
  const { useRhythmGameScoring } = await import('../src/hooks/rhythmGame/useRhythmGameScoring.js')
  return { useRhythmGameScoring }
}

const createMockGameState = () => ({
  score: 0, combo: 0, health: 100, overload: 0, isToxicMode: false, isGameOver: false,
  stats: { misses: 0, perfectHits: 0 }, lanes: [{ id: 'l1', hitWindow: 100 }, { id: 'l2', hitWindow: 100 }, { id: 'l3', hitWindow: 100 }],
  modifiers: {}, notes: [], toxicModeEndTime: 0, toxicTimeTotal: 0
})

const createMockSetters = gameStateRef => ({
  setScore: mock.fn(updater => { const next = typeof updater === 'function' ? updater(gameStateRef.current.score) : updater; gameStateRef.current.score = next; return next; }),
  setCombo: mock.fn(updater => { const next = typeof updater === 'function' ? updater(gameStateRef.current.combo) : updater; gameStateRef.current.combo = next; return next; }),
  setHealth: mock.fn(updater => { const next = typeof updater === 'function' ? updater(gameStateRef.current.health) : updater; gameStateRef.current.health = next; return next; }),
  setOverload: mock.fn(updater => { const next = typeof updater === 'function' ? updater(gameStateRef.current.overload) : updater; gameStateRef.current.overload = next; return next; }),
  setIsToxicMode: mock.fn(val => { gameStateRef.current.isToxicMode = val }),
  setIsGameOver: mock.fn(val => { gameStateRef.current.isGameOver = val }),
  setAccuracy: mock.fn()
})

describe('useRhythmGameScoring', async () => {
  let useRhythmGameScoring, gameStateRef, setters, contextActions
  const loaded = await setupRhythmGameScoringTest()
  useRhythmGameScoring = loaded.useRhythmGameScoring

  beforeEach(() => {
    setupJSDOM()
    resetAllMocks()
    gameStateRef = { current: createMockGameState() }
    setters = createMockSetters(gameStateRef)
    contextActions = { addToast: mock.fn(), setLastGigStats: mock.fn(), endGig: mock.fn() }
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 1000)
    mockRhythmUtils.checkHit.mock.mockImplementation(() => ({ hit: false, visible: true, time: 1000, originalNote: { p: 60 } }))
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initializes and handles various hit/miss scenarios efficiently', () => {
    const { result, unmount } = renderHook(() => useRhythmGameScoring({ gameStateRef, setters, performance: { drumMultiplier: 1.5, crowdDecay: 1.0 }, contextActions }))

    // Initialization
    assert.equal(typeof result.current.handleHit, 'function')
    assert.equal(typeof result.current.handleMiss, 'function')

    // Basic valid hit (No multiplier, lane 0)
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.score, 100)
    assert.equal(gameStateRef.current.combo, 1)
    assert.equal(gameStateRef.current.stats.perfectHits, 1)

    // Valid hit with multiplier (Lane 1, drumMultiplier 1.5)
    act(() => { result.current.handleHit(1) })
    assert.equal(gameStateRef.current.score, 260) // 100 + 150 (combo + multiplier)
    assert.equal(gameStateRef.current.combo, 2)

    // Invalid hit (Miss via invalid hit)
    mockRhythmUtils.checkHit.mock.mockImplementationOnce(() => null)
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.combo, 0)
    assert.equal(gameStateRef.current.health, 99) // 100 - 1

    // Handle Miss (real miss)
    gameStateRef.current.combo = 10;
    gameStateRef.current.health = 50;
    act(() => { result.current.handleMiss(1, false) })
    assert.equal(gameStateRef.current.combo, 0)
    assert.equal(gameStateRef.current.health, 48) // 50 - 2 (decay)

    // Game Over via health depletion
    gameStateRef.current.health = 1;
    act(() => { result.current.handleMiss(1, false) })
    assert.equal(gameStateRef.current.health, 0)
    assert.equal(gameStateRef.current.isGameOver, true)

    unmount()
  })

  test('handles toxic mode activation, scoring, and deactivation', () => {
    const { result, unmount } = renderHook(() => useRhythmGameScoring({ gameStateRef, setters, performance: {}, contextActions }))

    // Manual activation
    act(() => { result.current.activateToxicMode() })
    assert.equal(gameStateRef.current.isToxicMode, true)

    // Toxic scoring
    gameStateRef.current.health = 50;
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.score, 400) // 100 * 4
    assert.equal(gameStateRef.current.health, 51) // +1 instead of +2

    // Does not deactivate on empty miss
    act(() => { result.current.handleMiss(1, true) })
    assert.equal(gameStateRef.current.isToxicMode, true)

    // Deactivates on real miss
    act(() => { result.current.handleMiss(1, false) })
    assert.equal(gameStateRef.current.isToxicMode, false)
    assert.equal(contextActions.addToast.mock.calls[1].arguments[0], 'ui:gig.toasts.toxicModeLost')

    // Auto-trigger on overload
    gameStateRef.current.overload = 96
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.isToxicMode, true)
    assert.equal(gameStateRef.current.overload, 0)

    unmount()
  })

  test('applies game modifiers correctly (Guestlist, Perfektionist)', () => {
    // We combine the guestlist and perfektionist trait variations into one sequential test
    const { result, unmount, rerender } = renderHook(() => useRhythmGameScoring({ gameStateRef, setters, performance: {}, contextActions }))

    // Guestlist
    gameStateRef.current.modifiers = { guestlist: true }
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.score, 120) // 100 * 1.2

    // Reset
    gameStateRef.current.score = 0;
    gameStateRef.current.combo = 0;
    gameStateRef.current.modifiers = {};
    gameStateRef.current.modifiers = {};

    // Perfektionist (Bonus)
    gameStateRef.current.modifiers = { hasPerfektionist: true, guestlist: false }
    mockGigStats.calculateAccuracy.mock.mockImplementationOnce(() => 90)
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.score, 114)

    gameStateRef.current.score = 0;
    gameStateRef.current.combo = 0;
    gameStateRef.current.modifiers = {};
    gameStateRef.current.modifiers = {};

    // Perfektionist (No Bonus)
    mockGigStats.calculateAccuracy.mock.mockImplementationOnce(() => 80)
    act(() => { result.current.handleHit(0) })
    assert.equal(gameStateRef.current.score, 100)

    unmount()
  })

  test('handleMiss triggers game over timeout toast', () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    gameStateRef.current.health = 1
    const { result, unmount } = renderHook(() => useRhythmGameScoring({ gameStateRef, setters, performance: {}, contextActions }))

    act(() => { result.current.handleMiss(1, false) })
    assert.equal(gameStateRef.current.isGameOver, true)

    contextActions.addToast.mock.resetCalls()
    act(() => { mock.timers.tick(4000) })
    assert.equal(contextActions.addToast.mock.calls[0].arguments[0], 'ui:gig.toasts.gigFailed')
    assert.equal(contextActions.setLastGigStats.mock.calls.length, 1)
    assert.equal(contextActions.endGig.mock.calls.length, 1)

    mock.timers.reset()
    unmount()
  })
})
