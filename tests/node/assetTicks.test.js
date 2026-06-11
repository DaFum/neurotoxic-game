import test from 'node:test'
import assert from 'node:assert'
import {
  processAssetTick,
  processLiabilityTick,
  processCrowdfundTick,
  rollAssetRiskEvents
} from '../../src/utils/assetTicks.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'
import { calculateFameLevel } from '../../src/utils/gameStateUtils.ts'

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

test('processAssetTick - applies passive fame, mood, and stamina asset boni', () => {
  const state = {
    assets: [
      {
        id: 'bandhaus_1',
        kind: 'bandhaus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 3,
        condition: 100,
        baseDailyRevenue: 0,
        baseUpkeep: 0,
        baseRiskEventChance: 0,
        acquiredOnDay: 1,
        acquisitionMode: 'cash',
        slots: [
          {
            slotType: 'bh_sleeping',
            id: 's_sleep',
            position: { x: 0, y: 0 },
            installedModuleId: 'bh_bunk_beds'
          },
          {
            slotType: 'bh_backyard',
            id: 's_yard',
            position: { x: 0, y: 0 },
            installedModuleId: 'bh_weed_garden'
          },
          {
            slotType: 'bh_secret',
            id: 's_secret',
            position: { x: 0, y: 0 },
            installedModuleId: 'bh_pirate_radio_antenna'
          }
        ]
      }
    ],
    player: { money: 100, fame: 399, fameLevel: 0 },
    band: {
      members: [
        {
          id: 'matze',
          mood: 10,
          stamina: 10,
          staminaMax: 20,
          traits: {},
          relationships: {}
        }
      ]
    }
  }

  const next = processAssetTick(state)

  assert.strictEqual(next.player.fame, 400)
  assert.strictEqual(next.player.fameLevel, 1)
  assert.strictEqual(next.band.members[0].mood, 12)
  assert.strictEqual(next.band.members[0].stamina, 13)
})

test('processLiabilityTick - liability default counter increment and trigger at 7 days', () => {
  const state = {
    assets: [{ id: 'a1', kind: 'tourbus_chassis', condition: 100, slots: [] }],
    liabilities: {
      l1: {
        id: 'l1',
        assetId: 'a1',
        dailyPayment: 50,
        principalRemaining: 1000,
        termDaysRemaining: 20,
        defaultCounter: 6
      }
    },
    player: { money: 10, fame: 50 }
  }
  const { state: next, foreclosedKinds } = processLiabilityTick(state)
  assert.strictEqual(next.assets.length, 0)
  assert.strictEqual(Object.keys(next.liabilities).length, 0)
  assert.ok(next.player.fame < 50)
  assert.strictEqual(
    next.player.fameLevel,
    calculateFameLevel(next.player.fame)
  )
  assert.deepStrictEqual(foreclosedKinds, ['tourbus_chassis'])
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
  assert.strictEqual(next.assets.length, 1)
  assert.strictEqual(next.assets[0].id, 'mat_a1')
  assert.strictEqual(next.assets[0].acquisitionMode, 'crowdfund')
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

test('processCrowdfundTick - drops campaigns for sections with existing assets', () => {
  const state = {
    crowdfundCampaigns: [
      {
        id: 'c1',
        daysRemaining: 1,
        plannedSuccessRoll: 0.1,
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
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        condition: 100,
        baseDailyRevenue: 0,
        baseUpkeep: 0,
        slots: []
      }
    ]
  }
  const next = processCrowdfundTick(state)

  assert.strictEqual(next.assets.length, 1)
  assert.strictEqual(next.crowdfundCampaigns.length, 0)
  assert.strictEqual(next.player.money, 100)
  assert.strictEqual(next.player.fame, 30)
})

test('processCrowdfundTick - keeps only one pending campaign per section', () => {
  const state = {
    crowdfundCampaigns: [
      {
        id: 'c1',
        daysRemaining: 3,
        plannedSuccessRoll: 0.1,
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
      },
      {
        id: 'c2',
        daysRemaining: 3,
        plannedSuccessRoll: 0.2,
        plannedSuccessProbability: 0.9,
        materializedAssetId: 'mat_a2',
        materializedSlotIds: [],
        targetAmount: 4000,
        fameStake: 50,
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'diy',
          chassisTier: 1
        }
      }
    ],
    player: { money: 100, fame: 30, day: 5 },
    assets: []
  }
  const next = processCrowdfundTick(state)

  assert.deepStrictEqual(
    next.crowdfundCampaigns.map(campaign => campaign.id),
    ['c1']
  )
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

test('rollAssetRiskEvents - reducesTheftRiskTravel removes theft from event selection', () => {
  const moduleId = 'test_theft_reducer'
  const original = MODULE_REGISTRY[moduleId]
  MODULE_REGISTRY[moduleId] = {
    id: moduleId,
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_front',
    flavor: 'diy',
    cost: 1,
    installCost: 0,
    removalRefundFraction: 0,
    boni: { reducesTheftRiskTravel: true },
    unlock: {},
    riskEventTypes: ['theft'],
    imagePromptKey: 'tb_smoke_screen'
  }

  try {
    const state = {
      assets: [
        {
          id: 'a1',
          condition: 100,
          baseRiskEventChance: 1,
          slots: [
            { slotType: 'tb_front', id: 's1', installedModuleId: moduleId }
          ]
        }
      ]
    }
    const result = rollAssetRiskEvents(state, [0, 0], 0)

    assert.strictEqual(result.events.length, 1)
    assert.notStrictEqual(result.events[0].eventType, 'theft')
    assert.strictEqual(result.events[0].eventType, 'fire')
  } finally {
    if (original) {
      MODULE_REGISTRY[moduleId] = original
    } else {
      delete MODULE_REGISTRY[moduleId]
    }
  }
})
