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
  namedExports: { useGameState: mockUseGameState }
})

const mockPlaySFX = mock.fn()
mock.module('../src/utils/AudioManager', {
  namedExports: { audioManager: { playSFX: mockPlaySFX } }
})

const mockHasUpgrade = mock.fn(() => false)
mock.module('../src/utils/upgradeUtils', {
  namedExports: { hasUpgrade: mockHasUpgrade }
})

const { useTourbusLogic, BASE_SPEED, MAX_SPEED, SPAWN_RATE_MS, TARGET_DISTANCE } = await import('../src/hooks/minigames/useTourbusLogic.js')
const { LANE_COUNT, BUS_Y_PERCENT } = await import('../src/hooks/minigames/constants.js')

describe('useTourbusLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    mockUseGameState.mock.mockImplementation(() => ({ player: { van: { upgrades: [] } }, completeTravelMinigame: mock.fn() }))
    mockPlaySFX.mock.resetCalls()
    mockHasUpgrade.mock.mockImplementation(() => false)
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.reset()
  })

  test('spawn rate maintains constant density and movements clamp correctly', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Spawn rate
    assert.equal(game.speed, BASE_SPEED)
    game.lastSpawnTime = 0
    game.obstacles = []

    act(() => { result.current.update(SPAWN_RATE_MS - 10) })
    assert.equal(game.obstacles.length, 0)
    act(() => { result.current.update(20) })
    assert.equal(game.obstacles.length, 1)

    // Max speed
    game.distance = TARGET_DISTANCE * 0.8
    game.obstacles = []
    game.lastSpawnTime = 0
    act(() => { result.current.update(0) })
    assert.equal(game.speed, MAX_SPEED)
    const expectedRate = (BASE_SPEED * SPAWN_RATE_MS) / MAX_SPEED
    act(() => { result.current.update(expectedRate - 25) })
    assert.equal(game.obstacles.length, 0)
    act(() => { result.current.update(50) })
    assert.equal(game.obstacles.length, 1)

    // Movement
    assert.equal(game.busLane, 1)
    act(() => { result.current.actions.moveLeft() })
    assert.equal(game.busLane, 0)
    act(() => { result.current.actions.moveLeft() })
    assert.equal(game.busLane, 0) // Clamped
    act(() => { result.current.actions.moveRight() })
    assert.equal(game.busLane, 1)
    act(() => { result.current.actions.moveRight() })
    assert.equal(game.busLane, 2)
    act(() => { result.current.actions.moveRight() })
    assert.equal(game.busLane, LANE_COUNT - 1)

    unmount()
  })

  test('collision, items, off-screen cleanup, and game completion work correctly', () => {
    const completeMock = mock.fn()
    mockUseGameState.mock.mockImplementation(() => ({
      player: { van: { upgrades: [] } },
      completeTravelMinigame: completeMock
    }))

    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Collisions
    game.busLane = 1
    game.obstacles = [
      { id: 'obs1', lane: 1, y: BUS_Y_PERCENT + 1, type: 'OBSTACLE', collided: false },
      { id: 'fuel1', lane: 1, y: BUS_Y_PERCENT + 1, type: 'FUEL', collided: false },
      { id: 'gone', lane: 0, y: 120, type: 'OBSTACLE' }
    ]

    act(() => { result.current.update(16) })

    assert.equal(game.damage, 10) // 10 from obstacle
    assert.deepEqual(game.itemsCollected, ['FUEL'])
    assert.equal(mockPlaySFX.mock.calls.length, 2)
    // Check specific sfx calls (not necessarily array-ordering sensitive, but here they run left-to-right on array map or iteration, let's just check they both exist. Actually, let's check array exactly to match request)
    assert.deepEqual(
      mockPlaySFX.mock.calls.map(call => call.arguments[0]).sort(),
      ['crash', 'pickup'].sort()
    )
    assert.equal(game.obstacles.length, 2) // "gone" is removed
    assert.equal(game.obstacles.some(o => o.id === 'gone'), false)
    assert.equal(game.obstacles.find(o => o.id === 'obs1')?.collided, true)
    assert.equal(game.obstacles.find(o => o.id === 'fuel1')?.collided, true)

    // Game Completion
    game.distance = TARGET_DISTANCE
    act(() => { result.current.update(16) })
    assert.equal(game.isGameOver, true)
    assert.equal(completeMock.mock.calls.length, 1)
    assert.deepEqual(completeMock.mock.calls[0].arguments, [10, ['FUEL']])

    unmount()
  })

  test('armor and bullbar upgrades reduce damage correctly', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Bullbar (reduces to 5)
    mockHasUpgrade.mock.mockImplementation((_, type) => type === 'van_bullbar')
    game.obstacles = [{ id: 'obs1', lane: 1, y: BUS_Y_PERCENT + 1, type: 'OBSTACLE', collided: false }]
    game.damage = 0
    act(() => { result.current.update(16) })
    assert.equal(game.damage, 5)

    // Armor (reduces to 2) - armor takes precedence
    mockHasUpgrade.mock.mockImplementation((_, type) => type === 'van_armor' || type === 'van_bullbar')
    game.obstacles = [{ id: 'obs2', lane: 1, y: BUS_Y_PERCENT + 1, type: 'OBSTACLE', collided: false }]
    game.damage = 0
    act(() => { result.current.update(16) })
    assert.equal(game.damage, 2)

    unmount()
  })
})
