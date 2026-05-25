import test from 'node:test'
import assert from 'node:assert'
import {
  processAssetTick,
  processLiabilityTick,
  processCrowdfundTick,
  rollAssetRiskEvents
} from '../../src/utils/assetTicks.ts'

test('processAssetTick - condition decay and condition floor at 0', () => {
  const state = {
    assets: [
      {
        id: 'a1',
        condition: 0.2,
        baseDailyRevenue: 0,
        baseUpkeep: 0,
        slots: [{ slotType: 'tb_roof', id: 's1', installedModuleId: null }]
      },
      {
        id: 'a2',
        condition: 10,
        baseDailyRevenue: 0,
        baseUpkeep: 0,
        slots: [{ slotType: 'tb_roof', id: 's1', installedModuleId: null }]
      }
    ],
    player: { money: 100 }
  }
  const next = processAssetTick(state)
  assert.strictEqual(next.assets[0].condition, 0)
  assert.strictEqual(next.assets[1].condition, 9.7)
})

test('processLiabilityTick - liability default counter increment and trigger at 7 days', () => {
  const state = {
    assets: [{ id: 'a1', condition: 100, slots: [] }],
    liabilities: [
      {
        id: 'l1',
        assetId: 'a1',
        dailyPayment: 50,
        principalRemaining: 1000,
        termDaysRemaining: 20,
        defaultCounter: 6
      }
    ],
    player: { money: 10 },
    band: { fame: 50 }
  }
  const next = processLiabilityTick(state)
  assert.strictEqual(next.assets.length, 0)
  assert.strictEqual(next.liabilities.length, 0)
  assert.ok(next.band.fame < 50)
})

test('processCrowdfundTick - crowdfund resolution on day 0', () => {
  const state = {
    crowdfundCampaigns: [
      { id: 'c1', daysRemaining: 1, plannedSuccessRoll: 0.6 }
    ],
    player: { money: 100 }
  }
  const next = processCrowdfundTick(state)
  assert.strictEqual(next.crowdfundCampaigns[0].daysRemaining, 0)
  assert.strictEqual(next.crowdfundCampaigns[0].resolvedOutcome, 'success')
})

test('rollAssetRiskEvents - deterministic risk event triggering', () => {
  const state = {
    assets: [
      {
        id: 'a1',
        condition: 100,
        baseRiskEventChance: 0.5,
        slots: [{ slotType: 'tb_roof', id: 's1', installedModuleId: null }]
      }
    ]
  }
  const stream = [0.1, 0.5]
  const result = rollAssetRiskEvents(state, stream, 0)
  assert.strictEqual(result.cursor, 1)
  assert.strictEqual(result.state.assets[0].condition, 85)
})
