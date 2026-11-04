import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import {
  advanceDay,
  createUpdateBandAction,
  createBloodBankDonateAction
} from '../../src/context/actionCreators.ts'
import {
  getTotalDailyObligations,
  getActiveAssetModifiers
} from '../../src/utils/assets/assetSelectors.ts'
import { getSellableAssets } from '../../src/utils/travelSoftlockUtils.ts'
import {
  checkSoftlock,
  calculateTravelCashRequired
} from '../../src/utils/mapUtils.ts'
import { calculateTravelExpenses } from '../../src/utils/economy/index.ts'
import {
  REST_STAMINA_GAIN,
  GAME_PHASES
} from '../../src/context/gameConstants.ts'

const map = {
  nodes: { A: { id: 'A', x: 10, y: 10 }, B: { id: 'B', x: 20, y: 10 } },
  connections: [{ from: 'A', to: 'B' }]
}
const buildState = harmony => {
  const initial = createInitialState()
  return {
    ...initial,
    currentScene: GAME_PHASES.OVERWORLD,
    completedMilestones: [
      'survive_1_week',
      'survive_2_weeks',
      'survive_1_month'
    ],
    player: {
      ...initial.player,
      day: 30,
      fame: 0,
      fameLevel: 0,
      money: 165,
      currentNodeId: 'A',
      van: { ...initial.player.van, fuel: 100 }
    },
    band: {
      ...initial.band,
      harmony,
      members: initial.band.members.map(m => ({ ...m, stamina: 0 }))
    },
    assets: [
      {
        id: 'financed',
        kind: 'studio_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseDailyRevenue: 0,
        baseUpkeep: 0,
        baseRiskEventChance: 0,
        acquiredOnDay: 1,
        acquisitionMode: 'loan',
        slots: []
      }
    ],
    liabilities: {
      loan: {
        id: 'loan',
        assetId: 'financed',
        principalRemaining: 10000,
        interestRate: 0.05,
        dailyPayment: 200,
        termDaysRemaining: 100,
        defaultCounter: 6
      }
    }
  }
}
const context = state => ({
  dailyObligations: getTotalDailyObligations(state),
  assetModifiers: getActiveAssetModifiers(state.assets),
  restRecovery: {
    social: state.social,
    assets: state.assets,
    liabilities: state.liabilities
  }
})
const rest = state => {
  const rested = gameReducer(
    state,
    createUpdateBandAction({
      members: state.band.members.map(m => ({
        ...m,
        stamina: Math.min(m.staminaMax ?? 100, m.stamina + REST_STAMINA_GAIN),
        mood: Math.max(0, m.mood - 10)
      }))
    })
  )
  return gameReducer(rested, advanceDay(rested))
}
const required = state =>
  calculateTravelCashRequired(
    calculateTravelExpenses(map.nodes.B, map.nodes.A, state.player, state.band)
      .totalCost,
    getTotalDailyObligations(state)
  )

test('foreclosure skips an unpaid installment before living costs and enables rest then blood', () => {
  const state = buildState(80)
  assert.deepEqual(
    getSellableAssets(state.assets, state.liabilities, state.player.day),
    []
  )
  assert.equal(
    checkSoftlock(map, state.player, state.band, {
      dailyObligations: getTotalDailyObligations(state)
    }),
    true
  )
  assert.equal(
    checkSoftlock(map, state.player, state.band, context(state)),
    false
  )
  const next = rest(state)
  assert.deepEqual(next.assets, [])
  assert.deepEqual(next.liabilities, {})
  const living = getTotalDailyObligations(next)
  assert.equal(next.player.money, state.player.money - living)
  assert.equal(next.currentScene, GAME_PHASES.OVERWORLD)
  assert.ok(!next.terminalOutcome)
  const donated = gameReducer(
    next,
    createBloodBankDonateAction({ kind: 'blood' })
  )
  assert.equal(donated.player.money - next.player.money, 100)
  assert.ok(donated.player.money >= required(donated))
})

test('foreclosure alone does not rescue a band unable to raise the trip cash', () => {
  const state = buildState(1)
  assert.equal(
    checkSoftlock(map, state.player, state.band, context(state)),
    true
  )
  const next = rest(state)
  assert.ok(next.player.money < required(next))
})
