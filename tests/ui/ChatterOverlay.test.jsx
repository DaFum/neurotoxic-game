import { afterEach, expect, test, vi } from 'vitest'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { render, act } from '@testing-library/react'

// Setup mock before importing the component
const getRandomChatterMock = vi.hoisted(() =>
  vi.fn(() => ({ text: 'Test chatter', speaker: 'Test Speaker' }))
)

vi.mock('../../src/data/chatter', async () => {
  const { GAME_PHASES } = await import('../../src/context/gameConstants')
  return {
    getRandomChatter: getRandomChatterMock,
    CHATTER_DB: [],
    ALLOWED_DEFAULT_SCENES: [GAME_PHASES.GIG]
  }
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})
test('ChatterOverlay passes scene state to getRandomChatter', async () => {
  //  removed (handled by vitest env)

  vi.useFakeTimers({ apis: ['setTimeout', 'Date'] })

  const mockState = {
    currentScene: GAME_PHASES.GIG,
    band: { members: [] },
    player: { currentNodeId: 'none' },
    gameMap: { nodes: {} },
    social: {},
    lastGigStats: null,
    gigModifiers: {}
  }

  vi.doMock('../../src/context/GameState', () => ({
    useGameSelector: vi.fn(selector => selector(mockState))
  }))

  // Dynamic import to apply mock
  const { ChatterOverlay } =
    await import('../../src/components/ChatterOverlay.tsx')

  await act(async () => {
    render(<ChatterOverlay />)
  })

  // Fast-forward time to trigger chatter generation
  // The delay is min 8000ms.
  await act(async () => {
    vi.advanceTimersByTime(30000)
  })

  // Verify getRandomChatter was called
  expect(getRandomChatterMock).toHaveBeenCalled()

  // check the first call's first argument
  const callArgs = getRandomChatterMock.mock.calls[0][0]

  expect(callArgs.currentScene).toBe(GAME_PHASES.GIG)
})

test('ChatterOverlay passes the full player and band slices to getRandomChatter', async () => {
  // Chatter conditions read player money/van/day/fame and band harmony/luck/
  // inventory. A slice narrowed to `{ currentNodeId }` / `{ members }` made
  // `state.player.van.fuel` throw, so no chatter line was ever selected.
  vi.resetModules()
  vi.useFakeTimers({ apis: ['setTimeout', 'Date'] })

  const mockState = {
    currentScene: GAME_PHASES.OVERWORLD,
    band: { members: [], harmony: 20, luck: 4, inventory: { strings: false } },
    player: {
      currentNodeId: 'none',
      money: 50,
      day: 1,
      van: { fuel: 10, condition: 90 }
    },
    gameMap: { nodes: {}, connections: [] },
    social: {},
    lastGigStats: null,
    gigModifiers: {}
  }

  vi.doMock('../../src/context/GameState', () => ({
    useGameSelector: vi.fn(selector => selector(mockState))
  }))

  const { ChatterOverlay } =
    await import('../../src/components/ChatterOverlay.tsx')

  await act(async () => {
    render(<ChatterOverlay />)
  })

  await act(async () => {
    vi.advanceTimersByTime(30000)
  })

  expect(getRandomChatterMock).toHaveBeenCalled()
  const callArgs = getRandomChatterMock.mock.calls[0][0]
  expect(callArgs.player).toBe(mockState.player)
  expect(callArgs.band).toBe(mockState.band)
  expect(callArgs.gameMap).toBe(mockState.gameMap)
  expect(callArgs.player.van.fuel).toBe(10)
  expect(callArgs.band.harmony).toBe(20)
})
