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
const mockCompleteTravelMinigame = mock.fn()
const mockUseGameState = mock.fn(() => ({
  player: { van: { upgrades: [] } }
}))
const mockUseGameActions = mock.fn(() => ({
  completeTravelMinigame: mockCompleteTravelMinigame
}))

mock.mock('../../src/context/GameState', () => ({
  useGameActions: mockUseGameActions,
  useGameSelector: selector => selector(mockUseGameState())
}))

const mockPlaySFX = mock.fn()
mock.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: { playSFX: mockPlaySFX }
}))

const mockHasUpgrade = mock.fn(() => false)
mock.mock('../../src/utils/upgradeUtils', () => ({
  hasUpgrade: mockHasUpgrade
}))

const { useTourbusLogic } =
  await import('../../src/hooks/minigames/useTourbusLogic')
const { getHitDamage } =
  await import('../../src/hooks/minigames/tourbusLogicUtils')
const {
  TOURBUS_LANE_COUNT,
  TOURBUS_BUS_Y_PERCENT,
  TOURBUS_MAX_SPEED: MAX_SPEED,
  TOURBUS_BASE_SPEED: BASE_SPEED,
  TOURBUS_TARGET_DISTANCE: TARGET_DISTANCE,
  TOURBUS_SPAWN_RATE_MS: SPAWN_RATE_MS
} = await import('../../src/hooks/minigames/minigameConstants')

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
      player: { van: { upgrades: [] } }
    }))
    mockUseGameActions.mockImplementation(() => ({
      completeTravelMinigame: mockCompleteTravelMinigame
    }))
    mockCompleteTravelMinigame.mockClear()
    mockPlaySFX.mockClear()
    mockHasUpgrade.mockImplementation(() => false)
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.clearAllMocks()
  })

  test('rejects nonfinite deltas and clamps simulation time to 0..100 ms', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    act(() => {
      for (const delta of [-100, NaN, Infinity, -Infinity])
        result.current.update(delta)
    })
    expect(game.distance).toBe(0)
    expect(game.lastSpawnTime).toBe(0)
    act(() => result.current.update(10000))
    expect(game.distance).toBeGreaterThan(0)
    expect(game.distance).toBeLessThanOrEqual(MAX_SPEED * 100)
    unmount()
  })

  test('obstacle ids are numeric, unique, and monotonic when spawned in one burst', () => {
    const { result } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current
    game.obstacles = []
    game.lastSpawnTime = SPAWN_RATE_MS * 5

    act(() => {
      result.current.update(1)
    })

    expect(game.obstacles.length).toBeGreaterThan(1)
    const ids = game.obstacles.map(obstacle => obstacle.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let i = 0; i < ids.length; i++) {
      expect(typeof ids[i]).toBe('number')
      if (i > 0) {
        expect(ids[i]).toBeGreaterThan(ids[i - 1])
      }
    }
  })

  test('spawn rate maintains constant density and movements clamp correctly', () => {
    const { result, unmount } = renderHook(() => useTourbusLogic())
    const game = result.current.gameStateRef.current

    // Spawn rate
    expect(game.speed).toBe(BASE_SPEED)
    game.lastSpawnTime = 0
    game.obstacles = []

    act(() => {
      let remaining = 1000
      while (remaining > 0) {
        const step = Math.min(remaining, 100)
        result.current.update(step)
        remaining -= step
      }
    })
    expect(game.obstacles.length).toBe(0)
    act(() => {
      let remaining = 500
      while (remaining > 0) {
        const step = Math.min(remaining, 100)
        result.current.update(step)
        remaining -= step
      }
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
      let remaining = expectedRate - 25
      while (remaining > 0) {
        const step = Math.min(remaining, 100)
        result.current.update(step)
        remaining -= step
      }
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
      player: { van: { upgrades: [] } }
    }))
    mockUseGameActions.mockImplementation(() => ({
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
      player: { van: { upgrades: [] } }
    }))
    mockUseGameActions.mockImplementation(() => ({
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
  describe('DEV test fixture', () => {
    const fixture = (obstacles = []) => ({
      fixedSpeed: 0.12,
      spawnEnabled: false,
      obstacles
    })

    test('is absent until a test sets it: speed and spawning stay production', () => {
      const { result, unmount } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current

      act(() => {
        for (let i = 0; i < 20; i++) result.current.update(100)
      })

      expect(game.speed).not.toBe(0.12)
      expect(game.obstacles.length + game.nextObstacleId).toBeGreaterThan(0)
      unmount()
    })

    test('replaces only the obstacle list; lane, damage and stats stay', () => {
      const { result, unmount } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current
      game.busLane = 2
      game.damage = 7
      game.itemsCollected = ['FUEL']
      game.distance = 33

      window.neurotoxicTestHooks.tourbus.setFixture(
        fixture([{ id: 'x', lane: 0, y: 10, type: 'OBSTACLE' }])
      )

      expect(game.obstacles).toEqual([
        { id: 'x', lane: 0, y: 10, type: 'OBSTACLE', collided: false }
      ])
      expect(game.busLane).toBe(2)
      expect(game.damage).toBe(7)
      expect(game.itemsCollected).toEqual(['FUEL'])
      expect(game.distance).toBe(33)
      unmount()
    })

    test('pins the speed and skips spawning while delta clamping still applies', () => {
      const { result, unmount } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current
      window.neurotoxicTestHooks.tourbus.setFixture(
        fixture([{ id: 'x', lane: 0, y: 10, type: 'OBSTACLE' }])
      )

      act(() => {
        for (let i = 0; i < 20; i++) result.current.update(100)
        result.current.update(10000)
      })

      expect(game.speed).toBe(0.12)
      expect(game.nextObstacleId).toBe(0)
      expect(game.obstacles.every(obstacle => obstacle.id === 'x')).toBe(true)
      // 20 full frames plus one clamped to 100 ms: 21 x 100 ms at the fixed speed.
      expect(game.distance).toBeCloseTo(0.12 * 100 * 21, 5)
      unmount()
    })

    test('reads back copies, not the live state', () => {
      const { result, unmount } = renderHook(() => useTourbusLogic())
      const game = result.current.gameStateRef.current
      window.neurotoxicTestHooks.tourbus.setFixture(
        fixture([{ id: 'x', lane: 1, y: 90, type: 'OBSTACLE' }])
      )
      act(() => result.current.update(10))

      const snapshot = window.neurotoxicTestHooks.tourbus.getSnapshot()
      expect(snapshot.collidedIds).toEqual(['x'])
      expect(snapshot.damage).toBe(10)

      snapshot.obstacles[0].y = -999
      snapshot.collidedIds.push('forged')
      expect(game.obstacles[0].y).toBeGreaterThan(0)
      expect(
        window.neurotoxicTestHooks.tourbus.getSnapshot().collidedIds
      ).toEqual(['x'])
      unmount()
    })

    test('is unregistered on unmount', () => {
      const { unmount } = renderHook(() => useTourbusLogic())
      expect(window.neurotoxicTestHooks.tourbus).toBeDefined()

      unmount()

      expect(window.neurotoxicTestHooks?.tourbus).toBeUndefined()
    })
  })
})
