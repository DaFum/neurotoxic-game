import { beforeAll, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock dependencies BEFORE import
vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    completeRoadieMinigame: vi.fn(),
    currentScene: 'PRE_GIG_MINIGAME',
    changeScene: vi.fn()
  })
}))
vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    playSFX: vi.fn(),
    init: vi.fn()
  }
}))
describe('RoadieLogic Performance', () => {
  let useRoadieLogic

  beforeAll(async () => {
    //  removed (handled by vitest env)
    // Dynamic import after mocks
    const module = await import('../../src/hooks/minigames/useRoadieLogic.js')
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
        row: i % 6,
        x: 5,
        speed: 0.000001, // Slow speed to keep them in bounds
        width: 1.5
      })
    }

    const start = performance.now()
    const iterations = 50000

    // Run update loop
    for (let i = 0; i < iterations; i++) {
      update(16) // 16ms delta
    }

    const end = performance.now()
    console.log(
      `[Perf] 50k updates with ${trafficCount} cars took: ${(end - start).toFixed(2)}ms`
    )

    // Basic verification
    expect(game.traffic.length).toBe(trafficCount)
    // Check if cars moved
    expect(game.traffic[0].x).not.toBe(5)
    unmount()
  })
})
