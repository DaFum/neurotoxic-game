import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockRhythmGameLogicDependencies,
  setupRhythmGameLogicTest,
  createMockChangeScene,
  createMockSetLastGigStats,
  resetAllMocks
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
    // Reset all mocks using the shared utility to avoid leakage
    resetAllMocks()

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
      return (song.notes || []).map(n => ({
        ...n,
        time: n.time + (leadIn || 0)
      }))
    })

    // Capture onEnded
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

    // Verify transitioning flag is FALSE during playback
    assert.strictEqual(result.current.gameStateRef.current.songTransitioning, false, 'Transitioning flag should be false during playback')

    // 2. Simulate Game Loop for Song 1 End
    // Simulate that song 1 duration has been reached
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 30001) // > 30000ms

    assert.ok(onSong1Ended, 'onEnded callback should be captured')

    // Trigger Song 1 End - this starts transition
    await act(async () => {
       // We invoke this synchronously as the AudioEngine would
       const promise = onSong1Ended()

       // Immediately check if transitioning flag is TRUE
       assert.strictEqual(result.current.gameStateRef.current.songTransitioning, true, 'Transitioning flag should be TRUE immediately inside onEnded')

       // Verify notes are cleared during transition
       assert.strictEqual(result.current.gameStateRef.current.notes.length, 0, 'Notes should be cleared at start of transition')

       // Now simulate a game loop update concurrently (as if rAF fired)
       // This update should NOT finalize gig because transitioning is true
       mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
       // Force condition where it WOULD finalize if not protected
       result.current.gameStateRef.current.setlistCompleted = true
       result.current.update(16)

       assert.strictEqual(mockChangeScene.mock.calls.length, 0, 'Should NOT finalize gig during transition')

       // Wait for the async transition to complete
       await promise
       await new Promise(resolve => setTimeout(resolve, 50))
    })

    // 3. Check if startGigPlayback was called for Song 2
    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 2, 'Should call startGigPlayback again for Song 2')

    const call2Args = mockAudioEngine.startGigPlayback.mock.calls[1].arguments[0]
    assert.strictEqual(call2Args.filename, 'song2.ogg')

    // Verify Transition flag is reset
    assert.strictEqual(result.current.gameStateRef.current.songTransitioning, false, 'Transitioning flag should be reset after song 2 starts')

    // Verify Song 2 notes are loaded (and replaced Song 1 notes)
    finalNotes = result.current.gameStateRef.current.notes
    assert.strictEqual(finalNotes.length, 1, 'Should have notes for Song 2')
    assert.strictEqual(finalNotes[0].time, 500 + 100, 'Song 2 note time should be relative to Song 2 start + lead-in')
    assert.strictEqual(finalNotes[0].lane, 1)

    // 4. Verify End of Set
    // Now assume Song 2 ends.
    const onSong2Ended = mockAudioEngine.startGigPlayback.mock.calls[1].arguments[0].onEnded
    assert.ok(onSong2Ended, 'onEnded callback for Song 2 should be captured')

    // Ensure we mock the time to be beyond song 2 duration so game loop sees it as ended
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 40001) // > 40000ms

    await act(async () => {
        await onSong2Ended() // This calls playSongAtIndex(2) which should finish the set
        await new Promise(resolve => setTimeout(resolve, 50))
    })

    // Check if transitioning flag is reset to false after set ends
    assert.strictEqual(result.current.gameStateRef.current.songTransitioning, false, 'Transitioning flag should be FALSE after last song ends')
    assert.strictEqual(result.current.gameStateRef.current.setlistCompleted, true, 'Audio playback should be marked ended')

    // Now simulate game loop again -> should finalize
    act(() => {
        result.current.update(16)
    })

    // mockChangeScene should have been called now
    assert.ok(mockChangeScene.mock.calls.some(c => c.arguments[0] === 'POSTGIG'), 'Should transition to POSTGIG after set ends')
  })

  test('Quit logic does not trigger multi-song chaining', async () => {
    // Setup 2 songs in setlist
    const song1 = {
      id: 'song1',
      name: 'Song 1',
      bpm: 120,
      duration: 60,
      excerptDurationMs: 30000,
      sourceOgg: 'song1.ogg'
    }
    const song2 = {
      id: 'song2',
      name: 'Song 2',
      bpm: 120,
      duration: 60,
      excerptDurationMs: 30000,
      sourceOgg: 'song2.ogg'
    }

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
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)

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

    // Assert song 1 started
    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1)

    // Simulate Quit: transport stopped, hasSubmittedResults = true
    act(() => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'stopped')
      result.current.gameStateRef.current.hasSubmittedResults = true
    })

    // Simulate onEnded (triggered by stopAudio in Quit handler)
    await act(async () => {
        // onSongEnded checks the flags and should return early
        await onSong1Ended()
        await new Promise(resolve => setTimeout(resolve, 50))
    })

    // Assert song 2 did NOT start
    assert.strictEqual(mockAudioEngine.startGigPlayback.mock.calls.length, 1, 'Song 2 should NOT start after quit')
  })

  test('Game loop waits for setlistCompleted signal before finalizing (Multi-song gap protection)', async () => {
    // Setup a single song but simulate multi-song behavior where setlistCompleted is false
    const song1 = {
      id: 'song1',
      name: 'Song 1',
      bpm: 120,
      duration: 60,
      excerptDurationMs: 30000,
      sourceOgg: 'song1.ogg'
    }

    const mockState = {
      setlist: [song1],
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
    mockAudioEngine.hasAudioAsset.mock.mockImplementation(() => true)
    mockAudioEngine.startGigPlayback.mock.mockImplementation(async () => true)
    mockAudioManager.ensureAudioContext.mock.mockImplementation(async () => true)

    const { result } = renderHook(() => useRhythmGameLogic())

    // Wait for init
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Simulate Running state
    mockAudioEngine.getTransportState.mock.mockImplementation(() => 'started')
    result.current.gameStateRef.current.setlistCompleted = false // Crucial: Simulate audio not done yet
    result.current.gameStateRef.current.totalDuration = 30000 // Set duration

    // Simulate Time > Duration (Race condition: Loop runs before audio ends)
    mockAudioEngine.getGigTimeMs.mock.mockImplementation(() => 30001)

    // Run update loop
    act(() => {
      result.current.update(16)
    })

    // Assert that finalizeGig was NOT called
    assert.strictEqual(mockChangeScene.mock.calls.length, 0, 'Should NOT finalize gig if setlistCompleted is false')

    // Now simulate audio ending
    result.current.gameStateRef.current.setlistCompleted = true

    // Run update loop again
    act(() => {
      result.current.update(16)
    })

    // Assert that finalizeGig IS called now
    assert.ok(mockChangeScene.mock.calls.length > 0, 'Should finalize gig once setlistCompleted is true')
    assert.strictEqual(mockChangeScene.mock.calls[0].arguments[0], 'POSTGIG')
  })
})
