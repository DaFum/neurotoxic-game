import test from 'node:test'
import assert from 'node:assert'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer.ts'
import { gameReducer, ActionTypes } from '../../src/context/gameReducer.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'
import { createInitialState } from '../../src/context/initialState.ts'

test('AdvanceDay Integration - Assets Tick', () => {
  const initialState = {
    player: { money: 1000, day: 10, eventsTriggeredToday: 0 },
    band: { fame: 50, members: [] },
    social: { trend: 'neutral' },
    assets: [
      {
        id: 'a1',
        condition: 100,
        baseDailyRevenue: 50,
        baseUpkeep: 20,
        baseRiskEventChance: 0.1,
        slots: []
      }
    ],
    liabilities: [
      {
        id: 'l1',
        assetId: 'a1',
        principalRemaining: 500,
        dailyPayment: 50,
        termDaysRemaining: 10,
        defaultCounter: 0
      }
    ],
    crowdfundCampaigns: [],
    rngSeed: 12345,
    toasts: []
  }

  const payload = {
    dayRngStream: new Array(32).fill(0.99),
    nextRngSeed: 54321
  }

  const nextState = handleAdvanceDay(initialState, payload)

  assert.strictEqual(nextState.rngSeed, 54321)
  assert.strictEqual(nextState.assets[0].condition, 99.7)
  assert.strictEqual(nextState.liabilities[0].principalRemaining, 450)
  assert.strictEqual(nextState.liabilities[0].termDaysRemaining, 9)
  assert.strictEqual(nextState.player.money, 918)
})

test('AdvanceDay handler leaves zero-condition foreclosures to the action orchestrator', () => {
  const baseState = createInitialState()
  const initialState = {
    ...baseState,
    currentScene: GAME_PHASES.OVERWORLD,
    player: {
      ...baseState.player,
      money: 1000,
      day: 10,
      eventsTriggeredToday: 0
    },
    assets: [
      {
        id: 'broken_asset',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 0.3,
        baseDailyRevenue: 0,
        baseUpkeep: 20,
        baseRiskEventChance: 0,
        slots: [],
        acquiredOnDay: 1,
        acquisitionMode: 'cash'
      }
    ],
    liabilities: [
      {
        id: 'loan_broken_asset',
        source: 'loan',
        assetId: 'broken_asset',
        principalRemaining: 500,
        interestRate: 0.05,
        dailyPayment: 50,
        termDaysRemaining: 10,
        defaultCounter: 0
      }
    ],
    crowdfundCampaigns: [],
    rngSeed: 12345
  }

  const nextState = handleAdvanceDay(initialState, {
    dayRngStream: new Array(32).fill(0.99),
    nextRngSeed: 54321
  })

  assert.equal(
    nextState.assets.some(asset => asset.id === 'broken_asset'),
    true
  )
  assert.equal(
    nextState.liabilities.some(
      liability => liability.assetId === 'broken_asset'
    ),
    true
  )
})

test('AdvanceDay Integration - zero-condition assets are foreclosed through ASSET_FORECLOSED', () => {
  const baseState = createInitialState()
  const initialState = {
    ...baseState,
    currentScene: GAME_PHASES.OVERWORLD,
    player: {
      ...baseState.player,
      money: 1000,
      day: 10,
      eventsTriggeredToday: 0
    },
    assets: [
      {
        id: 'broken_asset',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 0.3,
        baseDailyRevenue: 0,
        baseUpkeep: 20,
        baseRiskEventChance: 0,
        slots: [],
        acquiredOnDay: 1,
        acquisitionMode: 'cash'
      }
    ],
    liabilities: [
      {
        id: 'loan_broken_asset',
        source: 'loan',
        assetId: 'broken_asset',
        principalRemaining: 500,
        interestRate: 0.05,
        dailyPayment: 50,
        termDaysRemaining: 10,
        defaultCounter: 0
      }
    ],
    crowdfundCampaigns: [],
    rngSeed: 12345
  }

  const nextState = gameReducer(initialState, {
    type: ActionTypes.ADVANCE_DAY,
    payload: {
      dayRngStream: new Array(32).fill(0.99),
      nextRngSeed: 54321
    }
  })

  assert.equal(
    nextState.assets.some(asset => asset.id === 'broken_asset'),
    false
  )
  assert.equal(
    nextState.liabilities.some(
      liability => liability.assetId === 'broken_asset'
    ),
    false
  )
})

test('AdvanceDay Integration - bankruptcy uses total daily obligations', () => {
  const initialState = {
    currentScene: GAME_PHASES.OVERWORLD,
    player: { money: 0, day: 10, eventsTriggeredToday: 0 },
    band: { fame: 50, members: [] },
    social: { trend: 'neutral' },
    assets: [
      {
        id: 'upkeep_asset',
        condition: 100,
        baseDailyRevenue: 0,
        baseUpkeep: 20,
        baseRiskEventChance: 0,
        slots: []
      }
    ],
    liabilities: [],
    crowdfundCampaigns: [],
    rngSeed: 12345,
    toasts: []
  }

  const nextState = handleAdvanceDay(initialState, {
    dayRngStream: new Array(32).fill(0.99),
    nextRngSeed: 54321
  })

  assert.equal(nextState.currentScene, GAME_PHASES.GAMEOVER)
})
