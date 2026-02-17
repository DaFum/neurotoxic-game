import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

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
