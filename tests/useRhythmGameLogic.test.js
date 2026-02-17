import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicDependencies,
  setupRhythmGameLogicTest,
  createMockChangeScene,
  createMockSetLastGigStats,
  setupDefaultMockImplementation,
  simulateGameLoopUpdate
} from './useRhythmGameLogicTestUtils.js'

const {
  mockUseGameState,
  mockAudioManager,
  mockAudioEngine,
  mockGigStats,
  mockRhythmUtils,
  mockErrorHandler,
  mockSimulationUtils,
  mockAudioTimingUtils,
  mockLogger,
  mockHecklerLogic
} = mockRhythmGameLogicDependencies

const { useRhythmGameLogic } = await setupRhythmGameLogicTest()

describe('useRhythmGameLogic', () => {
  let mockChangeScene
  let mockSetLastGigStats

  beforeEach(() => {
    // Reset mocks
    mockUseGameState.mock.resetCalls()
    mockRhythmUtils.checkHit.mock.resetCalls()
    mockRhythmUtils.generateNotesForSong.mock.resetCalls()
    mockRhythmUtils.parseSongNotes.mock.resetCalls()
    mockAudioManager.stopMusic.mock.resetCalls()
    mockAudioManager.playSFX.mock.resetCalls()
    mockAudioEngine.startGigPlayback.mock.resetCalls()
    mockAudioEngine.stopAudio.mock.resetCalls()
    mockAudioEngine.getGigTimeMs.mock.resetCalls()
    mockGigStats.buildGigStatsSnapshot.mock.resetCalls()
    mockGigStats.updateGigPerformanceStats.mock.resetCalls()
    mockErrorHandler.handleError.mock.resetCalls()

    // Add missing resets
    mockSimulationUtils.calculateGigPhysics.mock.resetCalls()
    mockSimulationUtils.getGigModifiers.mock.resetCalls()
    mockAudioTimingUtils.getScheduledHitTimeMs.mock.resetCalls()
    mockLogger.info.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockHecklerLogic.updateProjectiles.mock.resetCalls()
    mockHecklerLogic.trySpawnProjectile.mock.resetCalls()
    mockHecklerLogic.checkCollisions.mock.resetCalls()

    mockChangeScene = createMockChangeScene()
    mockSetLastGigStats = createMockSetLastGigStats()

    setupDefaultMockImplementation(mockChangeScene, mockSetLastGigStats)

    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initial state', async () => {
    const { result } = renderHook(() => useRhythmGameLogic())

    assert.equal(result.current.stats.score, 0)
    assert.equal(result.current.stats.combo, 0)
    assert.equal(result.current.stats.health, 100)
    assert.equal(result.current.stats.isGameOver, false)
    // Audio ready starts as null
    assert.equal(result.current.stats.isAudioReady, null)

    // Check ref initial state
    assert.equal(result.current.gameStateRef.current.running, false)
    assert.equal(result.current.gameStateRef.current.score, 0)
  })

  test('initialization runs on mount', async () => {
    renderHook(() => useRhythmGameLogic())

    // Wait for async initialization
    await act(async () => {
      // In a real test environment with proper timers, we would use waitFor
      // Here we use a slightly longer timeout to ensure the promise resolves
      await new Promise(resolve => setTimeout(resolve, 200))
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

    const { result } = renderHook(() => useRhythmGameLogic())

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Simulate input
    act(() => {
      result.current.gameStateRef.current.running = true
      result.current.actions.registerInput(0, true)
    })

    // Check if score updated
    // 100 points base + combo bonus
    assert.equal(result.current.stats.score, 100)
    assert.equal(result.current.stats.combo, 1)
  })

  test('transitions to POSTGIG when all notes are processed near song end', async () => {
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 9800)

    const { result } = renderHook(() => useRhythmGameLogic())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    act(() => {
      simulateGameLoopUpdate(result, {
        totalDuration: 10000,
        notes: [
          { time: 200, laneIndex: 0, hit: true, visible: false, type: 'note' }
        ],
        nextMissCheckIndex: 1
      })
    })

    assert.ok(mockAudioEngine.stopAudio.mock.calls.length >= 1)
    assert.ok(mockSetLastGigStats.mock.calls.length >= 1)
    assert.ok(
      mockChangeScene.mock.calls.some(call => call.arguments[0] === 'POSTGIG')
    )
  })

  test('transitions to POSTGIG when audio playback reports ended', async () => {
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

    const { result } = renderHook(() => useRhythmGameLogic())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    act(() => {
      simulateGameLoopUpdate(result, {
        totalDuration: 0
      })
    })

    assert.ok(
      mockChangeScene.mock.calls.some(call => call.arguments[0] === 'POSTGIG')
    )
  })

})
