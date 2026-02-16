import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { JSDOM } from 'jsdom'

// Mocks
const mockCalculateTravelExpenses = mock.fn()
const mockExpenseConstants = {
  TRANSPORT: {
    FUEL_PRICE: 2,
    MAX_FUEL: 100,
    REPAIR_COST_PER_UNIT: 5
  }
}

const mockAudioManager = {
  playSFX: mock.fn()
}

const mockLogger = {
  info: mock.fn(),
  error: mock.fn(),
  debug: mock.fn(),
  warn: mock.fn()
}

const mockHandleError = mock.fn()
class MockStateError extends Error {}

// Mock modules
mock.module('../src/utils/economyEngine', {
  namedExports: {
    calculateTravelExpenses: mockCalculateTravelExpenses,
    EXPENSE_CONSTANTS: mockExpenseConstants
  }
})

mock.module('../src/utils/AudioManager', {
  namedExports: {
    audioManager: mockAudioManager
  }
})

mock.module('../src/utils/logger', {
  namedExports: {
    logger: mockLogger
  }
})

mock.module('../src/utils/errorHandler', {
  namedExports: {
    handleError: mockHandleError,
    StateError: MockStateError
  }
})

// Dynamically import the hook after mocking
const { useTravelLogic } = await import('../src/hooks/useTravelLogic.js')

describe('useTravelLogic', () => {
  let dom
  let originalGlobalDescriptors

  beforeEach(() => {
    // Reset mocks
    mockCalculateTravelExpenses.mock.resetCalls()
    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))
    mockAudioManager.playSFX.mock.resetCalls()
    mockLogger.info.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockHandleError.mock.resetCalls()

    // JSDOM setup
    originalGlobalDescriptors = new Map(
      ['window', 'document', 'navigator'].map(key => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key)
      ])
    )
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost'
    })
    for (const [key, value] of [
      ['window', dom.window],
      ['document', dom.window.document],
      ['navigator', dom.window.navigator]
    ]) {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true
      })
    }

    // Polyfill requestAnimationFrame for React
    globalThis.requestAnimationFrame = callback => setTimeout(callback, 0)
    globalThis.cancelAnimationFrame = id => clearTimeout(id)
  })

  afterEach(() => {
    cleanup()
    if (dom) {
      dom.window.close()
    }
    for (const key of ['window', 'document', 'navigator']) {
      const descriptor = originalGlobalDescriptors?.get(key)
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor)
      } else {
        delete globalThis[key]
      }
    }
    originalGlobalDescriptors = null
    dom = null
  })

  const createProps = (overrides = {}) => ({
    player: {
      money: 1000,
      currentNodeId: 'node_start',
      van: { fuel: 50, condition: 80 },
      citiesVisited: 0
    },
    band: { members: [], harmony: 50 },
    gameMap: {
      nodes: {
        node_start: {
          id: 'node_start',
          layer: 0,
          type: 'START',
          venue: { name: 'HQ' }
        },
        node_target: {
          id: 'node_target',
          layer: 1,
          type: 'GIG',
          venue: { name: 'Club' }
        }
      },
      connections: [{ from: 'node_start', to: 'node_target' }]
    },
    updatePlayer: mock.fn(),
    updateBand: mock.fn(),
    saveGame: mock.fn(),
    advanceDay: mock.fn(),
    triggerEvent: mock.fn(),
    startGig: mock.fn(),
    hasUpgrade: mock.fn(() => false),
    addToast: mock.fn(),
    changeScene: mock.fn(),
    onShowHQ: mock.fn(),
    ...overrides
  })

  test('initial state', () => {
    const props = createProps()
    const { result } = renderHook(() => useTravelLogic(props))

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)
  })

  test('handleTravel initiates travel when valid', () => {
    const props = createProps()
    const targetNode = props.gameMap.nodes.node_target

    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, true)
    assert.deepEqual(result.current.travelTarget, targetNode)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
    assert.equal(mockAudioManager.playSFX.mock.calls[0].arguments[0], 'travel')
  })

  test('handleTravel prevents travel if insufficient funds', () => {
    const props = createProps({
      player: { ...createProps().player, money: 10 }
    })
    const targetNode = props.gameMap.nodes.node_target

    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(props.addToast.mock.calls.length, 2) // Info + Error
    assert.match(props.addToast.mock.calls[1].arguments[0], /Not enough money/)
  })

  test('handleTravel prevents travel if insufficient fuel', () => {
    const props = createProps({
      player: {
        ...createProps().player,
        van: { ...createProps().player.van, fuel: 5 }
      }
    })
    const targetNode = props.gameMap.nodes.node_target

    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(props.addToast.mock.calls.length, 2) // Info + Error
    assert.match(props.addToast.mock.calls[1].arguments[0], /Not enough fuel/)
  })

  test('handleTravel to current node triggers interaction', () => {
    const props = createProps()
    const currentNode = props.gameMap.nodes.node_start
    // node_start is type START, so it should trigger onShowHQ

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleTravel(currentNode)
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(props.onShowHQ.mock.calls.length, 1)
  })

  test('onTravelComplete updates state and finalizes travel', () => {
    const props = createProps()
    const targetNode = props.gameMap.nodes.node_target

    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))

    const { result } = renderHook(() => useTravelLogic(props))

    // Start travel
    act(() => {
      result.current.handleTravel(targetNode)
    })

    // Complete travel
    act(() => {
      result.current.onTravelComplete()
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)

    // Check player updates
    assert.equal(props.updatePlayer.mock.calls.length, 1)
    const updateArg = props.updatePlayer.mock.calls[0].arguments[0]
    assert.equal(updateArg.currentNodeId, targetNode.id)
    assert.equal(updateArg.money, 950) // 1000 - 50
    assert.equal(updateArg.van.fuel, 40) // 50 - 10
    assert.equal(updateArg.citiesVisited, 1)

    assert.equal(props.advanceDay.mock.calls.length, 1)
    assert.equal(props.saveGame.mock.calls.length, 1)
  })

  test('handleRefuel fills tank and deducts money', () => {
    const props = createProps({
      player: { ...createProps().player, money: 1000, van: { fuel: 50 } }
    })
    // Missing 50 fuel. Price is 2 per unit. Cost = 100.

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleRefuel()
    })

    assert.equal(props.updatePlayer.mock.calls.length, 1)
    const updateArg = props.updatePlayer.mock.calls[0].arguments[0]
    assert.equal(updateArg.money, 900)
    assert.equal(updateArg.van.fuel, 100)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
  })

  test('handleRepair fixes van and deducts money', () => {
    const props = createProps({
      player: { ...createProps().player, money: 1000, van: { condition: 80 } }
    })
    // Missing 20 condition. Price is 5 per unit. Cost = 100.

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleRepair()
    })

    assert.equal(props.updatePlayer.mock.calls.length, 1)
    const updateArg = props.updatePlayer.mock.calls[0].arguments[0]
    assert.equal(updateArg.money, 900)
    assert.equal(updateArg.van.condition, 100)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
  })
})
