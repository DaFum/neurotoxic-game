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
  handleAssetForeclosed
} from '../../src/context/reducers/assetReducer.ts'
import {
  installModule,
  purchaseChassis,
  refinanceLiability,
  repairChassis,
  startCrowdfund,
  upgradeChassisTier
} from '../../src/context/assetActionCreators.ts'
import { processCrowdfundTick } from '../../src/utils/assetTicks.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import {
  MODULE_PROMPTS,
  MODULE_REGISTRY
} from '../../src/utils/assetModuleRegistry.ts'

const TEST_MODULE_ID = 'authority_test_mod'
test.after(() => {
  delete MODULE_REGISTRY[TEST_MODULE_ID]
  delete MODULE_PROMPTS[`prompt_${TEST_MODULE_ID}`]
})

// Hostile keys resolve through Object.prototype on plain indexing.
const HOSTILE_KEYS = ['constructor', 'toString', '__proto__', 'hasOwnProperty']

const mockState = {
  player: { money: 1000, day: 10, fame: 1000 },
  social: { scenePresence: 100 },
  assets: [],
  liabilities: {},
  crowdfundCampaigns: []
}

const makeLoanState = () => ({
  ...mockState,
  liabilities: {
    loan_1: {
      id: 'loan_1',
      source: 'loan',
      assetId: 'asset_1',
      principalRemaining: 1000,
      interestRate: 0.08,
      dailyPayment: 20,
      termDaysRemaining: 40,
      defaultCounter: 0
    }
  }
})

test('PURCHASE_CHASSIS - inherited loanProfileId keys are rejected (no zero-payment loan)', () => {
  const kind = 'tourbus_chassis'
  const slotIds = CHASSIS_CONFIG[kind].legit[1].slots.map((_, i) => `s_${i}`)
  for (const loanProfileId of HOSTILE_KEYS) {
    const next = handlePurchaseChassis(mockState, {
      id: 'a1',
      kind,
      flavor: 'legit',
      tier: 1,
      mode: 'loan',
      loanProfileId,
      slotIds,
      today: 10
    })
    assert.strictEqual(next, mockState, loanProfileId)
  }
})

test('REFINANCE_LIABILITY - inherited loanProfileId keys are rejected', () => {
  for (const loanProfileId of HOSTILE_KEYS) {
    const startState = makeLoanState()
    const next = handleRefinanceLiability(startState, {
      liabilityId: 'loan_1',
      loanProfileId,
      fee: 20
    })
    assert.strictEqual(next, startState, loanProfileId)
  }
})

test('PURCHASE_CHASSIS - inherited kind/flavor/tier keys are rejected', () => {
  const base = {
    id: 'a1',
    kind: 'tourbus_chassis',
    flavor: 'legit',
    tier: 1,
    mode: 'cash',
    slotIds: [],
    today: 10
  }
  const startState = {
    ...mockState,
    player: { ...mockState.player, money: 1_000_000 }
  }
  for (const key of HOSTILE_KEYS) {
    for (const field of ['kind', 'flavor', 'tier']) {
      const next = handlePurchaseChassis(startState, { ...base, [field]: key })
      assert.strictEqual(next, startState, `${field}=${key}`)
    }
  }
})

test('INSTALL_MODULE - inherited moduleId keys are rejected', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        slots: [{ id: 's1', slotType: 'tb_roof', installedModuleId: null }]
      }
    ]
  }
  for (const moduleId of HOSTILE_KEYS) {
    const next = handleInstallModule(startState, {
      assetId: 'a1',
      slotId: 's1',
      moduleId
    })
    assert.strictEqual(next, startState, moduleId)
  }
})

test('REMOVE_MODULE - an inherited installedModuleId refunds nothing', () => {
  for (const moduleId of HOSTILE_KEYS) {
    const startState = {
      ...mockState,
      assets: [{ id: 'a1', slots: [{ id: 's1', installedModuleId: moduleId }] }]
    }
    const next = handleRemoveModule(startState, { assetId: 'a1', slotId: 's1' })
    assert.strictEqual(next.player.money, mockState.player.money, moduleId)
    assert.strictEqual(next.assets[0].slots[0].installedModuleId, null)
  }
})

test('UPGRADE_CHASSIS_TIER - an asset whose kind or flavor is an inherited key is rejected', () => {
  for (const key of HOSTILE_KEYS) {
    for (const field of ['kind', 'chassisFlavor']) {
      const startState = {
        ...mockState,
        player: { ...mockState.player, money: 1_000_000 },
        assets: [
          {
            id: 'a1',
            kind: 'tourbus_chassis',
            chassisFlavor: 'legit',
            chassisTier: 1,
            condition: 100,
            slots: [],
            [field]: key
          }
        ]
      }
      const next = handleUpgradeChassisTier(startState, {
        assetId: 'a1',
        targetTier: 2,
        newSlotIds: []
      })
      assert.strictEqual(next, startState, `${field}=${key}`)
    }
  }
})

test('asset handlers - null or missing payloads return state unchanged', () => {
  const startState = {
    ...mockState,
    assets: [{ id: 'a1', kind: 'tourbus_chassis', condition: 50, slots: [] }]
  }
  const handlers = {
    ASSET_FORECLOSED: handleAssetForeclosed,
    INSTALL_MODULE: handleInstallModule,
    PURCHASE_CHASSIS: handlePurchaseChassis,
    REFINANCE_LIABILITY: handleRefinanceLiability,
    REMOVE_MODULE: handleRemoveModule,
    REPAIR_CHASSIS: handleRepairChassis,
    SELL_CHASSIS: handleSellChassis,
    START_CROWDFUND: handleStartCrowdfund,
    UPGRADE_CHASSIS_TIER: handleUpgradeChassisTier
  }
  for (const [type, handler] of Object.entries(handlers)) {
    for (const payload of [null, undefined]) {
      assert.strictEqual(
        handler(startState, payload),
        startState,
        `${type}(${String(payload)})`
      )
    }
  }
})

const NON_FINITE_MONEY = [
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY
]

const makeCreatorState = (money, overrides = {}) => ({
  player: { fame: 1000, money, fameLevel: 0, day: 5 },
  band: { members: [] },
  social: { scenePresence: 100 },
  activeStoryFlags: [],
  assets: [],
  liabilities: {},
  crowdfundCampaigns: [],
  ...overrides
})

const makeTourbus = (overrides = {}) => ({
  id: 'asset_1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  slots: [],
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  ...overrides
})

test('purchaseChassis / refinanceLiability creators - inherited loanProfileId keys fail', () => {
  for (const loanProfileId of HOSTILE_KEYS) {
    const purchase = purchaseChassis(
      {
        kind: 'tourbus_chassis',
        flavor: 'legit',
        tier: 1,
        mode: 'loan',
        loanProfileId
      },
      makeCreatorState(1_000_000)
    )
    assert.strictEqual(
      purchase.type,
      ActionTypes.PURCHASE_CHASSIS_FAILED,
      loanProfileId
    )
    const refinance = refinanceLiability(
      'loan_1',
      loanProfileId,
      makeCreatorState(1_000_000, { liabilities: makeLoanState().liabilities })
    )
    assert.strictEqual(
      refinance.type,
      ActionTypes.REFINANCE_LIABILITY_FAILED,
      loanProfileId
    )
  }
})

test('purchaseChassis / installModule creators - inherited config keys fail', () => {
  for (const key of HOSTILE_KEYS) {
    const purchase = purchaseChassis(
      { kind: key, flavor: 'legit', tier: 1, mode: 'cash' },
      makeCreatorState(1_000_000)
    )
    assert.strictEqual(purchase.type, ActionTypes.PURCHASE_CHASSIS_FAILED, key)
    const install = installModule(
      { assetId: 'asset_1', slotId: 's1', moduleId: key },
      makeCreatorState(1_000_000)
    )
    assert.deepStrictEqual(
      install,
      {
        type: ActionTypes.INSTALL_MODULE_FAILED,
        payload: { reason: 'UNKNOWN_MODULE' }
      },
      key
    )
  }
})

test('asset creators - non-finite money fails with INSUFFICIENT_FUNDS', () => {
  MODULE_REGISTRY[TEST_MODULE_ID] = {
    id: TEST_MODULE_ID,
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 100,
    installCost: 10,
    removalRefundFraction: 0.5,
    boni: {},
    unlock: {},
    imagePromptKey: `prompt_${TEST_MODULE_ID}`
  }
  MODULE_PROMPTS[`prompt_${TEST_MODULE_ID}`] = 'pixel art test'
  const insufficient = reason => reason === 'INSUFFICIENT_FUNDS'

  for (const money of NON_FINITE_MONEY) {
    const label = String(money)
    const purchase = purchaseChassis(
      { kind: 'tourbus_chassis', flavor: 'legit', tier: 1, mode: 'cash' },
      makeCreatorState(money)
    )
    assert.ok(insufficient(purchase.payload.reason), `purchase ${label}`)

    const install = installModule(
      { assetId: 'asset_1', slotId: 's1', moduleId: TEST_MODULE_ID },
      makeCreatorState(money, {
        assets: [
          makeTourbus({
            slots: [
              {
                id: 's1',
                slotType: 'tb_roof',
                position: { x: 0, y: 0 },
                installedModuleId: null
              }
            ]
          })
        ]
      })
    )
    assert.ok(insufficient(install.payload.reason), `install ${label}`)

    const upgrade = upgradeChassisTier(
      'asset_1',
      2,
      makeCreatorState(money, { assets: [makeTourbus()] })
    )
    assert.ok(insufficient(upgrade.payload.reason), `upgrade ${label}`)

    const repair = repairChassis(
      'asset_1',
      makeCreatorState(money, { assets: [makeTourbus({ condition: 40 })] })
    )
    assert.ok(insufficient(repair.payload.reason), `repair ${label}`)

    const refinance = refinanceLiability(
      'loan_1',
      'longTerm',
      makeCreatorState(money, { liabilities: makeLoanState().liabilities })
    )
    assert.ok(insufficient(refinance.payload.reason), `refinance ${label}`)
  }
})

test('START_CROWDFUND / ASSET_FORECLOSED - malformed nested payloads return state unchanged', () => {
  const startState = { ...mockState, assets: [{ id: 'a1', slots: [] }] }
  assert.strictEqual(handleStartCrowdfund(startState, {}), startState)
  assert.strictEqual(
    handleStartCrowdfund(startState, { campaign: {} }),
    startState
  )
  assert.strictEqual(handleAssetForeclosed(startState, {}), startState)
})

// Canonical campaign shape as startCrowdfund stamps it. Resolves on the next
// daily tick (daysRemaining 1, roll < probability) so a campaign the reducer
// wrongly admits is materialized immediately.
const makeRuntimeCampaign = (overrides = {}) => ({
  id: 'camp_runtime',
  assetSpec: { kind: 'tourbus_chassis', flavor: 'legit', chassisTier: 1 },
  targetAmount: 4000,
  fameStake: 20,
  daysRemaining: 1,
  materializedAssetId: 'camp_runtime_asset',
  materializedSlotIds: [],
  plannedSuccessRoll: 0.1,
  plannedSuccessProbability: 0.5,
  ...overrides
})

const withoutKey = key => {
  const campaign = makeRuntimeCampaign()
  delete campaign[key]
  return campaign
}

const INVALID_RUNTIME_CAMPAIGNS = {
  'unknown kind': makeRuntimeCampaign({
    assetSpec: { kind: 'not_a_kind', flavor: 'legit', chassisTier: 1 }
  }),
  'unknown flavor': makeRuntimeCampaign({
    assetSpec: { kind: 'tourbus_chassis', flavor: 'bootleg', chassisTier: 1 }
  }),
  'unknown tier': makeRuntimeCampaign({
    assetSpec: { kind: 'tourbus_chassis', flavor: 'legit', chassisTier: 99 }
  }),
  'missing id': withoutKey('id'),
  'NaN targetAmount': makeRuntimeCampaign({ targetAmount: Number.NaN }),
  'Infinity targetAmount': makeRuntimeCampaign({
    targetAmount: Number.POSITIVE_INFINITY
  }),
  'NaN daysRemaining': makeRuntimeCampaign({ daysRemaining: Number.NaN }),
  'Infinity fameStake': makeRuntimeCampaign({
    fameStake: Number.POSITIVE_INFINITY
  }),
  'negative fameStake': makeRuntimeCampaign({ fameStake: -5 }),
  'NaN plannedSuccessRoll': makeRuntimeCampaign({
    plannedSuccessRoll: Number.NaN
  }),
  'plannedSuccessRoll above 1': makeRuntimeCampaign({
    plannedSuccessRoll: 1.5
  }),
  'plannedSuccessProbability above 0.95': makeRuntimeCampaign({
    plannedSuccessProbability: 2
  }),
  'plannedSuccessProbability below 0.05': makeRuntimeCampaign({
    plannedSuccessProbability: 0
  }),
  'missing plannedSuccessProbability': withoutKey('plannedSuccessProbability'),
  'missing materializedAssetId': withoutKey('materializedAssetId'),
  'non-string materializedAssetId': makeRuntimeCampaign({
    materializedAssetId: 42
  }),
  'missing materializedSlotIds': withoutKey('materializedSlotIds'),
  'non-string materializedSlotIds entry': makeRuntimeCampaign({
    materializedSlotIds: ['slot_ok', 7]
  }),
  'already resolved outcome': makeRuntimeCampaign({
    resolvedOutcome: 'success'
  })
}

test('START_CROWDFUND - invalid runtime campaigns return the identical state and cannot poison the daily tick', () => {
  const startState = makeCreatorState(1000)
  for (const [label, campaign] of Object.entries(INVALID_RUNTIME_CAMPAIGNS)) {
    const next = handleStartCrowdfund(startState, { campaign })
    assert.strictEqual(next, startState, label)

    let ticked
    assert.doesNotThrow(() => {
      ticked = processCrowdfundTick(next)
    }, label)
    assert.ok(Number.isFinite(ticked.player.fame), `${label}: fame finite`)
    assert.deepStrictEqual(ticked.assets, [], `${label}: no asset minted`)
  }
})

// tourbus_chassis legit tier 1 has four slots, so a canonical campaign stamps
// four distinct slot ids.
const SLOT_IDS = ['slot_a', 'slot_b', 'slot_c', 'slot_d']

test('START_CROWDFUND - colliding or malformed materialization ids return the identical state', () => {
  const otherKindAsset = makeTourbus({ id: 'taken', kind: 'bandhaus_chassis' })
  const pendingOtherKind = makeRuntimeCampaign({
    id: 'camp_pending',
    assetSpec: { kind: 'bandhaus_chassis', flavor: 'legit', chassisTier: 1 },
    materializedAssetId: 'taken_pending',
    materializedSlotIds: []
  })
  const startState = makeCreatorState(1000, {
    assets: [otherKindAsset],
    crowdfundCampaigns: [pendingOtherKind]
  })
  const valid = makeRuntimeCampaign({ materializedSlotIds: SLOT_IDS })

  // Sanity: the canonical shape is admitted, so each rejection below is the
  // collision or malformation under test and nothing else.
  assert.notStrictEqual(
    handleStartCrowdfund(startState, { campaign: valid }),
    startState
  )

  const cases = {
    'duplicate slot ids': { materializedSlotIds: ['s', 's', 'c', 'd'] },
    'empty slot id': { materializedSlotIds: ['', 'b', 'c', 'd'] },
    'too few slot ids': { materializedSlotIds: ['a', 'b'] },
    'empty asset id': { materializedAssetId: '' },
    'asset id of an existing asset': { materializedAssetId: 'taken' },
    'asset id of a pending campaign': { materializedAssetId: 'taken_pending' }
  }
  for (const [label, overrides] of Object.entries(cases)) {
    const campaign = { ...valid, ...overrides }
    assert.strictEqual(
      handleStartCrowdfund(startState, { campaign }),
      startState,
      label
    )
  }
})

test('START_CROWDFUND - creator-stamped campaign is admitted and resolves on the tick', () => {
  const startState = makeCreatorState(1000, { rngSeed: 42 })
  const action = startCrowdfund(
    {
      kind: 'tourbus_chassis',
      flavor: 'legit',
      tier: 1,
      targetAmount: 4000,
      fameStake: 20,
      daysRemaining: 1
    },
    startState
  )
  assert.strictEqual(action.type, ActionTypes.START_CROWDFUND)

  const next = handleStartCrowdfund(startState, action.payload)
  assert.deepStrictEqual(next.crowdfundCampaigns, [action.payload.campaign])

  const ticked = processCrowdfundTick(next)
  assert.strictEqual(ticked.crowdfundCampaigns.length, 0)
  assert.strictEqual(ticked.assets.length, 1)
  assert.strictEqual(
    ticked.assets[0].id,
    action.payload.campaign.materializedAssetId
  )
})
