import { beforeAll, describe, expect, test, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock dependencies BEFORE import
const mockGameState = {
  completeTravelMinigame: vi.fn(),
  player: { van: { upgrades: [] } }
}

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => mockGameState,
  useGameSelector: selector => selector(mockGameState)
}))

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: {
    playSFX: vi.fn()
  }
}))

vi.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: {
    playSFX: vi.fn(),
    init: vi.fn()
  }
}))

describe('TourbusLogic Performance', () => {
  let useTourbusLogic

  beforeAll(async () => {
    const module = await import('../../src/hooks/minigames/useTourbusLogic')
    useTourbusLogic = module.useTourbusLogic
  })

  test('update loop performance with obstacles and collisions', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const update = result.current.update

    const game = result.current.gameStateRef.current
    // Seed obstacles across multiple lanes to simulate real minigame load
    const obstacleCount = 60
    for (let i = 0; i < obstacleCount; i++) {
      game.obstacles.push({
        id: ++game.nextObstacleId,
        lane: i % 3,
        y: 10 + (i % 80),
        type: i % 5 === 0 ? 'FUEL' : i % 7 === 0 ? 'VOID_HAZARD' : 'OBSTACLE',
        collided: false
      })
    }

    const start = performance.now()
    const iterations = 50000

    act(() => {
      for (let i = 0; i < iterations; i++) {
        update(16)
      }
    })

    const end = performance.now()
    const duration = end - start
    console.log(
      `[Perf] 50k Tourbus updates with ${obstacleCount} obstacles took: ${duration.toFixed(2)}ms`
    )

    expect(game.distance).toBeGreaterThan(0)
    unmount()
  })
})
