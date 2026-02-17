import { mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook } from '@testing-library/react'

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

export const mockTravelLogicDependencies = {
  mockCalculateTravelExpenses,
  mockAudioManager,
  mockLogger,
  mockHandleError
}

export const setupTravelLogicTest = async () => {
  const { useTravelLogic } = await import('../src/hooks/useTravelLogic.js')
  return { useTravelLogic }
}

/**
 * Creates props for useTravelLogic.
 * Note: overrides are shallow merged. You must merge nested objects (like player) yourself.
 */
export const createTravelLogicProps = (overrides = {}) => ({
  player: {
    money: 1000,
    currentNodeId: 'node_start',
    van: { fuel: 50, condition: 80 },
    totalTravels: 0
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

export const assertActionSuccess = (
  props,
  mockAudioManager,
  updateAssertions
) => {
  assert.equal(props.updatePlayer.mock.calls.length, 1)
  const updateArg = props.updatePlayer.mock.calls[0].arguments[0]
  updateAssertions(updateArg)
  assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
}

export const assertTravelPrevented = (result, props, expectedErrorRegex) => {
  assert.equal(result.current.isTraveling, false)
  const hasErrorToast = props.addToast.mock.calls.some(
    call =>
      typeof call.arguments[0] === 'string' &&
      expectedErrorRegex.test(call.arguments[0])
  )
  assert.ok(
    hasErrorToast,
    `Expected toast matching ${expectedErrorRegex} not found`
  )
}

/**
 * Setup travel scenario.
 * Requires JSDOM environment (call setupJSDOM() before using).
 */
export const setupTravelScenario = (useTravelLogic, propsOverrides = {}) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(
      'setupTravelScenario requires a DOM environment. Please call setupJSDOM() before running this test.'
    )
  }
  const props = createTravelLogicProps(propsOverrides)
  const targetNode = props.gameMap.nodes.node_target

  const { result } = renderHook(() => useTravelLogic(props))

  return { result, props, targetNode }
}
