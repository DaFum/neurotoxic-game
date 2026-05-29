import test from 'node:test'
import assert from 'node:assert'
import {
  handlePurchaseChassis,
  handleInstallModule,
  handleRemoveModule,
  handleUpgradeChassisTier,
  handleSellChassis,
  handleRepairChassis,
  handleRefinanceLiability,
  handleStartCrowdfund,
  handleAssetFailedAction
} from '../../src/context/reducers/assetReducer.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

// MODULE_REGISTRY is a mutable shared module-scoped object. To prevent
// pollution into other test files run in the same process, snapshot the full
// registry and restore it after every test below.
const originalModuleRegistry = structuredClone(MODULE_REGISTRY)
const originalChassisConfig = structuredClone(CHASSIS_CONFIG)

const restoreChassisConfig = () => {
  for (const k of Object.keys(CHASSIS_CONFIG)) delete CHASSIS_CONFIG[k]
  Object.assign(CHASSIS_CONFIG, structuredClone(originalChassisConfig))
}

const restoreModuleRegistry = () => {
  for (const k of Object.keys(MODULE_REGISTRY)) delete MODULE_REGISTRY[k]
  Object.assign(MODULE_REGISTRY, structuredClone(originalModuleRegistry))
}

const installTestModule = () => {
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
}

test.beforeEach(() => {
  restoreChassisConfig()
  restoreModuleRegistry()
  installTestModule()
})

test.afterEach(() => {
  restoreChassisConfig()
  restoreModuleRegistry()
})

test.after(() => {
  restoreChassisConfig()
  restoreModuleRegistry()
})

const mockState = {
  player: { money: 1000, day: 10, fame: 100 },
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

test('handlePurchaseChassis - uses direct DIY config values', () => {
  const kind = 'tourbus_chassis'
  CHASSIS_CONFIG[kind].legit[1] = {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof'],
    baseRiskEventChance: 0.005
  }
  CHASSIS_CONFIG[kind].diy[1] = {
    price: 1500,
    upkeep: 7,
    revenue: 11,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.07
  }
  const configTier = CHASSIS_CONFIG[kind].diy[1]
  const slotIds = configTier.slots.map((_, i) => `slot_${i}`)

  const next = handlePurchaseChassis(mockState, {
    id: 'a1',
    kind,
    flavor: 'diy',
    tier: 1,
    mode: 'cash',
    slotIds,
    today: mockState.player.day
  })

  assert.strictEqual(next.assets[0].baseUpkeep, 7)
  assert.strictEqual(next.assets[0].baseDailyRevenue, 11)
  assert.strictEqual(next.assets[0].baseRiskEventChance, 0.07)
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

test('handleUpgradeChassisTier - never credits money for inverted tier prices', () => {
  CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
    price: 9000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof'],
    baseRiskEventChance: 0.005
  }
  CHASSIS_CONFIG.tourbus_chassis.legit[2] = {
    price: 1000,
    upkeep: 35,
    revenue: 0,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.005
  }
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 0 },
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

  assert.strictEqual(next.player.money, 0)
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

test('handleSellChassis - uses direct DIY config price', () => {
  CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof'],
    baseRiskEventChance: 0.005
  }
  CHASSIS_CONFIG.tourbus_chassis.diy[1] = {
    price: 1234,
    upkeep: 7,
    revenue: 11,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.07
  }
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        chassisFlavor: 'diy',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: 7,
        baseDailyRevenue: 11,
        slots: [],
        acquiredOnDay: mockState.player.day,
        acquisitionMode: 'cash',
        baseRiskEventChance: 0.07
      }
    ]
  }

  const next = handleSellChassis(startState, { assetId: 'a1' })

  assert.strictEqual(next.player.money, mockState.player.money + 1234)
})

test('handleSellChassis - pays off all liabilities for the sold asset', () => {
  const configTier = CHASSIS_CONFIG.tourbus_chassis.legit[1]
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: configTier.upkeep,
        baseDailyRevenue: configTier.revenue,
        slots: [],
        acquiredOnDay: mockState.player.day,
        acquisitionMode: 'loan',
        baseRiskEventChance: configTier.baseRiskEventChance
      }
    ],
    liabilities: [
      { id: 'loan_1', assetId: 'a1', principalRemaining: 300 },
      { id: 'loan_2', assetId: 'a1', principalRemaining: 400 },
      { id: 'loan_other', assetId: 'other_asset', principalRemaining: 250 }
    ]
  }

  const next = handleSellChassis(startState, { assetId: 'a1' })

  assert.strictEqual(
    next.player.money,
    mockState.player.money + configTier.price - 700
  )
  assert.deepStrictEqual(
    next.liabilities.map(liability => liability.id),
    ['loan_other']
  )
})

test('handleSellChassis - ignores non-finite liability principal when computing payoff', () => {
  const configTier = CHASSIS_CONFIG.tourbus_chassis.legit[1]
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: configTier.upkeep,
        baseDailyRevenue: configTier.revenue,
        slots: [],
        acquiredOnDay: mockState.player.day,
        acquisitionMode: 'loan',
        baseRiskEventChance: configTier.baseRiskEventChance
      }
    ],
    liabilities: [
      { id: 'loan_1', assetId: 'a1', principalRemaining: 300 },
      { id: 'loan_nan', assetId: 'a1', principalRemaining: Number.NaN },
      {
        id: 'loan_inf',
        assetId: 'a1',
        principalRemaining: Number.POSITIVE_INFINITY
      }
    ]
  }

  const next = handleSellChassis(startState, { assetId: 'a1' })

  assert.strictEqual(
    next.player.money,
    mockState.player.money + configTier.price - 300
  )
})

test('handleAssetFailedAction - is no-op', () => {
  const next = handleAssetFailedAction(mockState)
  assert.strictEqual(next, mockState)
})

test('handleRefinanceLiability - re-amortizes loan and charges fee', () => {
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 1000 },
    liabilities: [
      {
        id: 'loan_1',
        source: 'loan',
        assetId: 'asset_1',
        principalRemaining: 1000,
        interestRate: 0.08,
        dailyPayment: 20,
        termDaysRemaining: 40,
        defaultCounter: 0
      }
    ]
  }

  const next = handleRefinanceLiability(startState, {
    liabilityId: 'loan_1',
    loanProfileId: 'longTerm',
    fee: 20
  })

  assert.strictEqual(next.player.money, 980)
  assert.strictEqual(next.liabilities[0].interestRate, 0.04)
  assert.strictEqual(next.liabilities[0].termDaysRemaining, 180)
  assert.strictEqual(next.liabilities[0].defaultCounter, 0)
  assert.ok(next.liabilities[0].dailyPayment < 20)
})

test('handleRefinanceLiability - rejects loans already in default countdown', () => {
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 1000 },
    liabilities: [
      {
        id: 'loan_1',
        source: 'loan',
        assetId: 'asset_1',
        principalRemaining: 1000,
        interestRate: 0.08,
        dailyPayment: 20,
        termDaysRemaining: 40,
        defaultCounter: 3
      }
    ]
  }

  const next = handleRefinanceLiability(startState, {
    liabilityId: 'loan_1',
    loanProfileId: 'longTerm',
    fee: 20
  })

  assert.strictEqual(next, startState)
})

test('handleRefinanceLiability - derives fee from principal instead of trusting payload', () => {
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 1000 },
    liabilities: [
      {
        id: 'loan_1',
        source: 'loan',
        assetId: 'asset_1',
        principalRemaining: 1000,
        interestRate: 0.08,
        dailyPayment: 20,
        termDaysRemaining: 40,
        defaultCounter: 0
      }
    ]
  }

  const next = handleRefinanceLiability(startState, {
    liabilityId: 'loan_1',
    loanProfileId: 'longTerm',
    fee: 0
  })

  assert.strictEqual(next.player.money, 980)
})

test('handleRefinanceLiability - rejects ineligible loan profile payloads', () => {
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 1000, fame: 0 },
    social: { scenePresence: 0 },
    liabilities: [
      {
        id: 'loan_1',
        source: 'loan',
        assetId: 'asset_1',
        principalRemaining: 1000,
        interestRate: 0.08,
        dailyPayment: 20,
        termDaysRemaining: 40,
        defaultCounter: 0
      }
    ]
  }

  const next = handleRefinanceLiability(startState, {
    liabilityId: 'loan_1',
    loanProfileId: 'coop',
    fee: 20
  })

  assert.strictEqual(next, startState)
})
