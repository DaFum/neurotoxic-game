import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { GAME_PHASES } from '../src/context/gameConstants.js'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock dependencies
const mockCompleteRoadieMinigame = mock.fn()
const mockChangeScene = mock.fn()
const mockUseGameState = mock.fn(() => ({
  completeRoadieMinigame: mockCompleteRoadieMinigame,
  currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
  changeScene: mockChangeScene
}))

mock.module('../src/context/GameState', {
  namedExports: { useGameState: mockUseGameState }
})

const mockPlaySFX = mock.fn()
mock.module('../src/utils/AudioManager', {
  namedExports: { audioManager: { playSFX: mockPlaySFX } }
})

const { useRoadieLogic } = await import('../src/hooks/minigames/useRoadieLogic.js')
const { GRID_WIDTH, GRID_HEIGHT } = await import('../src/hooks/minigames/constants.js')

describe('useRoadieLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    mockCompleteRoadieMinigame.mock.resetCalls()
    mockChangeScene.mock.resetCalls()
    mockPlaySFX.mock.resetCalls()
    mock.timers.enable({ apis: ['Date', 'setTimeout'] })
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.timers.reset()
    mock.reset()
  })

  test('handles initialization, movement, interactions, and completion properly', () => {
    const { result, unmount } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // 1. Initialization
    assert.deepEqual(game.playerPos, { x: 6, y: 0 })
    assert.equal(game.equipmentDamage, 0)
    assert.equal(game.isGameOver, false)
    assert.ok(game.carrying)
    assert.equal(result.current.uiState.itemsRemaining, 2)

    mock.timers.tick(1000)

    // 2. Movement and bounds
    act(() => { result.current.actions.move(1, 0) })
    assert.deepEqual(game.playerPos, { x: 7, y: 0 })
    mock.timers.tick(1000)

    act(() => { result.current.actions.move(-1, 0) })
    assert.deepEqual(game.playerPos, { x: 6, y: 0 })
    mock.timers.tick(1000)


    game.playerPos.x = 0
    act(() => { result.current.actions.move(-1, 0) })
    assert.deepEqual(game.playerPos, { x: 0, y: 0 })
    mock.timers.tick(1000)

    // Right Boundary
    game.playerPos.x = GRID_WIDTH - 1
    act(() => { result.current.actions.move(1, 0) })
    assert.deepEqual(game.playerPos, { x: GRID_WIDTH - 1, y: 0 })
    mock.timers.tick(1000)

    // Up Boundary
    game.playerPos.y = 0
    act(() => { result.current.actions.move(0, -1) })
    assert.deepEqual(game.playerPos, { x: GRID_WIDTH - 1, y: 0 })
    mock.timers.tick(1000)

    // Down Boundary
    game.playerPos.y = GRID_HEIGHT - 1
    act(() => { result.current.actions.move(0, 1) })
    assert.deepEqual(game.playerPos, { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 })
    mock.timers.tick(1000)


    // 3. Deliver item at venue
    game.playerPos = { x: 6, y: GRID_HEIGHT - 2 }
    act(() => { result.current.actions.move(0, 1) })
    assert.equal(game.playerPos.y, GRID_HEIGHT - 1)
    assert.equal(game.carrying, null)
    assert.equal(game.itemsDelivered.length, 1)
    assert.equal(mockPlaySFX.mock.calls[0].arguments[0], 'deliver')
    mock.timers.tick(1000)

    // 4. Pick up item at start
    game.playerPos = { x: 6, y: 1 }
    act(() => { result.current.actions.move(0, -1) })
    assert.equal(game.playerPos.y, 0)
    assert.ok(game.carrying)
    assert.equal(mockPlaySFX.mock.calls[1].arguments[0], 'pickup')
    mock.timers.tick(1000)

    // 5. Spawn traffic
    game.traffic = []
    for (let i = 0; i < 30; i++) {
      act(() => { result.current.update(100) })
    }
    assert.ok(game.traffic.length > 0)

    // 6. Handle collision and damage
    game.playerPos = { x: 6, y: 1 }
    game.traffic = [{ id: 'test-car', row: 1, x: 6.0, speed: 0, width: 1.5 }]
    act(() => { result.current.update(16) })
    assert.equal(game.equipmentDamage, 10)
    assert.deepEqual(game.playerPos, { x: 6, y: 0 })

    // 7. Trigger game over on completion
    game.itemsToDeliver = []
    game.carrying = { id: 'last-item', weight: 1 }
    game.playerPos = { x: 6, y: GRID_HEIGHT - 2 }
    mock.timers.tick(1000)
    act(() => { result.current.actions.move(0, 1) })
    assert.equal(game.isGameOver, true)
    assert.equal(mockCompleteRoadieMinigame.mock.calls.length, 1)

    unmount()
  })
})
