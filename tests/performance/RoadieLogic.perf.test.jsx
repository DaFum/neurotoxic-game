import { test, describe, before, after, mock } from 'node:test'
import { renderHook } from '@testing-library/react'
import assert from 'node:assert'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

// Mock dependencies BEFORE import
mock.module('../../src/context/GameState', {
  namedExports: {
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useGameState: () => ({
      completeRoadieMinigame: mock.fn(),
      currentScene: 'PRE_GIG_MINIGAME',
      changeScene: mock.fn()
    })
  }
})

mock.module('../../src/utils/AudioManager', {
  namedExports: {
    audioManager: {
      playSFX: mock.fn(),
      init: mock.fn()
    }
  }
})

describe('RoadieLogic Performance', () => {
  let useRoadieLogic

  before(async () => {
    setupJSDOM()
    // Dynamic import after mocks
    const module = await import('../../src/hooks/minigames/useRoadieLogic.js')
    useRoadieLogic = module.useRoadieLogic
  })

  after(() => {
    teardownJSDOM()
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
    console.log(`[Perf] 50k updates with ${trafficCount} cars took: ${(end - start).toFixed(2)}ms`)

    // Basic verification
    assert.strictEqual(game.traffic.length, trafficCount, 'Traffic should remain')
    // Check if cars moved
    assert.notEqual(game.traffic[0].x, 5, 'Cars should have moved')

    unmount()
  })
})
