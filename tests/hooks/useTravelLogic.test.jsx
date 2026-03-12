import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTravelLogic } from '../../src/hooks/useTravelLogic.js'

vi.mock('../../src/utils/economyEngine.js', () => ({
  calculateTravelExpenses: () => ({ fuelLiters: 10, totalCost: 50, dist: 100 }),
  calculateRefuelCost: () => 20,
  calculateRepairCost: () => 30,
  EXPENSE_CONSTANTS: { TRANSPORT: { MAX_FUEL: 100 } }
}))

vi.mock('../../src/utils/mapUtils.js', () => ({
  isConnected: () => true,
  getNodeVisibility: () => 'visible',
  checkSoftlock: () => false,
  normalizeVenueId: v => v?.id || 'venue_id'
}))

vi.mock('../../src/utils/arrivalUtils.js', () => ({
  handleNodeArrival: () => {}
}))

vi.mock('../../src/utils/AudioManager.js', () => ({
  audioManager: { playSFX: () => {} }
}))

vi.mock('../../src/utils/logger.js', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
}))

vi.mock('../../src/utils/errorHandler.js', () => {
  class StateError extends Error {
    constructor(message, context = {}) {
      super(message)
      this.name = 'StateError'
      this.category = 'state'
      this.severity = 'high'
      this.context = context
      this.recoverable = true
    }
  }
  return {
    handleError: vi.fn(),
    StateError
  }
})

vi.mock('../../src/utils/upgradeUtils.js', () => ({
  calcBaseBreakdownChance: () => 0.05
}))

vi.mock('../../src/i18n.js', () => ({
  default: {
    t: (key, opts) => opts?.defaultValue || key
  }
}))

vi.mock('../../src/context/gameConstants.js', () => ({
  GAME_PHASES: { GAMEOVER: 'GAMEOVER' }
}))

vi.mock('../../src/utils/gameStateUtils.js', () => ({
  clampPlayerMoney: m => m,
  clampBandHarmony: h => h
}))

vi.mock('../../src/utils/locationI18n.js', () => ({
  translateLocation: (t, loc) => loc
}))

vi.mock('../../src/data/venues.js', () => ({
  ALL_VENUES: [{ id: 'venue_1', capacity: 100, name: 'Venue 1' }]
}))

describe('useTravelLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents playing a gig at the same location consecutively', async () => {
    const player = { currentNodeId: 'node_1', lastGigNodeId: 'node_1', money: 100, van: { fuel: 50 } }
    const band = { harmony: 10 }
    const gameMap = { nodes: { node_1: { id: 'node_1' } } }
    const updatePlayer = vi.fn()
    const updateBand = vi.fn()
    const saveGame = vi.fn()
    const advanceDay = vi.fn()
    const triggerEvent = vi.fn()
    const addToast = vi.fn()
    const changeScene = vi.fn()
    const startGig = vi.fn()

    const { result } = renderHook(() =>
      useTravelLogic({
        player,
        band,
        gameMap,
        updatePlayer,
        updateBand,
        saveGame,
        advanceDay,
        triggerEvent,
        startGig,
        addToast,
        changeScene
      })
    )

    act(() => {
      // Simulate clicking on the current node which is a GIG
      result.current.handleTravel({
        id: 'node_1',
        type: 'GIG',
        venue: { id: 'venue_1', capacity: 100, name: 'Venue 1' }
      })
    })

    expect(startGig).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      'You just played a gig here! Hit the road and find a new crowd.',
      'warning'
    )
  })

  it('tests error handling fallback in startGig for current node travel', async () => {
    const player = { currentNodeId: 'node_1', money: 100, van: { fuel: 50 } }
    const band = { harmony: 10 }
    const gameMap = { nodes: { node_1: { id: 'node_1' } } }
    const updatePlayer = vi.fn()
    const updateBand = vi.fn()
    const saveGame = vi.fn()
    const advanceDay = vi.fn()
    const triggerEvent = vi.fn()
    const addToast = vi.fn()
    const changeScene = vi.fn()

    // Create an error that will be thrown
    const testError = new Error('Gig Start Failed')
    const startGig = vi.fn(() => {
      throw testError
    })

    const { handleError } = await import('../../src/utils/errorHandler.js')

    const { result } = renderHook(() =>
      useTravelLogic({
        player,
        band,
        gameMap,
        updatePlayer,
        updateBand,
        saveGame,
        advanceDay,
        triggerEvent,
        startGig,
        addToast,
        changeScene
      })
    )

    act(() => {
      // Simulate clicking on the current node which is a GIG
      result.current.handleTravel({
        id: 'node_1',
        type: 'GIG',
        venue: { id: 'venue_1', capacity: 100, name: 'Venue 1' }
      })
    })

    expect(startGig).toHaveBeenCalledTimes(1)
    expect(handleError).toHaveBeenCalledTimes(1)

    const callArgs = handleError.mock.calls[0]
    expect(callArgs[0]).toBe(testError)
    expect(callArgs[1].fallbackMessage).toContain('Failed to enter Gig')
  })
})
