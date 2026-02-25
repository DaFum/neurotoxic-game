import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock dependencies
const mockCompleteRoadieMinigame = mock.fn()
const mockChangeScene = mock.fn()
const mockUseGameState = mock.fn(() => ({
  completeRoadieMinigame: mockCompleteRoadieMinigame,
  currentScene: 'PRE_GIG_MINIGAME',
  changeScene: mockChangeScene
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

// Import hook after mocks
const { useRoadieLogic, MOVE_COOLDOWN_BASE } = await import('../src/hooks/minigames/useRoadieLogic.js')
const { GRID_WIDTH, GRID_HEIGHT } = await import('../src/hooks/minigames/constants.js')

describe('useRoadieLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    mockCompleteRoadieMinigame.mock.resetCalls()
    mockChangeScene.mock.resetCalls()
    mockPlaySFX.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.reset()
  })

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    assert.deepEqual(game.playerPos, { x: 6, y: 0 })
    assert.equal(game.equipmentDamage, 0)
    assert.equal(game.isGameOver, false)
    assert.ok(game.carrying, 'Should start carrying an item')
    // itemsToDeliver has 3 items. One is popped immediately. Remaining is 2.
    assert.equal(result.current.uiState.itemsRemaining, 2, 'Should have 2 items remaining (1 carrying, 2 in list)')
  })

  test('moves player within bounds', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // Move Right
    act(() => { result.current.actions.move(1, 0) })
    assert.deepEqual(game.playerPos, { x: 7, y: 0 })

    // Move Left (wait for cooldown)
    game.lastMoveTime = 0 // Reset cooldown hack
    act(() => { result.current.actions.move(-1, 0) })
    assert.deepEqual(game.playerPos, { x: 6, y: 0 })

    // Boundary Left
    game.playerPos.x = 0
    game.lastMoveTime = 0
    act(() => { result.current.actions.move(-1, 0) })
    assert.deepEqual(game.playerPos, { x: 0, y: 0 })

    // Boundary Right
    game.playerPos.x = GRID_WIDTH - 1
    game.lastMoveTime = 0
    act(() => { result.current.actions.move(1, 0) })
    assert.deepEqual(game.playerPos, { x: GRID_WIDTH - 1, y: 0 })

    // Boundary Up
    game.playerPos.y = 0
    game.lastMoveTime = 0
    act(() => { result.current.actions.move(0, -1) })
    assert.deepEqual(game.playerPos, { x: GRID_WIDTH - 1, y: 0 })

    // Boundary Down
    game.playerPos.y = GRID_HEIGHT - 1
    game.lastMoveTime = 0
    act(() => { result.current.actions.move(0, 1) })
    assert.deepEqual(game.playerPos, { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 })
  })

  test('delivers item at venue', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // Teleport to venue entrance
    game.playerPos = { x: 6, y: GRID_HEIGHT - 2 }
    game.lastMoveTime = 0

    // Move down into venue
    act(() => { result.current.actions.move(0, 1) })

    assert.equal(game.playerPos.y, GRID_HEIGHT - 1)
    assert.equal(game.carrying, null, 'Should drop item')
    assert.equal(game.itemsDelivered.length, 1)
    assert.equal(mockPlaySFX.mock.calls.length, 1)
    assert.equal(mockPlaySFX.mock.calls[0].arguments[0], 'deliver')
  })

  test('picks up item at start', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // Simulate delivery first to clear hands
    game.carrying = null
    game.itemsDelivered.push({ id: 'test' })

    // Teleport to start entrance
    game.playerPos = { x: 6, y: 1 }
    game.lastMoveTime = 0

    // Move up to start
    act(() => { result.current.actions.move(0, -1) })

    assert.equal(game.playerPos.y, 0)
    assert.ok(game.carrying, 'Should pick up item')
    assert.equal(mockPlaySFX.mock.calls.length, 1)
    assert.equal(mockPlaySFX.mock.calls[0].arguments[0], 'pickup')
  })

  test('spawns traffic over time', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // Clear initial traffic if any
    game.traffic = []

    // Advance time in small steps to ensure spawning and not immediate despawning
    // Total 3000ms, steps of 100ms
    for (let i = 0; i < 30; i++) {
      act(() => { result.current.update(100) })
    }

    assert.ok(game.traffic.length > 0, 'Should spawn traffic')
  })

  test('handles collision and damage', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // Setup collision scenario
    game.playerPos = { x: 6, y: 1 } // Player in lane 1
    // Place car in same lane, overlapping
    game.traffic = [{
      id: 'test-car',
      row: 1,
      x: 6.0,
      speed: 0, // Stationary for test
      width: 1.5
    }]

    // Update to trigger collision check
    act(() => { result.current.update(16) })

    assert.equal(mockPlaySFX.mock.calls.length, 1)
    assert.equal(mockPlaySFX.mock.calls[0].arguments[0], 'crash')
    assert.equal(game.equipmentDamage, 10, 'Should take 10 damage')
    assert.deepEqual(game.playerPos, { x: 6, y: 0 }, 'Should respawn at start')
  })

  test('triggers game over on completion', () => {
    const { result } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // Setup: 1 item left to deliver, carrying it
    game.itemsToDeliver = []
    game.carrying = { id: 'last-item', weight: 1 }
    game.playerPos = { x: 6, y: GRID_HEIGHT - 2 }
    game.lastMoveTime = 0

    // Move to finish
    act(() => { result.current.actions.move(0, 1) })

    assert.equal(game.isGameOver, true)
    assert.equal(mockCompleteRoadieMinigame.mock.calls.length, 1)
  })
})
