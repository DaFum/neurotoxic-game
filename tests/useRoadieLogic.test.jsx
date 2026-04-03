import { describe, it as test, beforeEach, afterEach, vi as mock, expect } from 'vitest'

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

mock.mock('../src/context/GameState', () => ({ useGameState: mockUseGameState }))

const mockPlaySFX = mock.fn()
mock.mock('../src/utils/AudioManager', () => ({ audioManager: { playSFX: mockPlaySFX } }))

const { useRoadieLogic } = await import('../src/hooks/minigames/useRoadieLogic.js')
const { GRID_WIDTH, GRID_HEIGHT } = await import('../src/hooks/minigames/constants.js')

describe('useRoadieLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    mockCompleteRoadieMinigame.mockClear()
    mockChangeScene.mockClear()
    mockPlaySFX.mockClear()
    mock.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.useRealTimers()
    mock.clearAllMocks()
  })

  test('handles initialization, movement, interactions, and completion properly', () => {
    const { result, unmount } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current

    // 1. Initialization
    expect(game.playerPos).toEqual({ x: 6, y: 0 })
    expect(game.equipmentDamage).toBe(0)
    expect(game.isGameOver).toBe(false)
    expect(game.carrying).toBeTruthy()
    expect(result.current.uiState.itemsRemaining).toBe(2)

    mock.advanceTimersByTime(1000)

    // 2. Movement and bounds
    act(() => { result.current.actions.move(1, 0) })
    expect(game.playerPos).toEqual({ x: 7, y: 0 })
    mock.advanceTimersByTime(1000)

    act(() => { result.current.actions.move(-1, 0) })
    expect(game.playerPos).toEqual({ x: 6, y: 0 })
    mock.advanceTimersByTime(1000)


    game.playerPos.x = 0
    act(() => { result.current.actions.move(-1, 0) })
    expect(game.playerPos).toEqual({ x: 0, y: 0 })
    mock.advanceTimersByTime(1000)

    // Right Boundary
    game.playerPos.x = GRID_WIDTH - 1
    act(() => { result.current.actions.move(1, 0) })
    expect(game.playerPos).toEqual({ x: GRID_WIDTH - 1, y: 0 })
    mock.advanceTimersByTime(1000)

    // Up Boundary
    game.playerPos.y = 0
    act(() => { result.current.actions.move(0, -1) })
    expect(game.playerPos).toEqual({ x: GRID_WIDTH - 1, y: 0 })
    mock.advanceTimersByTime(1000)

    // Down Boundary
    game.playerPos.y = GRID_HEIGHT - 1
    act(() => { result.current.actions.move(0, 1) })
    expect(game.playerPos).toEqual({ x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 })
    mock.advanceTimersByTime(1000)


    // 3. Deliver item at venue
    game.carrying = { id: 'amp', type: 'AMP', weight: 2 }
    game.itemsDelivered = []
    mockPlaySFX.mockClear()
    game.playerPos = { x: 6, y: GRID_HEIGHT - 2 }
    mock.advanceTimersByTime(1000)
    const beforeDeliverCount = mockPlaySFX.mock.calls.length
    act(() => { result.current.actions.move(0, 1) })
    expect(game.playerPos.y).toBe(GRID_HEIGHT - 1)
    expect(game.carrying).toBe(null)
    expect(game.itemsDelivered.length).toBe(1)

    expect(mockPlaySFX.mock.calls[beforeDeliverCount][0]).toBe('deliver')

    mock.advanceTimersByTime(1000)

    // 4. Pick up item at start
    game.carrying = null
    game.playerPos = { x: 6, y: 1 }
    const beforePickupCount = mockPlaySFX.mock.calls.length

    act(() => { result.current.actions.move(0, -1) })
    expect(game.playerPos.y).toBe(0)
    expect(game.carrying).toBeTruthy()

    expect(mockPlaySFX.mock.calls.length).toBe(beforePickupCount + 1)
    expect(mockPlaySFX.mock.calls[beforePickupCount][0]).toBe('pickup')
    mock.advanceTimersByTime(1000)

    // 5. Spawn traffic
    game.traffic = []
    for (let i = 0; i < 30; i++) {
      act(() => { result.current.update(100) })
    }
    expect(game.traffic.length).toBeGreaterThan(0)

    // 6. Handle collision and damage
    game.playerPos = { x: 6, y: 1 }
    game.traffic = [{ id: 'test-car', row: 1, x: 6.0, speed: 0, width: 1.5 }]
    const playSFXCallCountBeforeCrash = mockPlaySFX.mock.calls.length
    act(() => { result.current.update(16) })
    expect(game.equipmentDamage).toBe(10)
    expect(game.playerPos).toEqual({ x: 6, y: 0 })
    expect(mockPlaySFX.mock.calls.length).toBe(playSFXCallCountBeforeCrash + 1)
    expect(mockPlaySFX.mock.calls[playSFXCallCountBeforeCrash][0]).toBe('crash')

    // 7. Trigger game over on completion
    game.itemsToDeliver = []
    game.carrying = { id: 'last-item', weight: 1 }
    game.playerPos = { x: 6, y: GRID_HEIGHT - 2 }
    mock.advanceTimersByTime(1000)
    act(() => { result.current.actions.move(0, 1) })
    expect(game.isGameOver).toBe(true)
    expect(mockCompleteRoadieMinigame.mock.calls.length).toBe(1)
    expect(mockCompleteRoadieMinigame.mock.calls[0][0]).toBe(10) // equipmentDamage

    expect(mockChangeScene.mock.calls.length).toBe(0) // Routing is deferred to useArrivalLogic

    unmount()
  })
})
