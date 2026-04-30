import {
  describe,
  it as test,
  beforeEach,
  afterEach,
  vi as mock,
  expect
} from 'vitest'

import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'

// Mock dependencies
const mockUseGameState = mock.fn(() => ({
  player: { van: { upgrades: [] } },
  completeTravelMinigame: mock.fn()
}))

mock.mock('../../src/context/GameState', () => ({
  useGameState: mockUseGameState
}))

const mockPlaySFX = mock.fn()
mock.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: { playSFX: mockPlaySFX }
}))

const mockHasUpgrade = mock.fn(() => false)
mock.mock('../../src/utils/upgradeUtils', () => ({
  hasUpgrade: mockHasUpgrade
}))

const {
  useTourbusLogic,
  BASE_SPEED,
  MAX_SPEED,
  SPAWN_RATE_MS,
  TARGET_DISTANCE,
  getHitDamage
} = await import('../../src/hooks/minigames/useTourbusLogic')
const { TOURBUS_LANE_COUNT, TOURBUS_BUS_Y_PERCENT } =
  await import('../../src/hooks/minigames/constants')

describe('getHitDamage', () => {
  beforeEach(() => {
    mockHasUpgrade.mockImplementation(() => false)
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  test('returns HIT_DAMAGE_ARMOR when van_armor upgrade is present', () => {
    mockHasUpgrade.mockImplementation((_, type) => type === 'van_armor')
    expect(getHitDamage([])).toBe(2)
  })

  test('returns HIT_DAMAGE_BULLBAR when van_bullbar upgrade is present', () => {
    mockHasUpgrade.mockImplementation((_, type) => type === 'van_bullbar')
    expect(getHitDamage([])).toBe(5)
  })

  test('returns HIT_DAMAGE_BASE when no damage reduction upgrades are present', () => {
    expect(getHitDamage([])).toBe(10)
  })
})

describe('useTourbusLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    mockUseGameState.mockImplementation(() => ({
      player: { van: { upgrades: [] } },
      completeTravelMinigame: mock.fn()
    }))
    mockPlaySFX.mockClear()
    mockHasUpgrade.mockImplementation(() => false)
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.clearAllMocks()
  })

  test('spawn rate maintains constant density and movements clamp correctly', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Spawn rate
    expect(game.speed).toBe(BASE_SPEED)
    game.lastSpawnTime = 0
    game.obstacles = []

    act(() => {
      result.current.update(SPAWN_RATE_MS - 10)
    })
    expect(game.obstacles.length).toBe(0)
    act(() => {
      result.current.update(20)
    })
    expect(game.obstacles.length).toBe(1)

    // Max speed
    game.distance = TARGET_DISTANCE * 0.8
    game.obstacles = []
    game.lastSpawnTime = 0
    act(() => {
      result.current.update(0)
    })
    expect(game.speed).toBe(MAX_SPEED)
    const expectedRate = (BASE_SPEED * SPAWN_RATE_MS) / MAX_SPEED
    act(() => {
      result.current.update(expectedRate - 25)
    })
    expect(game.obstacles.length).toBe(0)
    act(() => {
      result.current.update(50)
    })
    expect(game.obstacles.length).toBe(1)

    // Movement
    expect(game.busLane).toBe(1)
    act(() => {
      result.current.actions.moveLeft()
    })
    expect(game.busLane).toBe(0)
    act(() => {
      result.current.actions.moveLeft()
    })
    expect(game.busLane).toBe(0) // Clamped
    act(() => {
      result.current.actions.moveRight()
    })
    expect(game.busLane).toBe(1)
    act(() => {
      result.current.actions.moveRight()
    })
    expect(game.busLane).toBe(2)
    act(() => {
      result.current.actions.moveRight()
    })
    expect(game.busLane).toBe(TOURBUS_LANE_COUNT - 1)

    unmount()
  })

  test('collision, items, off-screen cleanup, and game completion work correctly', () => {
    const completeMock = mock.fn()
    mockUseGameState.mockImplementation(() => ({
      player: { van: { upgrades: [] } },
      completeTravelMinigame: completeMock
    }))

    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Collisions
    game.busLane = 1
    game.obstacles = [
      {
        id: 'obs1',
        lane: 1,
        y: TOURBUS_BUS_Y_PERCENT + 1,
        type: 'OBSTACLE',
        collided: false
      },
      {
        id: 'fuel1',
        lane: 1,
        y: TOURBUS_BUS_Y_PERCENT + 1,
        type: 'FUEL',
        collided: false
      },
      { id: 'gone', lane: 0, y: 120, type: 'OBSTACLE' }
    ]

    act(() => {
      result.current.update(16)
    })

    expect(game.damage).toBe(10) // 10 from obstacle
    expect(game.itemsCollected).toEqual(['FUEL'])
    expect(mockPlaySFX.mock.calls.length).toBe(2)
    // Check specific sfx calls (not necessarily array-ordering sensitive, but here they run left-to-right on array map or iteration, let's just check they both exist. Actually, let's check array exactly to match request)
    expect(
      mockPlaySFX.mock.calls.map(call => call[0]).sort(),
      ['crash', 'pickup'].sort()
    )
    expect(game.obstacles.length).toBe(2) // "gone" is removed
    expect(game.obstacles.some(o => o.id === 'gone')).toBe(false)
    expect(game.obstacles.find(o => o.id === 'obs1')?.collided).toBe(true)
    expect(game.obstacles.find(o => o.id === 'fuel1')?.collided).toBe(true)

    // Game Completion
    game.distance = TARGET_DISTANCE
    act(() => {
      result.current.update(16)
    })
    expect(game.isGameOver).toBe(true)
    expect(completeMock.mock.calls.length).toBe(1)
    expect(completeMock.mock.calls[0]).toEqual([10, ['FUEL']])

    unmount()
  })

  test('armor and bullbar upgrades reduce damage correctly', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Bullbar (reduces to 5)
    mockHasUpgrade.mockImplementation((_, type) => type === 'van_bullbar')
    game.obstacles = [
      {
        id: 'obs1',
        lane: 1,
        y: TOURBUS_BUS_Y_PERCENT + 1,
        type: 'OBSTACLE',
        collided: false
      }
    ]
    game.damage = 0
    act(() => {
      result.current.update(16)
    })
    expect(game.damage).toBe(5)

    // Armor (reduces to 2) - armor takes precedence
    mockHasUpgrade.mockImplementation(
      (_, type) => type === 'van_armor' || type === 'van_bullbar'
    )
    game.obstacles = [
      {
        id: 'obs2',
        lane: 1,
        y: TOURBUS_BUS_Y_PERCENT + 1,
        type: 'OBSTACLE',
        collided: false
      }
    ]
    game.damage = 0
    act(() => {
      result.current.update(16)
    })
    expect(game.damage).toBe(2)

    unmount()
  })

  test('finishMinigame completes travel only once when update also reaches the target distance', () => {
    const completeMock = mock.fn()
    mockUseGameState.mockImplementation(() => ({
      player: { van: { upgrades: [] } },
      completeTravelMinigame: completeMock
    }))

    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current
    game.distance = TARGET_DISTANCE
    game.damage = 12
    game.itemsCollected = ['FUEL']

    act(() => {
      result.current.finishMinigame()
      result.current.update(16)
      result.current.finishMinigame()
    })

    expect(game.isGameOver).toBe(true)
    expect(completeMock).toHaveBeenCalledTimes(1)
    expect(completeMock).toHaveBeenCalledWith(12, ['FUEL'])

    unmount()
  })
})
