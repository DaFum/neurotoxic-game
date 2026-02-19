import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicDependencies,
  setupRhythmGameLogicTest,
  createMockChangeScene,
  createMockSetLastGigStats
} from './useRhythmGameLogicTestUtils.js'

const {
  mockUseGameState,
  mockAudioManager,
  mockAudioEngine,
  mockRhythmUtils
} = mockRhythmGameLogicDependencies

// We need to setup the test module ONCE per file usually, or re-import if needed.
// But here we can use the one from the utils if we configure mocks before rendering.
const { useRhythmGameLogic } = await setupRhythmGameLogicTest()

describe('useRhythmGameLogic Multi-Song Support', () => {
  let mockChangeScene
  let mockSetLastGigStats

  beforeEach(() => {
    // Reset mocks manually since we aren't using the utility's resetAllMocks fully
    mockUseGameState.mock.resetCalls()
    mockAudioEngine.startGigPlayback.mock.resetCalls()
    mockAudioEngine.hasAudioAsset.mock.resetCalls()
    mockRhythmUtils.parseSongNotes.mock.resetCalls()

    mockChangeScene = createMockChangeScene()
    mockSetLastGigStats = createMockSetLastGigStats()

    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initializes audio and notes for multiple songs in sequence', async () => {
    // Setup 2 songs in setlist
    const song1 = {
      id: 'song1',
      name: 'Song 1',
      bpm: 120,
      duration: 60, // Dummy
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
      notes: [{ time: 500, type: 'note', lane: 1 }], // relative to song start
      sourceOgg: 'song2.ogg'
    }

    // Default mock implementation for this test with STABLE reference
    const mockState = {
      setlist: [song1, song2],
      band: { members: [], harmony: 100 },
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

    // Mock hasAudioAsset to return true
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)

    // Mock parseSongNotes
    mockRhythmUtils.parseSongNotes.mock.mockImplementation((song, leadIn) => {
        return (song.notes || []).map(n => ({ ...n, time: n.time + (leadIn || 0) }))
    })

    // Capture onEnded
    let onSong1Ended = null
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async ({ onEnded }) => {
      onSong1Ended = onEnded
      return true
    })
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)

    const { result } = renderHook(() => useRhythmGameLogic())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Assertions

    // 1. Check if startGigPlayback was called for Song 1
    const playbackCalls = mockAudioEngine.startGigPlayback.mock.calls
    assert.strictEqual(playbackCalls.length, 1, 'Should call startGigPlayback once initially')

    const call1Args = playbackCalls[0].arguments[0]
    assert.strictEqual(call1Args.filename, 'song1.ogg')

    // Verify Song 1 notes are loaded
    let finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1, 'Should have notes for Song 1')
    assert.strictEqual(finalNotes[0].time, 1000 + 100, 'Song 1 note time should include lead-in (100ms)')

    // 2. Trigger Song 1 End
    assert.ok(onSong1Ended, 'onEnded callback should be captured')

    await act(async () => {
       onSong1Ended()
       await new Promise(resolve => setTimeout(resolve, 50))
    })

    // 3. Check if startGigPlayback was called for Song 2
    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 2, 'Should call startGigPlayback again for Song 2')

    const call2Args = mockAudioEngine.startGigPlayback.mock.calls[1].arguments[0]
    assert.strictEqual(call2Args.filename, 'song2.ogg')

    // Verify Song 2 notes are loaded (and replaced Song 1 notes)
    finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1, 'Should have notes for Song 2')
    assert.strictEqual(finalNotes[0].time, 500 + 100, 'Song 2 note time should be relative to Song 2 start + lead-in')
    assert.strictEqual(finalNotes[0].lane, 1)
  })
})
