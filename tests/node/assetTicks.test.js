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
    player: { money: 10, fame: 50 }
  }
  const next = processLiabilityTick(state)
  assert.strictEqual(next.assets.length, 0)
  assert.strictEqual(next.liabilities.length, 0)
  assert.ok(next.player.fame < 50)
})

test('processCrowdfundTick - successful resolution awards money/fame and creates asset', () => {
  const state = {
    crowdfundCampaigns: [
      {
        id: 'c1',
        daysRemaining: 1,
        plannedSuccessRoll: 0.6,
        plannedSuccessProbability: 0.9,
        materializedAssetId: 'mat_a1',
        materializedSlotIds: [],
        targetAmount: 4000,
        fameStake: 50,
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'legit',
          chassisTier: 1
        }
      }
    ],
    player: { money: 100, fame: 30, day: 5 },
    assets: []
  }
  const next = processCrowdfundTick(state)
  // Campaign is removed (not lingering with resolvedOutcome set).
  assert.strictEqual(next.crowdfundCampaigns.length, 0)
  // Rewards applied.
  assert.strictEqual(next.player.money, 4100)
  assert.strictEqual(next.player.fame, 80)
})

test('processCrowdfundTick - failed resolution subtracts fameStake', () => {
  const state = {
    crowdfundCampaigns: [
      {
        id: 'c1',
        daysRemaining: 1,
        plannedSuccessRoll: 0.95,
        plannedSuccessProbability: 0.5,
        targetAmount: 4000,
        fameStake: 20,
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'legit',
          chassisTier: 1
        }
      }
    ],
    player: { money: 100, fame: 30, day: 5 },
    assets: []
  }
  const next = processCrowdfundTick(state)
  assert.strictEqual(next.crowdfundCampaigns.length, 0)
  assert.strictEqual(next.player.money, 100, 'no money awarded on fail')
  assert.strictEqual(next.player.fame, 10, 'fame stake deducted')
  assert.strictEqual(next.assets.length, 0, 'no asset created on fail')
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
