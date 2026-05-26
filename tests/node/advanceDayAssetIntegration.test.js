import test from 'node:test'
import assert from 'node:assert'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer.ts'

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
