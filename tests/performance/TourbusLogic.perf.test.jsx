import { beforeAll, describe, expect, test, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as tourbusLogicUtils from '../../src/hooks/minigames/tourbusLogicUtils'

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

  test('recycles collisions buffer across frame ticks with zero buffer reallocations', () => {
    const stepSpy = vi.spyOn(tourbusLogicUtils, 'stepTourbusObstacles')

    const { result, unmount } = renderHook(() => useTourbusLogic())
    const update = result.current.update
    const game = result.current.gameStateRef.current
    const initialBuffer = game.collisionsBuffer

    expect(Array.isArray(initialBuffer)).toBe(true)

    // Seed obstacles across lanes to trigger obstacle processing
    for (let i = 0; i < 10; i++) {
      game.obstacles.push({
        id: ++game.nextObstacleId,
        lane: i % 3,
        y: 10 + i * 5,
        type: i % 2 === 0 ? 'OBSTACLE' : 'FUEL',
        collided: false
      })
    }

    const frameCount = 100
    act(() => {
      for (let i = 0; i < frameCount; i++) {
        update(16)
      }
    })

    // Performance budget: exactly frameCount calls, every single call must receive the preallocated buffer
    expect(stepSpy).toHaveBeenCalledTimes(frameCount)
    for (let i = 0; i < frameCount; i++) {
      const callArgs = stepSpy.mock.calls[i]
      // 4th argument must be the reusable collisionsBuffer
      expect(callArgs?.[3]).toBe(initialBuffer)
    }

    // Performance budget: 0 buffer reallocations (reference identity preserved across all frame ticks)
    expect(game.collisionsBuffer).toBe(initialBuffer)

    stepSpy.mockRestore()
    unmount()
  })
})
