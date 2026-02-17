import { mock } from 'node:test'

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
  AudioError: class AudioError extends Error {
    constructor(message, context = {}) {
      super(message)
      this.name = 'AudioError'
      this.category = 'audio'
      this.severity = 'medium'
      this.context = context
      this.recoverable = true
    }
  }
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
  const { useRhythmGameLogic } =
    await import('../src/hooks/useRhythmGameLogic.js')
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
    player: { currentNodeId: 'node1', money: 0 },
    changeScene: mockChangeScene,
    gigModifiers: {}
  }))

  mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)
  mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)
  mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)
}

export const simulateGameLoopUpdate = (result, overrides = {}) => {
  result.current.gameStateRef.current.running = true
  Object.assign(result.current.gameStateRef.current, overrides)
  result.current.update(16)
}

export const resetAllMocks = (
  dependencies = mockRhythmGameLogicDependencies
) => {
  Object.values(dependencies).forEach(dep => {
    // We explicitly reset implementations as well so tests don't leak mockImplementation changes
    if (dep && dep.mock && typeof dep.mock.resetCalls === 'function') {
      dep.mock.resetCalls()
      if (typeof dep.mock.restore === 'function') dep.mock.restore()
    } else if (dep && typeof dep === 'object') {
      Object.values(dep).forEach(prop => {
        if (prop && prop.mock && typeof prop.mock.resetCalls === 'function') {
          prop.mock.resetCalls()
          if (typeof prop.mock.restore === 'function') prop.mock.restore()
        }
      })
    }
  })
}
