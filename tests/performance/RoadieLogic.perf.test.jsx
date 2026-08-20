import { beforeAll, describe, expect, test, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { GAME_PHASES } from '../../src/context/gameConstants'

// Mock dependencies BEFORE import
const mockGameState = {
  completeRoadieMinigame: vi.fn(),
  currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
  changeScene: vi.fn()
}

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => mockGameState,
  useGameActions: () => mockGameState,
  useGameSelector: selector => selector(mockGameState)
}))
vi.mock('../src/utils/audio/audioEngine', async (importOriginal) => {
  const actual = await importOriginal();
  const mockAudioManager = {
    playSFX: vi.fn(),
    init: vi.fn(),
    subscribe: vi.fn(),
    setMusicVolume: vi.fn(),
    setSFXVolume: vi.fn(),
    toggleMute: vi.fn(),
    startAmbient: vi.fn().mockResolvedValue(true),
    stopMusic: vi.fn(),
    resumeMusic: vi.fn().mockResolvedValue(true),
    ensureAudioContext: vi.fn().mockResolvedValue(true),
    playSFX: vi.fn(),
    setNeuroDecimator: vi.fn(),
    getStateSnapshot: vi.fn().mockReturnValue({}),
  };
  return {
    ...actual,
    audioManager: mockAudioManager,
    audioService: {
      ...mockAudioManager,
      getState: vi.fn().mockReturnValue({}),
      hasNativeSubscribe: vi.fn().mockReturnValue(true)
    }
  };
})
describe('RoadieLogic Performance', () => {
  let useRoadieLogic

  beforeAll(async () => {
    //  removed (handled by vitest env)
    // Dynamic import after mocks
    const module = await import('../../src/hooks/minigames/useRoadieLogic')
    useRoadieLogic = module.useRoadieLogic
  })

  test('update loop performance', () => {
    const { result, unmount } = renderHook(() => useRoadieLogic())
    const update = result.current.update

    // Seed some traffic
    const game = result.current.gameStateRef.current
    // Add enough traffic to make it simulate real load
    const trafficCount = 100
    for (let i = 0; i < trafficCount; i++) {
      game.traffic.push({
        id: `test-${i}`,
        row: (i % 6) + 1,
        x: 5,
        speed: 0.000001, // Slow speed to keep them in bounds
        width: 1.5
      })
    }

    const start = performance.now()
    const iterations = 50000

    // Run update loop
    act(() => {
      for (let i = 0; i < iterations; i++) {
        update(16) // 16ms delta
      }
    })

    const end = performance.now()
    console.log(
      `[Perf] 50k updates with ${trafficCount} cars took: ${(end - start).toFixed(2)}ms`
    )

    // Basic verification
    // Traffic may spawn over time, so we should expect at least trafficCount
    expect(game.traffic.length).toBeGreaterThanOrEqual(trafficCount)
    // Check if cars moved
    expect(game.traffic[0].x).not.toBe(5)
    unmount()
  })
})
