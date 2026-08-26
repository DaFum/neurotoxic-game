import {
  describe,
  it as test,
  beforeEach,
  afterEach,
  vi as mock,
  expect
} from 'vitest'

import { GAME_PHASES } from '../../src/context/gameConstants'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'

// Mock dependencies
const mockCompleteRoadieMinigame = mock.fn()
const mockChangeScene = mock.fn()
const mockUseGameState = mock.fn(() => ({
  completeRoadieMinigame: mockCompleteRoadieMinigame,
  currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
  band: { stash: {} },
  changeScene: mockChangeScene
}))
const mockUseGameActions = () => {
  const state = mockUseGameState()
  return {
    completeRoadieMinigame: state.completeRoadieMinigame,
    changeScene: state.changeScene
  }
}

mock.mock('../../src/context/GameState', () => ({
  useGameState: mockUseGameState,
  useGameActions: mockUseGameActions,
  useGameSelector: selector => selector(mockUseGameState())
}))

const mockPlaySFX = mock.fn()
mock.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: { playSFX: mockPlaySFX }
}))

const { useRoadieLogic } =
  await import('../../src/hooks/minigames/useRoadieLogic')
const { ROADIE_GRID_WIDTH, ROADIE_GRID_HEIGHT, ROADIE_MOVE_COOLDOWN_BASE } =
  await import('../../src/hooks/minigames/minigameConstants')

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

    // The move cooldown runs on accumulated ticker time, not the host clock, so
    // clearing it means advancing gameplay time. Timers advance alongside for
    // the hook's own scene-transition timeout.
    const advanceGameplay = ms => {
      mock.advanceTimersByTime(ms)
      game.elapsedMS += ms
    }

    // 1. Initialization
    expect(game.playerPos).toEqual({ x: 6, y: 0 })
    expect(game.equipmentDamage).toBe(0)
    expect(game.isGameOver).toBe(false)
    expect(game.carrying).toBeTruthy()
    expect(result.current.uiState.itemsRemaining).toBe(2)

    advanceGameplay(1000)

    // 2. Movement and bounds
    act(() => {
      result.current.actions.move(1, 0)
    })
    expect(game.playerPos).toEqual({ x: 7, y: 0 })
    advanceGameplay(1000)

    act(() => {
      result.current.actions.move(-1, 0)
    })
    expect(game.playerPos).toEqual({ x: 6, y: 0 })
    advanceGameplay(1000)

    game.playerPos.x = 0
    act(() => {
      result.current.actions.move(-1, 0)
    })
    expect(game.playerPos).toEqual({ x: 0, y: 0 })
    advanceGameplay(1000)

    // Right Boundary
    game.playerPos.x = ROADIE_GRID_WIDTH - 1
    act(() => {
      result.current.actions.move(1, 0)
    })
    expect(game.playerPos).toEqual({ x: ROADIE_GRID_WIDTH - 1, y: 0 })
    advanceGameplay(1000)

    // Up Boundary
    game.playerPos.y = 0
    act(() => {
      result.current.actions.move(0, -1)
    })
    expect(game.playerPos).toEqual({ x: ROADIE_GRID_WIDTH - 1, y: 0 })
    advanceGameplay(1000)

    // Down Boundary
    game.playerPos.y = ROADIE_GRID_HEIGHT - 1
    act(() => {
      result.current.actions.move(0, 1)
    })
    expect(game.playerPos).toEqual({
      x: ROADIE_GRID_WIDTH - 1,
      y: ROADIE_GRID_HEIGHT - 1
    })
    advanceGameplay(1000)

    // 3. Deliver item at venue
    game.carrying = { id: 'amp', type: 'AMP', weight: 2 }
    game.itemsDelivered = []
    mockPlaySFX.mockClear()
    game.playerPos = { x: 6, y: ROADIE_GRID_HEIGHT - 2 }
    advanceGameplay(1000)
    const beforeDeliverCount = mockPlaySFX.mock.calls.length
    act(() => {
      result.current.actions.move(0, 1)
    })
    expect(game.playerPos.y).toBe(ROADIE_GRID_HEIGHT - 1)
    expect(game.carrying).toBe(null)
    expect(game.itemsDelivered.length).toBe(1)

    expect(mockPlaySFX.mock.calls[beforeDeliverCount][0]).toBe('deliver')

    advanceGameplay(1000)

    // 4. Pick up item at start
    game.carrying = null
    game.playerPos = { x: 6, y: 1 }
    const beforePickupCount = mockPlaySFX.mock.calls.length

    act(() => {
      result.current.actions.move(0, -1)
    })
    expect(game.playerPos.y).toBe(0)
    expect(game.carrying).toBeTruthy()

    expect(mockPlaySFX.mock.calls.length).toBe(beforePickupCount + 1)
    expect(mockPlaySFX.mock.calls[beforePickupCount][0]).toBe('pickup')
    advanceGameplay(1000)

    // 5. Spawn traffic
    game.traffic = []
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.update(100)
      })
    }
    expect(game.traffic.length).toBeGreaterThan(0)

    // 6. Handle collision and damage
    game.playerPos = { x: 6, y: 1 }
    game.traffic = [{ id: 'test-car', row: 1, x: 6.0, speed: 0, width: 1.5 }]
    const playSFXCallCountBeforeCrash = mockPlaySFX.mock.calls.length
    act(() => {
      result.current.update(16)
    })
    expect(game.equipmentDamage).toBe(10)
    expect(game.playerPos).toEqual({ x: 6, y: 0 })
    expect(mockPlaySFX.mock.calls.length).toBe(playSFXCallCountBeforeCrash + 1)
    expect(mockPlaySFX.mock.calls[playSFXCallCountBeforeCrash][0]).toBe('crash')

    // 7. Trigger game over on completion
    game.itemsToDeliver = []
    game.carrying = { id: 'last-item', weight: 1 }
    game.playerPos = { x: 6, y: ROADIE_GRID_HEIGHT - 2 }
    advanceGameplay(1000)
    act(() => {
      result.current.actions.move(0, 1)
    })
    expect(game.isGameOver).toBe(true)
    expect(mockCompleteRoadieMinigame.mock.calls.length).toBe(1)
    expect(mockCompleteRoadieMinigame.mock.calls[0][0]).toBe(10) // equipmentDamage

    expect(mockChangeScene.mock.calls.length).toBe(0) // Routing is deferred to useArrivalLogic

    unmount()
  })

  test('move cooldown ignores wall-clock jumps in both directions', () => {
    const { result, unmount } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current
    // Carry a weight-1 item so the cooldown is exactly ROADIE_MOVE_COOLDOWN_BASE
    // and the pickup row can't swap in a heavier one mid-test.
    game.carrying = { id: 'guitar', type: 'GUITAR', weight: 1 }

    act(() => {
      result.current.actions.move(1, 0)
    })
    expect(game.playerPos.x).toBe(7)

    // Jumping the host clock forward must not buy a free move: only ticker
    // deltas advance the cooldown.
    mock.setSystemTime(new Date(Date.now() + 60 * 60 * 1000))
    act(() => {
      result.current.actions.move(1, 0)
    })
    expect(game.playerPos.x).toBe(7)

    // ...and jumping it backwards must not wedge input either.
    mock.setSystemTime(new Date(Date.now() - 2 * 60 * 60 * 1000))
    act(() => {
      result.current.update(ROADIE_MOVE_COOLDOWN_BASE)
      result.current.actions.move(1, 0)
    })
    expect(game.playerPos.x).toBe(8)

    unmount()
  })

  test('a negative ticker delta cannot rewind the simulation', () => {
    // A paused-tab resume can report a negative delta. Left unclamped it would
    // rewind gameplay time (letting a queued move slip through early), heal
    // contraband damage, push spawn timers backwards and reverse traffic.
    const { result, unmount } = renderHook(() => useRoadieLogic())
    const game = result.current.gameStateRef.current
    game.carrying = { id: 'stash', type: 'CONTRABAND', weight: 1 }

    // Spawn rates run 1400-2800ms, so one short tick leaves the road empty.
    // The roadie stays on row 0, which carries no traffic, so nothing crashes.
    act(() => {
      result.current.update(1000)
      result.current.update(1000)
      result.current.update(1000)
    })

    const before = {
      elapsedMS: game.elapsedMS,
      equipmentDamage: game.equipmentDamage,
      timers: game.spawners.map(s => s.timer),
      carX: game.traffic.map(car => car.x)
    }
    expect(before.equipmentDamage).toBeGreaterThan(0)
    expect(before.carX.length).toBeGreaterThan(0)

    act(() => {
      result.current.update(-5000)
    })

    expect(game.elapsedMS).toBe(before.elapsedMS)
    expect(game.equipmentDamage).toBe(before.equipmentDamage)
    expect(game.spawners.map(s => s.timer)).toEqual(before.timers)
    expect(game.traffic.map(car => car.x)).toEqual(before.carX)

    unmount()
  })
})
