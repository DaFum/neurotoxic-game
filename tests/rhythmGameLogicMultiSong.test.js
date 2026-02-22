import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  createMockChangeScene,
  createMockSetLastGigStats
} from './useRhythmGameLogicTestUtils.js'

// Local mocks to ensure correct intercept
const mockUseGameState = mock.fn()
const mockAudioManager = {
  stopMusic: mock.fn(),
  ensureAudioContext: mock.fn(async () => true),
  playSFX: mock.fn()
}
const mockAudioEngine = {
  startMetalGenerator: mock.fn(),
  playMidiFile: mock.fn(),
  playSongFromData: mock.fn(),
  hasAudioAsset: mock.fn(() => false),
  playNoteAtTime: mock.fn(),
  startGigClock: mock.fn(),
  startGigPlayback: mock.fn(),
  stopAudio: mock.fn(),
  pauseAudio: mock.fn(),
  resumeAudio: mock.fn(),
  getAudioContextTimeSec: mock.fn(() => 0),
  getToneStartTimeSec: mock.fn(() => 0),
  getAudioTimeMs: mock.fn(() => 0),
  getGigTimeMs: mock.fn(() => 0),
  getTransportState: mock.fn(() => 'started')
}
const mockRhythmUtils = {
  generateNotesForSong: mock.fn(() => []),
  parseSongNotes: mock.fn(() => []),
  checkHit: mock.fn(() => null)
}
const mockGigStats = {
  buildGigStatsSnapshot: mock.fn(() => ({})),
  updateGigPerformanceStats: mock.fn(stats => stats),
  calculateAccuracy: mock.fn(() => 100)
}

// Register mocks BEFORE import
mock.module('../src/context/GameState.jsx', {
  namedExports: { useGameState: mockUseGameState }
})
mock.module('../src/utils/AudioManager.js', {
  namedExports: { audioManager: mockAudioManager }
})
mock.module('../src/utils/audioEngine.js', {
  namedExports: mockAudioEngine
})
mock.module('../src/utils/rhythmUtils.js', {
  namedExports: mockRhythmUtils
})
mock.module('../src/utils/gigStats.js', {
  namedExports: mockGigStats
})
// Mock other deps to avoid side effects
mock.module('../src/utils/simulationUtils.js', {
  namedExports: {
    calculateGigPhysics: mock.fn(() => ({
      speedModifier: 1,
      hitWindows: { guitar: 100, drums: 100, bass: 100 },
      multipliers: { guitar: 1, drums: 1, bass: 1 }
    })),
    getGigModifiers: mock.fn(() => ({}))
  }
})
mock.module('../src/utils/hecklerLogic.js', {
  namedExports: {
    updateProjectiles: mock.fn(p => p),
    trySpawnProjectile: mock.fn(() => null),
    checkCollisions: mock.fn(p => p)
  }
})
mock.module('../src/utils/errorHandler.js', {
  namedExports: {
    handleError: mock.fn(),
    AudioError: class extends Error {}
  }
})
mock.module('../src/utils/logger.js', {
  namedExports: { logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() } }
})
mock.module('../src/data/songs.js', {
  namedExports: { SONGS_DB: [] }
})

describe('useRhythmGameLogic Multi-Song Support', () => {
  let useRhythmGameLogic
  let mockChangeScene
  let mockSetLastGigStats

  beforeEach(async () => {
    setupJSDOM()
    // Reset calls
    mockUseGameState.mock.resetCalls()
    Object.values(mockAudioManager).forEach(m => m.mock.resetCalls())
    Object.values(mockAudioEngine).forEach(m => m.mock.resetCalls())
    Object.values(mockRhythmUtils).forEach(m => m.mock.resetCalls())
    Object.values(mockGigStats).forEach(m => m.mock.resetCalls())

    mockChangeScene = createMockChangeScene()
    mockSetLastGigStats = createMockSetLastGigStats()

    // Dynamic import to load the hook with mocks active
    const module = await import('../src/hooks/useRhythmGameLogic.js')
    useRhythmGameLogic = module.useRhythmGameLogic
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initializes audio and notes for multiple songs in sequence', async () => {
    const song1 = {
      id: 'song1',
      name: 'Song 1',
      bpm: 120,
      duration: 60,
      excerptDurationMs: 30000,
      notes: [{ time: 1000, type: 'note', lane: 0 }],
      sourceOgg: 'song1.ogg'
    }
    const song2 = {
      id: 'song2',
      name: 'Song 2',
      bpm: 140,
      duration: 60,
      excerptDurationMs: 40000,
      notes: [{ time: 500, type: 'note', lane: 1 }],
      sourceOgg: 'song2.ogg'
    }

    const mockState = {
      setlist: [song1, song2],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      addToast: () => {},
      gameMap: { nodes: { node1: { layer: 0 } } },
      player: { currentNodeId: 'node1', money: 0 },
      changeScene: mockChangeScene,
      gigModifiers: {}
    }
    mockUseGameState.mock.mockImplementation(() => mockState)

    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockRhythmUtils.parseSongNotes.mock.mockImplementation((song, leadIn) => {
      return (song.notes || []).map(n => ({
        ...n,
        time: n.time + (leadIn || 0)
      }))
    })

    let onSong1Ended = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async ({ onEnded }) => {
      onSong1Ended = onEnded
      return true
    })
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)

    const { result } = renderHook(() => useRhythmGameLogic())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    const playbackCalls = mockAudioEngine.startGigPlayback.mock.calls
    assert.strictEqual(playbackCalls.length, 1, 'Should call startGigPlayback once initially')
    const call1Args = playbackCalls[0].arguments[0]
    assert.strictEqual(call1Args.filename, 'song1.ogg')

    let finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1)
    assert.strictEqual(finalNotes[0].time, 1100) // 1000 + 100 leadIn

    // Simulate song 1 end
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 30001)
    assert.ok(onSong1Ended)

    await act(async () => {
       const promise = onSong1Ended()
       assert.strictEqual(result.current.gameStateRef.current.songTransitioning, true)
       mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
       result.current.gameStateRef.current.setlistCompleted = true
       result.current.update(16)
       assert.strictEqual(mockChangeScene.mock.calls.length, 0)
       await promise
       await new Promise(resolve => setTimeout(resolve, 50))
    })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 2)
    const call2Args = mockAudioEngine.startGigPlayback.mock.calls[1].arguments[0]
    assert.strictEqual(call2Args.filename, 'song2.ogg')

    finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1)
    assert.strictEqual(finalNotes[0].time, 600) // 500 + 100

    const onSong2Ended = mockAudioEngine.startGigPlayback.mock.calls[1].arguments[0].onEnded
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 40001)

    await act(async () => {
        await onSong2Ended()
        await new Promise(resolve => setTimeout(resolve, 50))
    })

    assert.strictEqual(result.current.gameStateRef.current.setlistCompleted, true)
    act(() => {
        result.current.update(16)
    })
    assert.ok(mockChangeScene.mock.calls.length > 0)
  })

  test('Quit logic does not trigger multi-song chaining', async () => {
    const song1 = { id: 'song1', name: 'S1', bpm: 120, duration: 60, sourceOgg: 's1.ogg' }
    const song2 = { id: 'song2', name: 'S2', bpm: 120, duration: 60, sourceOgg: 's2.ogg' }

    const mockState = {
      setlist: [song1, song2],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      gameMap: { nodes: { n1: { layer: 0 } } },
      player: { currentNodeId: 'n1', money: 0 },
      gigModifiers: {},
      addToast: () => {},
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      changeScene: mockChangeScene
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)

    let onSong1Ended = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async ({ onEnded }) => {
      onSong1Ended = onEnded
      return true
    })

    const { result } = renderHook(() => useRhythmGameLogic())
    await act(async () => { await new Promise(r => setTimeout(r, 100)) })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)

    act(() => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'stopped')
      result.current.gameStateRef.current.hasSubmittedResults = true
    })

    await act(async () => {
        await onSong1Ended()
        await new Promise(r => setTimeout(r, 50))
    })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)
  })

  test('does not force a default excerpt duration when metadata is missing', async () => {
    const song = { id: 's1', name: 'S1', bpm: 120, duration: 60, sourceOgg: 's1.ogg' }
    const mockState = {
      setlist: [song],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      gameMap: { nodes: { n1: { layer: 0 } } },
      player: { currentNodeId: 'n1', money: 0 },
      gigModifiers: {},
      addToast: () => {},
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      changeScene: mockChangeScene
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)

    renderHook(() => useRhythmGameLogic())
    await act(async () => { await new Promise(r => setTimeout(r, 100)) })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)
    const args = mockAudioEngine.startGigPlayback.mock.calls[0].arguments[0]
    assert.strictEqual(args.durationMs, null)
  })

  test('Game loop waits for setlistCompleted signal', async () => {
    const song = { id: 's1', name: 'S1', bpm: 120, duration: 60, sourceOgg: 's1.ogg' }
    const mockState = {
      setlist: [song],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      gameMap: { nodes: { n1: { layer: 0 } } },
      player: { currentNodeId: 'n1', money: 0 },
      gigModifiers: {},
      addToast: () => {},
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      changeScene: mockChangeScene
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)

    const { result } = renderHook(() => useRhythmGameLogic())
    await act(async () => { await new Promise(r => setTimeout(r, 100)) })

    mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
    result.current.gameStateRef.current.setlistCompleted = false
    result.current.gameStateRef.current.totalDuration = 100
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 200)

    act(() => { result.current.update(16) })
    assert.strictEqual(mockChangeScene.mock.calls.length, 0)

    // Directly mutating internal ref to simulate the callback effect of audio ending
    // This couples the test to implementation but is necessary as we mock the audio engine internals
    result.current.gameStateRef.current.setlistCompleted = true
    act(() => { result.current.update(16) })
    assert.strictEqual(mockChangeScene.mock.calls.length, 1)
  })

  test('totalDuration snap: no change when getGigTimeMs returns NaN', async () => {
    const song = { id: 's1', name: 'S1', bpm: 120, duration: 60, sourceOgg: 's1.ogg' }
    const mockState = {
      setlist: [song],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      gameMap: { nodes: { n1: { layer: 0 } } },
      player: { currentNodeId: 'n1', money: 0 },
      gigModifiers: {},
      addToast: () => {},
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      changeScene: mockChangeScene
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)

    let capturedOnEnded = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async ({ onEnded }) => {
      capturedOnEnded = onEnded
      return true
    })
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)

    const { result } = renderHook(() => useRhythmGameLogic())
    await act(async () => { await new Promise(r => setTimeout(r, 100)) })

    const durationBefore = result.current.gameStateRef.current.totalDuration
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => NaN)

    assert.ok(capturedOnEnded, 'capturedOnEnded should be defined')
    await act(async () => {
        await capturedOnEnded()
        await new Promise(r => setTimeout(r, 50))
    })

    assert.strictEqual(result.current.gameStateRef.current.totalDuration, durationBefore)
  })
})
