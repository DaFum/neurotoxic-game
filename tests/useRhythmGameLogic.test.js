import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicDependencies,
  setupRhythmGameLogicTest,
  createMockChangeScene,
  createMockSetLastGigStats,
  createMockEndGig,
  setupDefaultMockImplementation,
  simulateGameLoopUpdate,
  resetAllMocks
} from './useRhythmGameLogicTestUtils.js'

const ASYNC_INIT_TIMEOUT_MS = 200

const { mockAudioManager, mockAudioEngine, mockRhythmUtils } =
  mockRhythmGameLogicDependencies

const { useRhythmGameLogic } = await setupRhythmGameLogicTest()

describe('useRhythmGameLogic', () => {
  let mockChangeScene
  let mockSetLastGigStats
  let mockEndGig

  beforeEach(() => {
    // Reset mocks
    resetAllMocks()

    mockChangeScene = createMockChangeScene()
    mockSetLastGigStats = createMockSetLastGigStats()
    mockEndGig = createMockEndGig()

    setupDefaultMockImplementation(
      mockChangeScene,
      mockSetLastGigStats,
      mockEndGig
    )

    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  // Helper to init hook and wait
  const initHook = async () => {
    const { result } = renderHook(() => useRhythmGameLogic())
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, ASYNC_INIT_TIMEOUT_MS))
    })
    return result
  }

  test('initial state', async () => {
    const { result } = renderHook(() => useRhythmGameLogic())

    assert.equal(result.current.stats.score, 0)
    assert.equal(result.current.stats.combo, 0)
    assert.equal(result.current.stats.health, 100)
    assert.equal(result.current.stats.isGameOver, false)
    // Audio ready starts as null
    assert.equal(result.current.stats.isAudioReady, null)

    // Check ref initial state
    assert.equal(result.current.gameStateRef.current.hasSubmittedResults, false)
    assert.equal(result.current.gameStateRef.current.score, 0)
  })

  test('initialization runs on mount', async () => {
    renderHook(() => useRhythmGameLogic())

    // Wait for async initialization
    await act(async () => {
      // In a real test environment with proper timers, we would use waitFor
      // Here we use a slightly longer timeout to ensure the promise resolves
      await new Promise(resolve => setTimeout(resolve, ASYNC_INIT_TIMEOUT_MS))
    })

    // Check if initialization ran (>= 1 because unstable dependencies from mockUseGameState might trigger re-runs)
    assert.ok(mockAudioManager.stopMusic.mock.calls.length >= 1)
    assert.ok(mockAudioManager.ensureAudioContext.mock.calls.length >= 1)
  })

  test('handleHit updates score', async () => {
    mockRhythmUtils.checkHit.mock.mockImplementation(() => ({
      hit: false,
      visible: true,
      time: 1000,
      originalNote: { p: 60 }
    }))

    const result = await initHook()

    // Simulate input
    act(() => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
      result.current.actions.registerInput(0, true)
    })

    // Check if score updated
    // 100 points base + combo bonus
    assert.equal(result.current.stats.score, 100)
    assert.equal(result.current.stats.combo, 1)
  })

  test('calls endGig when all notes are processed near song end', async () => {
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 9800)

    const result = await initHook()

    act(() => {
      simulateGameLoopUpdate(result, {
        totalDuration: 10000,
        notes: [
          { time: 200, laneIndex: 0, hit: true, visible: false, type: 'note' }
        ],
        nextMissCheckIndex: 1,
        setlistCompleted: true
      })
    })

    assert.ok(mockAudioEngine.stopAudio.mock.calls.length >= 1)
    assert.ok(mockSetLastGigStats.mock.calls.length >= 1)
    assert.ok(mockEndGig.mock.calls.length >= 1)
  })

  test('calls endGig when audio playback reports ended', async () => {
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 1000)
    mockAudioEngine.startGigPlayback.mock.mockImplementation(
      async ({ onEnded }) => {
        if (typeof onEnded === 'function') {
          // Asynchronous callback to ensure it runs after initialization completes
          setTimeout(onEnded, 0)
        }
        return true
      }
    )

    const result = await initHook()

    act(() => {
      simulateGameLoopUpdate(result, {
        totalDuration: 0,
        setlistCompleted: true
      })
    })

    // Wait for async callback
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    assert.ok(mockEndGig.mock.calls.length >= 1)
  })
})
