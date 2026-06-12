import { beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook } from '@testing-library/react'
import { MODULE_REGISTRY } from '../src/utils/assetModuleRegistry.ts'

// Mocks
const mockCalculateTravelExpenses = mock.fn()
const mockExpenseConstants = {
  TRANSPORT: {
    FUEL_PRICE: 2,
    MAX_FUEL: 100,
    REPAIR_COST_PER_UNIT: 5
  }
}

const calculateRefuelCostDefault = currentFuel => {
  const missing = Math.max(
    0,
    mockExpenseConstants.TRANSPORT.MAX_FUEL - currentFuel
  )
  return Math.ceil(missing * mockExpenseConstants.TRANSPORT.FUEL_PRICE)
}
const mockCalculateRefuelCost = mock.fn(calculateRefuelCostDefault)

const mockCalculateRepairCost = mock.fn(currentCondition => {
  const missing = Math.max(0, 100 - currentCondition)
  return Math.ceil(
    missing * mockExpenseConstants.TRANSPORT.REPAIR_COST_PER_UNIT
  )
})

const guaranteedDailyCostDefault = (player, band, social = 0) => {
  const socialLevel = typeof social === 'number' ? social : 0
  const bandSize = Array.isArray(band?.members) ? band.members.length : 3
  const fameLevel = player?.fameLevel || 0
  return (
    62 + bandSize * 8 + Math.floor(Math.pow(fameLevel, 1.4) * 15) + socialLevel
  )
}

const mockCalculateGuaranteedDailyCost = mock.fn(guaranteedDailyCostDefault)

const finiteNumberOrZero = value =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const getActiveAssetModifiersDefault = assets => {
  const modifiers = { fuelMultiplier: 1 }
  const assetList = Array.isArray(assets) ? assets : []

  for (const asset of assetList) {
    if ((asset?.condition ?? 100) < 20) continue
    const slots = Array.isArray(asset?.slots) ? asset.slots : []
    for (const slot of slots) {
      const installedModuleId = slot?.installedModuleId
      if (!installedModuleId) continue
      const module = MODULE_REGISTRY[installedModuleId]
      const fuelMultiplier = module?.boni?.fuelMultiplier
      if (
        typeof fuelMultiplier === 'number' &&
        Number.isFinite(fuelMultiplier)
      ) {
        modifiers.fuelMultiplier *= fuelMultiplier
      }
    }
  }

  return modifiers
}

const mockGetActiveAssetModifiers = mock.fn(getActiveAssetModifiersDefault)

const getTotalDailyObligationsDefault = state => {
  const base = mockCalculateGuaranteedDailyCost(
    state?.player,
    state?.band,
    state?.social
  )
  const assets = Array.isArray(state?.assets) ? state.assets : []
  const liabilities = state?.liabilities ? Object.values(state.liabilities) : []

  let assetUpkeep = 0
  let assetRevenue = 0
  for (const asset of assets) {
    assetUpkeep += finiteNumberOrZero(asset?.baseUpkeep)
    if ((asset?.condition ?? 100) >= 20) {
      assetRevenue += finiteNumberOrZero(asset?.baseDailyRevenue)
    }
  }

  let liabilityPayments = 0
  for (const liability of liabilities) {
    liabilityPayments += finiteNumberOrZero(liability?.dailyPayment)
  }

  return base + assetUpkeep - assetRevenue + liabilityPayments
}

const mockGetTotalDailyObligations = mock.fn(getTotalDailyObligationsDefault)

let ensureAudioContextResult = true

const ensureAudioContextDefault = async () => ensureAudioContextResult
const playSFXDefault = () => {}
const warnAudioNotAvailableDefault = () => {}

const mockAudioManager = {
  playSFX: mock.fn(playSFXDefault),
  ensureAudioContext: mock.fn(ensureAudioContextDefault),
  warnAudioNotAvailable: mock.fn(warnAudioNotAvailableDefault)
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
mock.module(new URL('../src/utils/economyEngine.ts', import.meta.url).href, {
  namedExports: {
    calculateTravelExpenses: mockCalculateTravelExpenses,
    calculateRefuelCost: mockCalculateRefuelCost,
    calculateRepairCost: mockCalculateRepairCost,
    calculateTravelMinigameResult: mock.fn(),
    calculateRoadieMinigameResult: mock.fn(),
    EXPENSE_CONSTANTS: mockExpenseConstants,
    calculateGuaranteedDailyCost: mockCalculateGuaranteedDailyCost
  }
})

const calculateChassisGrossSaleValueDefault = () => 0
const mockCalculateChassisGrossSaleValue = mock.fn(
  calculateChassisGrossSaleValueDefault
)

mock.module(new URL('../src/utils/assetSelectors.ts', import.meta.url).href, {
  namedExports: {
    getActiveAssetModifiers: mockGetActiveAssetModifiers,
    getTotalDailyObligations: mockGetTotalDailyObligations,
    calculateChassisGrossSaleValue: mockCalculateChassisGrossSaleValue
  }
})

mock.module(
  new URL('../src/utils/audio/AudioManager.ts', import.meta.url).href,
  {
    namedExports: {
      audioManager: mockAudioManager
    }
  }
)

mock.module(
  new URL('../src/utils/audio/audioEngine.ts', import.meta.url).href,
  {
    namedExports: {
      audioManager: mockAudioManager,
      audioService: mockAudioManager
    }
  }
)

mock.module(new URL('../src/utils/simulationUtils.ts', import.meta.url).href, {
  namedExports: {}
})

mock.module(new URL('../src/utils/logger.ts', import.meta.url).href, {
  namedExports: {
    logger: mockLogger,
    isValidLogLevel: mock.fn(() => true),
    LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 }
  }
})

mock.module(new URL('../src/utils/errorHandler.ts', import.meta.url).href, {
  namedExports: {
    handleError: mockHandleError,
    StateError: MockStateError
  }
})

export const resetTravelLogicMockState = () => {
  ensureAudioContextResult = true
  mockCalculateGuaranteedDailyCost.mock.mockImplementation(
    guaranteedDailyCostDefault
  )
  mockCalculateGuaranteedDailyCost.mock.resetCalls()
  mockGetActiveAssetModifiers.mock.mockImplementation(
    getActiveAssetModifiersDefault
  )
  mockGetActiveAssetModifiers.mock.resetCalls()
  mockGetTotalDailyObligations.mock.mockImplementation(
    getTotalDailyObligationsDefault
  )
  mockCalculateChassisGrossSaleValue.mock.mockImplementation(
    calculateChassisGrossSaleValueDefault
  )
  mockCalculateChassisGrossSaleValue.mock.resetCalls()
  mockGetTotalDailyObligations.mock.resetCalls()
  mockCalculateRefuelCost.mock.mockImplementation(calculateRefuelCostDefault)
  mockCalculateRefuelCost.mock.resetCalls()
  mockAudioManager.ensureAudioContext.mock.mockImplementation(
    ensureAudioContextDefault
  )
  mockAudioManager.ensureAudioContext.mock.resetCalls()
  mockAudioManager.playSFX.mock.mockImplementation(playSFXDefault)
  mockAudioManager.playSFX.mock.resetCalls()
  mockAudioManager.warnAudioNotAvailable.mock.mockImplementation(
    warnAudioNotAvailableDefault
  )
  mockAudioManager.warnAudioNotAvailable.mock.resetCalls()
}

beforeEach(resetTravelLogicMockState)

export const mockTravelLogicDependencies = {
  mockCalculateTravelExpenses,
  mockCalculateRefuelCost,
  mockAudioManager,
  mockCalculateGuaranteedDailyCost,
  mockGetTotalDailyObligations,
  mockCalculateChassisGrossSaleValue,
  mockLogger,
  mockHandleError,
  setEnsureAudioContextResult: value => {
    ensureAudioContextResult = value
  }
}

export const setupTravelLogicTest = async () => {
  const { useTravelLogic } = await import('../src/hooks/useTravelLogic')
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
  assets: [],
  liabilities: {},
  gameMap: {
    nodes: {
      node_start: {
        id: 'node_start',
        layer: 0,
        type: 'START',
        venue: { id: 'hq_club', name: 'HQ' }
      },
      node_target: {
        id: 'node_target',
        layer: 1,
        type: 'GIG',
        venue: { id: 'club_stage', name: 'Club' }
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
