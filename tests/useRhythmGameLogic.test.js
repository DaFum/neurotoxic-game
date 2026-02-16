import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { JSDOM } from 'jsdom'

// Mocks
const mockUseGameState = mock.fn()
const mockSimulationUtils = {
  calculateGigPhysics: mock.fn(() => ({
    speedModifier: 1,
    hitWindows: { guitar: 100, drums: 100, bass: 100 }
  })),
  getGigModifiers: mock.fn(() => ({}))
}
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
  getGigTimeMs: mock.fn(() => 0)
}
const mockAudioTimingUtils = {
  getScheduledHitTimeMs: mock.fn(() => 0)
}
const mockGigStats = {
  buildGigStatsSnapshot: mock.fn(() => ({})),
  updateGigPerformanceStats: mock.fn(stats => stats)
}
const mockRhythmUtils = {
  generateNotesForSong: mock.fn(() => []),
  parseSongNotes: mock.fn(() => []),
  checkHit: mock.fn(() => null)
}
const mockHecklerLogic = {
  updateProjectiles: mock.fn(p => p),
  trySpawnProjectile: mock.fn(() => null),
  checkCollisions: mock.fn(p => p)
}
const mockErrorHandler = {
  handleError: mock.fn(),
  AudioError: class AudioError extends Error {}
}
const mockLogger = {
  info: mock.fn(),
  warn: mock.fn(),
  error: mock.fn()
}
const mockSongs = [
  { id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }
]

// Mock modules
mock.module('../src/context/GameState.jsx', {
  namedExports: { useGameState: mockUseGameState }
})
mock.module('../src/utils/simulationUtils.js', {
  namedExports: mockSimulationUtils
})
mock.module('../src/utils/AudioManager.js', {
  namedExports: { audioManager: mockAudioManager }
})
mock.module('../src/utils/audioEngine.js', {
  namedExports: mockAudioEngine
})
mock.module('../src/utils/audioTimingUtils.js', {
  namedExports: mockAudioTimingUtils
})
mock.module('../src/utils/gigStats.js', {
  namedExports: mockGigStats
})
mock.module('../src/utils/rhythmUtils.js', {
  namedExports: mockRhythmUtils
})
mock.module('../src/utils/hecklerLogic.js', {
  namedExports: mockHecklerLogic
})
mock.module('../src/utils/errorHandler.js', {
  namedExports: mockErrorHandler
})
mock.module('../src/utils/logger.js', {
  namedExports: { logger: mockLogger }
})
mock.module('../src/data/songs.js', {
  namedExports: { SONGS_DB: mockSongs }
})

// Dynamically import the hook after mocking
const { useRhythmGameLogic } = await import(
  '../src/hooks/useRhythmGameLogic.js'
)

describe('useRhythmGameLogic', () => {
  let dom
  let originalGlobalDescriptors

  beforeEach(() => {
    // Reset mocks
    mockUseGameState.mock.resetCalls()
    mockRhythmUtils.checkHit.mock.resetCalls()
    mockRhythmUtils.generateNotesForSong.mock.resetCalls()
    mockRhythmUtils.parseSongNotes.mock.resetCalls()
    mockAudioManager.stopMusic.mock.resetCalls()
    mockAudioManager.playSFX.mock.resetCalls()
    mockGigStats.buildGigStatsSnapshot.mock.resetCalls()
    mockGigStats.updateGigPerformanceStats.mock.resetCalls()
    mockErrorHandler.handleError.mock.resetCalls()

    mockUseGameState.mock.mockImplementation(() => ({
      setlist: ['jam'],
      band: { members: [] },
      activeEvent: null,
      hasUpgrade: mock.fn(() => false),
      setLastGigStats: mock.fn(),
      addToast: mock.fn(),
      gameMap: { nodes: { node1: { layer: 0 } } },
      player: { currentNodeId: 'node1' },
      changeScene: mock.fn(),
      gigModifiers: {}
    }))

    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )

    // JSDOM setup
    originalGlobalDescriptors = new Map(
      ['window', 'document', 'navigator'].map(key => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key)
      ])
    )
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost'
    })
    for (const [key, value] of [
      ['window', dom.window],
      ['document', dom.window.document],
      ['navigator', dom.window.navigator]
    ]) {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true
      })
    }

    // Polyfill requestAnimationFrame for React
    globalThis.requestAnimationFrame = callback => setTimeout(callback, 0)
    globalThis.cancelAnimationFrame = id => clearTimeout(id)
  })

  afterEach(() => {
    cleanup()
    if (dom) {
      dom.window.close()
    }
    for (const key of ['window', 'document', 'navigator']) {
      const descriptor = originalGlobalDescriptors?.get(key)
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor)
      } else {
        delete globalThis[key]
      }
    }
    originalGlobalDescriptors = null
    dom = null
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
    const { result } = renderHook(() => useRhythmGameLogic())

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
})
