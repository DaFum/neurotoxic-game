import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mocks
const mockAudioEngine = {
  stopAudio: mock.fn(),
  playNoteAtTime: mock.fn(),
  getGigTimeMs: mock.fn(() => 1000),
  getAudioTimeMs: mock.fn(() => 1000)
}
const mockAudioManager = {
  playSFX: mock.fn()
}
const mockGigStats = {
  updateGigPerformanceStats: mock.fn(stats => stats),
  buildGigStatsSnapshot: mock.fn(() => ({ accuracy: 100 })),
  calculateAccuracy: mock.fn(() => 100)
}
const mockTimingUtils = {
  getScheduledHitTimeMs: mock.fn()
}
const mockRhythmUtils = {
  checkHit: mock.fn()
}

// Apply mocks
mock.module('../src/utils/audioEngine.js', { namedExports: mockAudioEngine })
mock.module('../src/utils/AudioManager.js', {
  namedExports: { audioManager: mockAudioManager }
})
mock.module('../src/utils/gigStats.js', { namedExports: mockGigStats })
mock.module('../src/utils/audio/timingUtils.js', {
  namedExports: mockTimingUtils
})
mock.module('../src/utils/rhythmUtils.js', { namedExports: mockRhythmUtils })

// Import hook (must be after mocks)
const { useRhythmGameScoring } =
  await import('../src/hooks/rhythmGame/useRhythmGameScoring.js')

describe('useRhythmGameScoring Game Over', () => {
  beforeEach(() => {
    setupJSDOM()
    mockAudioEngine.stopAudio.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('marks game over and stops audio on collapse', () => {
    const gameStateRef = {
      current: {
        stats: { misses: 0 },
        combo: 10,
        health: 10, // Low health
        overload: 0,
        isToxicMode: false,
        isGameOver: false,
        lanes: [{}, {}, {}],
        notes: [],
        modifiers: {}
      }
    }

    const setters = {
      setScore: mock.fn(),
      setCombo: mock.fn(),
      setHealth: mock.fn(updater => {
        if (typeof updater === 'function') {
          const newVal = updater(gameStateRef.current.health)
          gameStateRef.current.health = newVal
          return newVal
        }
        gameStateRef.current.health = updater
        return updater
      }),
      setOverload: mock.fn(),
      setIsToxicMode: mock.fn(),
      setIsGameOver: mock.fn()
    }

    const contextActions = {
      addToast: mock.fn(),
      changeScene: mock.fn(),
      hasUpgrade: mock.fn(() => false),
      setLastGigStats: mock.fn()
    }

    const { result } = renderHook(() =>
      useRhythmGameScoring({
        gameStateRef,
        setters,
        contextActions
      })
    )

    act(() => {
      // Trigger miss to reduce health below 0
      // Default penalty is 2 per miss. Health is 10. Need 5 misses.
      result.current.handleMiss(5, false) // 5 misses * 2 dmg = 10 dmg -> 0 health
    })

    // Check if stopAudio was called
    assert.equal(
      mockAudioEngine.stopAudio.mock.calls.length,
      1,
      'stopAudio should be called'
    )

    assert.equal(
      gameStateRef.current.isGameOver,
      true,
      'isGameOver should be true on game over'
    )
  })
})
