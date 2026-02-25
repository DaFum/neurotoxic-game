import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock dependencies
const mockUseGameState = mock.fn(() => ({
  player: { van: { upgrades: [] } },
  completeTravelMinigame: mock.fn()
}))

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

const mockPlaySFX = mock.fn()
mock.module('../src/utils/AudioManager', {
  namedExports: {
    audioManager: {
      playSFX: mockPlaySFX
    }
  }
})

const mockHasUpgrade = mock.fn(() => false)
mock.module('../src/utils/upgradeUtils', {
  namedExports: {
    hasUpgrade: mockHasUpgrade
  }
})

// Import hook after mocks
const { useTourbusLogic, BASE_SPEED, MAX_SPEED, SPAWN_RATE_MS, TARGET_DISTANCE } = await import('../src/hooks/minigames/useTourbusLogic.js')

describe('useTourbusLogic Spawn Rate', () => {
  beforeEach(() => {
    setupJSDOM()
    mockUseGameState.mock.mockImplementation(() => ({
        player: { van: { upgrades: [] } },
        completeTravelMinigame: mock.fn()
    }))
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.reset()
  })

  test('spawn rate maintains constant density (spawns faster at higher speeds)', async () => {
    const { result } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // 1. Initial Speed Check
    assert.equal(game.speed, BASE_SPEED, "Should start at BASE_SPEED")

    // Reset state
    game.lastSpawnTime = 0
    game.obstacles = []

    // Advance just below threshold
    // Threshold is SPAWN_RATE_MS
    act(() => { result.current.update(SPAWN_RATE_MS - 10) })
    assert.equal(game.obstacles.length, 0, "Should not spawn before SPAWN_RATE_MS at base speed")

    // Advance past threshold
    act(() => { result.current.update(20) }) // Total SPAWN_RATE_MS + 10
    assert.equal(game.obstacles.length, 1, "Should spawn after SPAWN_RATE_MS at base speed")

    // 2. Max Speed Check
    // Force max speed
    game.distance = TARGET_DISTANCE * 0.8 // 100% progress
    game.obstacles = []
    game.lastSpawnTime = 0

    // Update to calculate speed
    act(() => { result.current.update(0) })
    assert.equal(game.speed, MAX_SPEED, "Speed should reach MAX_SPEED")

    // Calculate expected rate
    // New logic: (BASE_SPEED * SPAWN_RATE_MS) / MAX_SPEED
    const expectedRate = (BASE_SPEED * SPAWN_RATE_MS) / MAX_SPEED
    // expectedRate is 625ms

    // Check below rate
    act(() => { result.current.update(expectedRate - 25) }) // 600ms
    assert.equal(game.obstacles.length, 0, `Should not spawn at ${expectedRate - 25}ms (rate should be ~${expectedRate}ms)`)

    // Check above rate
    act(() => { result.current.update(50) }) // Total 650
    assert.equal(game.obstacles.length, 1, `Should spawn by 650ms at max speed (rate ~${expectedRate}ms)`)
  })
})
