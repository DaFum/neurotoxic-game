import test from 'node:test'
import assert from 'node:assert'
import {
  handlePurchaseChassis,
  handleInstallModule,
  handleRemoveModule,
  handleUpgradeChassisTier,
  handleRepairChassis,
  handleResolveCrowdfund,
  handleStartCrowdfund,
  handleAssetFailedAction
} from '../../src/context/reducers/assetReducer.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

// MODULE_REGISTRY is a mutable shared module-scoped object. To prevent
// pollution into other test files run in the same process, snapshot the
// original 'test_mod' entry (if any) and restore it after every test below.
// If the entry didn't exist, we delete the injected one.
const originalTestMod = MODULE_REGISTRY['test_mod']
const originalChassisConfig = structuredClone(CHASSIS_CONFIG)
// @ts-expect-error test mock — minimal AssetModule shape
MODULE_REGISTRY['test_mod'] = {
  id: 'test_mod',
  ownerKind: 'tourbus_chassis',
  slotType: 'tb_roof',
  flavor: 'legit',
  cost: 100,
  installCost: 50,
  removalRefundFraction: 0.5,
  boni: {},
  unlock: {},
  imagePromptKey: 'test'
}

test.after(() => {
  for (const k of Object.keys(CHASSIS_CONFIG)) delete CHASSIS_CONFIG[k]
  Object.assign(CHASSIS_CONFIG, originalChassisConfig)
  if (originalTestMod === undefined) {
    delete MODULE_REGISTRY['test_mod']
  } else {
    MODULE_REGISTRY['test_mod'] = originalTestMod
  }
})

const mockState = {
  player: { money: 1000, day: 10 },
  band: { fame: 100 },
  assets: [],
  liabilities: [],
  crowdfundCampaigns: []
}

const makeCampaign = (overrides = {}) => ({
  id: 'camp_1',
  assetSpec: {
    kind: 'tourbus_chassis',
    flavor: 'legit',
    chassisTier: 1,
    ...overrides.assetSpec
  },
  targetAmount: 4000,
  fameStake: 20,
  daysRemaining: 14,
  plannedSuccessRoll: 0.4,
  plannedSuccessProbability: 0.5,
  materializedAssetId: 'campaign_asset',
  materializedSlotIds: [],
  ...overrides
})

test('handlePurchaseChassis - happy path cash', () => {
  const kind = 'tourbus_chassis'
  const configTier = CHASSIS_CONFIG[kind].legit[1]
  const slotIds = configTier.slots.map((_, i) => `slot_${i}`)

  const payload = {
    id: 'a1',
    kind,
    flavor: 'legit',
    tier: 1,
    mode: 'cash',
    slotIds,
    today: mockState.player.day
  }

  const next = handlePurchaseChassis(mockState, payload)
  assert.strictEqual(next.assets[0].id, 'a1')
})

test('handlePurchaseChassis - rejects when a campaign is pending for the same section', () => {
  const kind = 'tourbus_chassis'
  const configTier = CHASSIS_CONFIG[kind].legit[1]
  const slotIds = configTier.slots.map((_, i) => `slot_${i}`)
  const startState = {
    ...mockState,
    crowdfundCampaigns: [makeCampaign()]
  }

  const next = handlePurchaseChassis(startState, {
    id: 'a1',
    kind,
    flavor: 'legit',
    tier: 1,
    mode: 'cash',
    slotIds,
    today: mockState.player.day
  })

  assert.strictEqual(next, startState)
})

test('handleStartCrowdfund - rejects when an asset already exists for the same section', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: 20,
        baseDailyRevenue: 0,
        slots: [],
        acquiredOnDay: 1,
        acquisitionMode: 'cash',
        baseRiskEventChance: 0.005
      }
    ]
  }

  const next = handleStartCrowdfund(startState, {
    campaign: makeCampaign()
  })

  assert.strictEqual(next, startState)
})

test('handleResolveCrowdfund - drops success when section asset already exists', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: 20,
        baseDailyRevenue: 0,
        slots: [],
        acquiredOnDay: 1,
        acquisitionMode: 'cash',
        baseRiskEventChance: 0.005
      }
    ],
    crowdfundCampaigns: [makeCampaign()]
  }

  const next = handleResolveCrowdfund(startState, {
    campaignId: 'camp_1',
    outcome: 'success',
    newAssetId: 'a2',
    newSlotIds: []
  })

  assert.strictEqual(next.assets.length, 1)
  assert.strictEqual(next.player.fame, startState.player.fame)
  assert.strictEqual(next.crowdfundCampaigns.length, 0)
})

test('handleInstallModule - happy path', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        slots: [{ id: 's1', slotType: 'tb_roof', installedModuleId: null }]
      }
    ]
  }

  const next = handleInstallModule(startState, {
    assetId: 'a1',
    slotId: 's1',
    moduleId: 'test_mod'
  })
  assert.strictEqual(next.assets[0].slots[0].installedModuleId, 'test_mod')
})

test('handleInstallModule - rejects insufficient funds', () => {
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 100 },
    assets: [
      {
        id: 'a1',
        slots: [{ id: 's1', slotType: 'tb_roof', installedModuleId: null }]
      }
    ]
  }

  const next = handleInstallModule(startState, {
    assetId: 'a1',
    slotId: 's1',
    moduleId: 'test_mod'
  })
  assert.strictEqual(next, startState)
})

test('handleUpgradeChassisTier - rejects insufficient funds', () => {
  CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof'],
    baseRiskEventChance: 0.005
  }
  CHASSIS_CONFIG.tourbus_chassis.legit[2] = {
    price: 9000,
    upkeep: 35,
    revenue: 0,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.005
  }
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 100 },
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: 20,
        baseDailyRevenue: 0,
        slots: [{ id: 's1', slotType: 'tb_roof', installedModuleId: null }],
        acquiredOnDay: 1,
        acquisitionMode: 'cash',
        baseRiskEventChance: 0.005
      }
    ]
  }

  const next = handleUpgradeChassisTier(startState, {
    assetId: 'a1',
    targetTier: 2,
    newSlotIds: [{ id: 's2', slotType: 'tb_front' }]
  })
  assert.strictEqual(next, startState)
})

test('handleRepairChassis - rejects insufficient funds', () => {
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 10 },
    assets: [
      {
        id: 'a1',
        condition: 50,
        slots: []
      }
    ]
  }

  const next = handleRepairChassis(startState, { assetId: 'a1' })
  assert.strictEqual(next, startState)
})

test('handleRemoveModule - cleans up added child slots and refunds', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        slots: [
          { id: 's1', installedModuleId: 'test_mod' },
          { id: 's2', addedByModuleId: 'test_mod' }
        ]
      }
    ]
  }

  const next = handleRemoveModule(startState, { assetId: 'a1', slotId: 's1' })
  assert.strictEqual(next.assets[0].slots.length, 1)
  // test_mod is registered with cost: 100, removalRefundFraction: 0.5 →
  // refund of 50 added to the starting 1000.
  assert.strictEqual(next.player.money, mockState.player.money + 50)
})

test('handleResolveCrowdfund - updates player fame and uses direct DIY config', () => {
  CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof'],
    baseRiskEventChance: 0.005
  }
  CHASSIS_CONFIG.tourbus_chassis.diy[1] = {
    price: 1500,
    upkeep: 7,
    revenue: 11,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.07
  }
  const startState = {
    ...mockState,
    player: { ...mockState.player, fame: 10 },
    band: { ...mockState.band, fame: 99 },
    crowdfundCampaigns: [
      {
        id: 'camp_1',
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'diy',
          chassisTier: 1
        },
        targetAmount: 1500,
        fameStake: 7,
        daysRemaining: 0,
        plannedSuccessRoll: 0.1,
        plannedSuccessProbability: 0.5,
        materializedAssetId: 'new_asset',
        materializedSlotIds: ['s1', 's2']
      }
    ]
  }

  const next = handleResolveCrowdfund(startState, {
    campaignId: 'camp_1',
    outcome: 'success',
    newAssetId: 'new_asset',
    newSlotIds: [
      { id: 's1', slotType: 'tb_roof' },
      { id: 's2', slotType: 'tb_front' }
    ]
  })

  assert.strictEqual(next.player.fame, 17)
  assert.strictEqual(next.band.fame, 99)
  assert.strictEqual(next.assets[0].baseUpkeep, 7)
  assert.strictEqual(next.assets[0].baseDailyRevenue, 11)
  assert.strictEqual(next.assets[0].slots.length, 2)
})

test('handleAssetFailedAction - is no-op', () => {
  const next = handleAssetFailedAction(mockState)
  assert.strictEqual(next, mockState)
})
