import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

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

export const mockRhythmGameLogicDependencies = {
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
}

// Helper to mock modules
export const mockRhythmGameLogicModules = () => {
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
}

export const setupRhythmGameLogicTest = async () => {
  mockRhythmGameLogicModules()
  const { useRhythmGameLogic } = await import(
    '../src/hooks/useRhythmGameLogic.js'
  )
  return { useRhythmGameLogic }
}

export const createMockChangeScene = () => mock.fn()
export const createMockSetLastGigStats = () => mock.fn()

export const setupDefaultMockImplementation = (
  mockChangeScene,
  mockSetLastGigStats
) => {
  mockUseGameState.mock.mockImplementation(() => ({
    setlist: ['jam'],
    band: { members: [] },
    activeEvent: null,
    hasUpgrade: mock.fn(() => false),
    setLastGigStats: mockSetLastGigStats,
    addToast: mock.fn(),
    gameMap: { nodes: { node1: { layer: 0 } } },
    player: { currentNodeId: 'node1' },
    changeScene: mockChangeScene,
    gigModifiers: {}
  }))

  mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)
  mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)
  mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)
}
