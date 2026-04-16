import {
  test,
  describe,
  before,
  after,
  beforeEach,
  afterEach,
  mock
} from 'node:test'
import assert from 'node:assert/strict'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'
import {
  createMockChangeScene,
  createMockSetLastGigStats
} from '../useRhythmGameLogicTestUtils'

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
  getPlayRequestId: mock.fn(() => 1),
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
mock.module('../../src/context/GameState.tsx', {
  namedExports: { useGameState: mockUseGameState }
})
mock.module('../../src/utils/AudioManager', {
  namedExports: { audioManager: mockAudioManager }
})
mock.module('../../src/utils/audioEngine', {
  namedExports: mockAudioEngine
})
mock.module('../../src/utils/rhythmUtils', {
  namedExports: mockRhythmUtils
})
mock.module('../../src/utils/gigStats', {
  namedExports: mockGigStats
})
// Mock other deps to avoid side effects
mock.module('../../src/utils/simulationUtils', {
  namedExports: {
    calculateGigPhysics: mock.fn(() => ({
      speedModifier: 1,
      hitWindows: { guitar: 100, drums: 100, bass: 100 },
      multipliers: { guitar: 1, drums: 1, bass: 1 }
    })),
    getGigModifiers: mock.fn(() => ({}))
  }
})
mock.module('../../src/utils/hecklerLogic', {
  namedExports: {
    createHecklerSession: mock.fn(() => ({ pool: [], nextId: 0 })),
    processProjectiles: mock.fn(
      (session, projectiles, deltaMS, screenHeight, onHit) => {
        const hitY = screenHeight - 150
        const despawnY = screenHeight + 100
        let writeIdx = 0

        projectiles.forEach(p => {
          if (p.vy !== undefined) p.y += p.vy * deltaMS

          const hit = Boolean(onHit && p.y > hitY && p.y < despawnY)
          if (hit) onHit(p)

          if (!hit && p.y < despawnY) {
            projectiles[writeIdx++] = p
          }
        })

        projectiles.length = writeIdx
        return projectiles
      }
    ),
    trySpawnProjectile: mock.fn(() => null)
  }
})
const _GameError = class GameError extends Error {}
mock.module('../../src/utils/errorHandler', {
  namedExports: {
    handleError: mock.fn(),
    GameError: _GameError,
    AudioError: class AudioError extends _GameError {},
    StateError: class StateError extends _GameError {}
  }
})
mock.module('../../src/utils/logger', {
  namedExports: {
    LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 },
    logger: {
      debug: mock.fn(),
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn()
    }
  }
})
mock.module('../../src/data/songs', {
  namedExports: { SONGS_BY_ID: new Map([].map(s => [s.id, s])), SONGS_DB: [] }
})
// Stable i18n object prevents initializeGigState from being recreated on each render.
// Supports defaultValue and basic string interpolation with {{key}} syntax.
const _stableI18n = {
  t: (key, options) => {
    const template = options?.defaultValue || key
    return options
      ? template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
          String(options[token] ?? `{{${token}}}`)
        )
      : template
  },
  i18n: { language: 'en' }
}
mock.module('react-i18next', {
  namedExports: {
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useTranslation: () => _stableI18n,
    Trans: ({ i18nKey }) => i18nKey,
    initReactI18next: { type: '3rdParty', init: () => {} }
  }
})

const rhythmGameLogicModule = await import('../../src/hooks/useRhythmGameLogic')
const rhythmGameLogicHook = rhythmGameLogicModule.useRhythmGameLogic

describe('useRhythmGameLogic Multi-Song Support', () => {
  let mockChangeScene
  let mockSetLastGigStats
  let mockEndGig

  const flushPromises = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }

  before(() => {
    setupJSDOM()
  })

  after(() => {
    teardownJSDOM()
  })

  beforeEach(() => {
    // Reset calls and implementations
    mockUseGameState.mock.resetCalls()
    Object.values(mockAudioManager).forEach(m => {
      if (m.mock) {
        m.mock.resetCalls()
        m.mock.restore()
      }
    })
    Object.values(mockAudioEngine).forEach(m => {
      if (m.mock) {
        m.mock.resetCalls()
        m.mock.restore()
      }
    })
    Object.values(mockRhythmUtils).forEach(m => {
      if (m.mock) {
        m.mock.resetCalls()
        m.mock.restore()
      }
    })
    Object.values(mockGigStats).forEach(m => {
      if (m.mock) {
        m.mock.resetCalls()
        m.mock.restore()
      }
    })

    mockChangeScene = createMockChangeScene()
    mockSetLastGigStats = createMockSetLastGigStats()
    mockEndGig = mock.fn(() => mockChangeScene('POSTGIG'))
  })

  afterEach(() => {
    cleanup()
  })

  test('bootstraps first song and notes correctly', async () => {
    const song1 = {
      id: 'song1',
      name: 'Song 1',
      bpm: 120,
      duration: 60,
      excerptDurationMs: 30000,
      notes: [{ time: 1000, type: 'note', lane: 0 }],
      sourceOgg: 'song1.ogg'
    }

    const mockState = {
      setlist: [song1],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      addToast: () => {},
      gameMap: { nodes: { node1: { layer: 0 } } },
      player: { currentNodeId: 'node1', money: 0 },
      changeScene: mockChangeScene,
      gigModifiers: {},
      endGig: mockEndGig
    }
    mockUseGameState.mock.mockImplementation(() => mockState)

    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockRhythmUtils.parseSongNotes.mock.mockImplementation((song, leadIn) => {
      return (song.notes || []).map(n => ({
        ...n,
        time: n.time + (leadIn || 0)
      }))
    })

    mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)

    const { result } = renderHook(() => rhythmGameLogicHook())

    await act(async () => {
      await flushPromises()
    })

    const playbackCalls = mockAudioEngine.startGigPlayback.mock.calls
    assert.strictEqual(
      playbackCalls.length,
      1,
      'Should call startGigPlayback once initially'
    )
    const call1Args = playbackCalls[0].arguments[0]
    assert.strictEqual(call1Args.filename, 'song1.ogg')

    let finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1)
    assert.strictEqual(finalNotes[0].time, 1100) // 1000 + 100 leadIn
  })

  test('chains from song 1 to song 2 on onEnded', async () => {
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
      gigModifiers: {},
      endGig: mockEndGig
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
    mockAudioEngine.startGigPlayback.mock.mockImplementation(
      async ({ onEnded }) => {
        onSong1Ended = onEnded
        return true
      }
    )
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)

    const { result } = renderHook(() => rhythmGameLogicHook())

    await act(async () => {
      await flushPromises()
    })

    // Simulate song 1 end
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 30001)
    assert.ok(onSong1Ended)

    await act(async () => {
      const promise = onSong1Ended()
      await promise
      await flushPromises()
    })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 2)
    const call2Args =
      mockAudioEngine.startGigPlayback.mock.calls[1].arguments[0]
    assert.strictEqual(call2Args.filename, 'song2.ogg')

    let finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1)
    assert.strictEqual(finalNotes[0].time, 600) // 500 + 100
  })

  test('marks setlistCompleted and ends gig after final song', async () => {
    const song1 = {
      id: 'song1',
      name: 'Song 1',
      bpm: 120,
      duration: 60,
      excerptDurationMs: 30000,
      notes: [{ time: 1000, type: 'note', lane: 0 }],
      sourceOgg: 'song1.ogg'
    }

    const mockState = {
      setlist: [song1],
      band: { members: [], harmony: 100, performance: {} },
      activeEvent: null,
      hasUpgrade: () => false,
      setLastGigStats: mockSetLastGigStats,
      addToast: () => {},
      gameMap: { nodes: { node1: { layer: 0 } } },
      player: { currentNodeId: 'node1', money: 0 },
      changeScene: mockChangeScene,
      gigModifiers: {},
      endGig: mockEndGig
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )

    let onSong1Ended = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(
      async ({ onEnded }) => {
        onSong1Ended = onEnded
        return true
      }
    )

    const { result } = renderHook(() => rhythmGameLogicHook())

    await act(async () => {
      await flushPromises()
    })

    assert.ok(onSong1Ended, 'onSong1Ended should be a function')
    mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')

    await act(async () => {
      await onSong1Ended()
      await flushPromises()
    })

    assert.strictEqual(
      result.current.gameStateRef.current.setlistCompleted,
      true
    )

    act(() => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
      result.current.gameStateRef.current.setlistCompleted = true
      result.current.gameStateRef.current.totalDuration = 1000
      mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 2000)
      result.current.update(16)
    })
    // Now endGig is called, which calls changeScene('POSTGIG')
    assert.ok(mockEndGig.mock.calls.length > 0)
  })

  test('Quit logic does not trigger multi-song chaining', async () => {
    const song1 = {
      id: 'song1',
      name: 'S1',
      bpm: 120,
      duration: 60,
      sourceOgg: 's1.ogg'
    }
    const song2 = {
      id: 'song2',
      name: 'S2',
      bpm: 120,
      duration: 60,
      sourceOgg: 's2.ogg'
    }

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
      changeScene: mockChangeScene,
      endGig: mockEndGig
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )

    let onSong1Ended = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(
      async ({ onEnded }) => {
        onSong1Ended = onEnded
        return true
      }
    )

    const { result } = renderHook(() => rhythmGameLogicHook())
    await act(async () => {
      await flushPromises()
    })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)

    act(() => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'stopped')
      result.current.gameStateRef.current.hasSubmittedResults = true
    })

    await act(async () => {
      await onSong1Ended()
      await flushPromises()
    })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)
  })

  test('does not force a default excerpt duration when metadata is missing', async () => {
    const song = {
      id: 's1',
      name: 'S1',
      bpm: 120,
      duration: 60,
      sourceOgg: 's1.ogg'
    }
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
      changeScene: mockChangeScene,
      endGig: mockEndGig
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)

    renderHook(() => rhythmGameLogicHook())
    await act(async () => {
      await flushPromises()
    })

    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)
    const args = mockAudioEngine.startGigPlayback.mock.calls[0].arguments[0]
    assert.strictEqual(args.durationMs, null)
  })

  test('Game loop waits for setlistCompleted signal', async () => {
    const song = {
      id: 's1',
      name: 'S1',
      bpm: 120,
      duration: 60,
      sourceOgg: 's1.ogg'
    }
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
      changeScene: mockChangeScene,
      endGig: mockEndGig
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)

    const { result } = renderHook(() => rhythmGameLogicHook())
    await act(async () => {
      await flushPromises()
    })

    mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
    result.current.gameStateRef.current.setlistCompleted = false
    result.current.gameStateRef.current.totalDuration = 100
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 200)

    act(() => {
      result.current.update(16)
    })
    assert.strictEqual(mockChangeScene.mock.calls.length, 0)

    // Directly mutating internal ref to simulate the callback effect of audio ending
    result.current.gameStateRef.current.setlistCompleted = true
    act(() => {
      result.current.update(16)
    })

    // endGig is called, which triggers changeScene
    assert.strictEqual(
      mockEndGig.mock.calls.length,
      1,
      'Should call endGig exactly once'
    )
    assert.strictEqual(
      mockChangeScene.mock.calls.length,
      1,
      'Should call changeScene exactly once'
    )
    assert.strictEqual(
      mockChangeScene.mock.calls[0].arguments[0],
      GAME_PHASES.POST_GIG,
      'Should transition to POSTGIG'
    )
  })

  test('totalDuration snap: no change when getGigTimeMs returns NaN', async () => {
    const song = {
      id: 's1',
      name: 'S1',
      bpm: 120,
      duration: 60,
      sourceOgg: 's1.ogg'
    }
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
      changeScene: mockChangeScene,
      endGig: mockEndGig
    }
    mockUseGameState.mock.mockImplementation(() => mockState)
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(
      async () => true
    )

    let capturedOnEnded = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(
      async ({ onEnded }) => {
        capturedOnEnded = onEnded
        return true
      }
    )
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 0)

    const { result } = renderHook(() => rhythmGameLogicHook())
    await act(async () => {
      await flushPromises()
    })

    const durationBefore = result.current.gameStateRef.current.totalDuration
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => NaN)

    assert.ok(capturedOnEnded, 'capturedOnEnded should be defined')
    await act(async () => {
      await capturedOnEnded()
      await flushPromises()
    })

    assert.strictEqual(
      result.current.gameStateRef.current.totalDuration,
      durationBefore
    )
  })
})
