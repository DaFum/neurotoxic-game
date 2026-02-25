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
const {
  useTourbusLogic,
  BASE_SPEED,
  MAX_SPEED,
  SPAWN_RATE_MS,
  TARGET_DISTANCE
} = await import('../src/hooks/minigames/useTourbusLogic.js')

const {
  LANE_COUNT,
  BUS_Y_PERCENT,
  BUS_HEIGHT_PERCENT
} = await import('../src/hooks/minigames/constants.js')

describe('useTourbusLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    // Reset mocks
    mockUseGameState.mock.mockImplementation(() => ({
      player: { van: { upgrades: [] } },
      completeTravelMinigame: mock.fn()
    }))
    mockPlaySFX.mock.resetCalls()
    mockHasUpgrade.mock.mockImplementation(() => false)
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.reset()
  })

  describe('Spawn Rate', () => {
    test('spawn rate maintains constant density (spawns faster at higher speeds)', async () => {
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      // 1. Initial Speed Check
      assert.equal(game.speed, BASE_SPEED, 'Should start at BASE_SPEED')

      // Reset state
      game.lastSpawnTime = 0
      game.obstacles = []

      // Advance just below threshold
      act(() => {
        result.current.update(SPAWN_RATE_MS - 10)
      })
      assert.equal(
        game.obstacles.length,
        0,
        'Should not spawn before SPAWN_RATE_MS at base speed'
      )

      // Advance past threshold
      act(() => {
        result.current.update(20)
      })
      assert.equal(
        game.obstacles.length,
        1,
        'Should spawn after SPAWN_RATE_MS at base speed'
      )

      // 2. Max Speed Check
      game.distance = TARGET_DISTANCE * 0.8
      game.obstacles = []
      game.lastSpawnTime = 0

      // Update to calculate speed
      act(() => {
        result.current.update(0)
      })
      assert.equal(game.speed, MAX_SPEED, 'Speed should reach MAX_SPEED')

      const expectedRate = (BASE_SPEED * SPAWN_RATE_MS) / MAX_SPEED

      act(() => {
        result.current.update(expectedRate - 25)
      })
      assert.equal(
        game.obstacles.length,
        0,
        `Should not spawn at ${expectedRate - 25}ms`
      )

      act(() => {
        result.current.update(50)
      })
      assert.equal(
        game.obstacles.length,
        1,
        `Should spawn by 650ms at max speed`
      )
    })
  })

  describe('Movement', () => {
    test('moveLeft decreases lane but clamps at 0', () => {
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      // Initial lane is 1
      assert.equal(game.busLane, 1)

      act(() => {
        result.current.actions.moveLeft()
      })
      assert.equal(game.busLane, 0)

      act(() => {
        result.current.actions.moveLeft()
      })
      assert.equal(game.busLane, 0) // Clamped
    })

    test('moveRight increases lane but clamps at LANE_COUNT - 1', () => {
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      // Initial lane is 1
      assert.equal(game.busLane, 1)

      act(() => {
        result.current.actions.moveRight()
      })
      assert.equal(game.busLane, 2)

      act(() => {
        result.current.actions.moveRight()
      })
      assert.equal(game.busLane, LANE_COUNT - 1) // Clamped (assuming LANE_COUNT is 3)
    })
  })

  describe('Collision & Damage', () => {
    test('collision with OBSTACLE increases damage and plays SFX', () => {
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      // Setup obstacle in collision path
      // Bus is at lane 1, Y is BUS_Y_PERCENT (85) to BUS_Y_PERCENT + BUS_HEIGHT_PERCENT (95)
      game.obstacles.push({
        id: 'test-obs',
        lane: 1,
        y: BUS_Y_PERCENT + 1, // Within collision zone
        type: 'OBSTACLE',
        collided: false
      })

      act(() => {
        result.current.update(16)
      }) // Delta doesn't matter much for collision check logic if already positioned

      assert.equal(game.damage, 10, 'Damage should increase by 10')
      assert.equal(mockPlaySFX.mock.calls.length, 1)
      assert.deepEqual(mockPlaySFX.mock.calls[0].arguments, ['crash'])
      assert.equal(game.obstacles[0].collided, true)
    })

    test('collision with FUEL collects item and plays SFX', () => {
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      game.obstacles.push({
        id: 'test-fuel',
        lane: 1,
        y: BUS_Y_PERCENT + 1,
        type: 'FUEL',
        collided: false
      })

      act(() => {
        result.current.update(16)
      })

      assert.equal(game.damage, 0, 'Fuel should not cause damage')
      assert.deepEqual(game.itemsCollected, ['FUEL'])
      assert.equal(mockPlaySFX.mock.calls.length, 1)
      assert.deepEqual(mockPlaySFX.mock.calls[0].arguments, ['pickup'])
    })

    test('obstacles are removed when off-screen', () => {
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      game.obstacles.push({
        id: 'gone',
        lane: 0,
        y: 120, // Off screen
        type: 'OBSTACLE'
      })
      game.obstacles.push({
        id: 'stay',
        lane: 0,
        y: 100, // On screen edge
        type: 'OBSTACLE'
      })

      act(() => {
        result.current.update(16)
      })

      assert.equal(game.obstacles.length, 1)
      assert.equal(game.obstacles[0].id, 'stay')
    })
  })

  describe('Upgrades', () => {
    test('van_armor reduces damage to 2', () => {
      mockHasUpgrade.mock.mockImplementation((_, type) => type === 'van_armor')
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      game.obstacles.push({
        id: 'obs',
        lane: 1,
        y: BUS_Y_PERCENT + 1,
        type: 'OBSTACLE'
      })

      act(() => {
        result.current.update(16)
      })
      assert.equal(game.damage, 2, 'Armor should reduce damage to 2')
    })

    test('van_bullbar reduces damage to 5', () => {
      mockHasUpgrade.mock.mockImplementation(
        (_, type) => type === 'van_bullbar'
      )
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      game.obstacles.push({
        id: 'obs',
        lane: 1,
        y: BUS_Y_PERCENT + 1,
        type: 'OBSTACLE'
      })

      act(() => {
        result.current.update(16)
      })
      assert.equal(game.damage, 5, 'Bullbar should reduce damage to 5')
    })

    test('van_armor takes precedence over van_bullbar', () => {
      mockHasUpgrade.mock.mockImplementation(
        (_, type) => type === 'van_armor' || type === 'van_bullbar'
      )
      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      game.obstacles.push({
        id: 'obs',
        lane: 1,
        y: BUS_Y_PERCENT + 1,
        type: 'OBSTACLE'
      })

      act(() => {
        result.current.update(16)
      })
      assert.equal(game.damage, 2, 'Armor should take precedence')
    })
  })

  describe('Game Completion', () => {
    test('completes game when target distance reached', () => {
      const completeMock = mock.fn()
      mockUseGameState.mock.mockImplementation(() => ({
        player: { van: { upgrades: [] } },
        completeTravelMinigame: completeMock
      }))

      const { result } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      game.damage = 20
      game.itemsCollected = ['FUEL']
      game.distance = TARGET_DISTANCE

      act(() => {
        result.current.update(16)
      })

      assert.equal(game.isGameOver, true)
      assert.equal(completeMock.mock.calls.length, 1)
      assert.deepEqual(completeMock.mock.calls[0].arguments, [20, ['FUEL']])
    })
  })
})
