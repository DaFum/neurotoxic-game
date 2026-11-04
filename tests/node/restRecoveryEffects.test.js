import test from 'node:test'
import assert from 'node:assert/strict'
import { getPendingRestEffects } from '../../src/utils/restRecoveryEffects.ts'
import {
  processLiabilityTick,
  processCrowdfundTick
} from '../../src/utils/assets/assetTicks.ts'
import { getAssetSaleQuote } from '../../src/utils/assets/assetSelectors/assetSaleQuote.ts'
import {
  getAssetTotalDailyRevenue,
  getAssetTotalUpkeep
} from '../../src/utils/assets/assetSelectors/assetFinancials.ts'

const campaign = (overrides = {}) => ({
  id: 'campaign',
  assetSpec: { kind: 'studio_chassis', flavor: 'diy', chassisTier: 1 },
  targetAmount: 1000,
  fameStake: 20,
  daysRemaining: 2,
  plannedSuccessRoll: 0.1,
  plannedSuccessProbability: 0.8,
  materializedAssetId: 'reward',
  materializedSlotIds: [],
  ...overrides
})
const liability = (overrides = {}) => ({
  id: 'loan',
  assetId: 'asset',
  source: 'loan',
  principalRemaining: 1000,
  interestRate: 0,
  dailyPayment: 200,
  termDaysRemaining: 20,
  defaultCounter: 0,
  ...overrides
})

test('pending rest effects are empty with no liabilities or campaigns', () => {
  assert.deepEqual(getPendingRestEffects([], undefined, undefined, 1), {
    fameDrops: [],
    successes: []
  })
})

test('foreclosure timing uses the earliest liability per asset and charges fame once', () => {
  const effects = getPendingRestEffects(
    [],
    {
      first: liability({ defaultCounter: 1 }),
      second: liability({ id: 'second', defaultCounter: 6 }),
      other: liability({ id: 'other', assetId: 'other', defaultCounter: 0 })
    },
    [],
    1
  )
  assert.deepEqual(effects.fameDrops, [
    { restDay: 1, amount: 10 },
    { restDay: 7, amount: 10 }
  ])
})

test('predicted foreclosure day matches repeated real liability ticks', () => {
  let state = {
    player: { money: 0, fame: 100, fameLevel: 0 },
    assets: [],
    liabilities: { loan: liability({ defaultCounter: 4 }) }
  }
  const predicted = getPendingRestEffects(
    state.assets,
    state.liabilities,
    [],
    1
  ).fameDrops[0].restDay
  for (let day = 1; day <= predicted; day++) {
    state = processLiabilityTick(state).state
    assert.equal(state.player.fame, day < predicted ? 100 : 90)
  }
})

test('campaign prediction shares the real tick outcome, asset income and sale quote', () => {
  const pending = campaign()
  const effects = getPendingRestEffects([], {}, [pending], 10)
  assert.equal(effects.successes.length, 1)
  const success = effects.successes[0]
  assert.equal(success.restDay, 2)
  assert.equal(success.fame, 20)
  let state = {
    player: { money: 0, day: 10, fame: 100 },
    assets: [],
    crowdfundCampaigns: [pending]
  }
  state = processCrowdfundTick(state)
  assert.equal(state.player.fame, 100)
  state = processCrowdfundTick({
    ...state,
    player: { ...state.player, day: 11 }
  })
  assert.equal(state.player.fame, 120)
  const reward = state.assets[0]
  assert.equal(reward.acquiredOnDay, 11)
  assert.equal(
    success.dailyIncome,
    Math.max(0, getAssetTotalDailyRevenue(reward) - getAssetTotalUpkeep(reward))
  )
  assert.equal(success.saleProceeds, getAssetSaleQuote(reward, {}, 11).net)
  assert.equal(success.passiveFame, 0)
})

test('failed, due and overdue campaigns predict bounded fame drops on the correct rest', () => {
  for (const daysRemaining of [3, 0, -2]) {
    const pending = campaign({ daysRemaining, plannedSuccessRoll: 0.8 })
    const effects = getPendingRestEffects([], {}, [pending], 1)
    assert.deepEqual(effects, {
      fameDrops: [{ restDay: Math.max(1, daysRemaining), amount: 20 }],
      successes: []
    })
  }
})

test('non-finite counters, stakes and days never leak non-finite effects', () => {
  const effects = getPendingRestEffects(
    [],
    { loan: liability({ defaultCounter: NaN }) },
    [campaign({ fameStake: Infinity, daysRemaining: NaN })],
    Infinity
  )
  assert.deepEqual(effects.fameDrops, [{ restDay: 7, amount: 10 }])
  assert.equal(effects.successes[0].restDay, 1)
  assert.equal(effects.successes[0].fame, 0)
  assert.ok(Number.isFinite(effects.successes[0].saleProceeds))
})
