import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  installModule,
  purchaseChassis,
  removeModule,
  repairChassis,
  resolveCrowdfund,
  sellChassis,
  startCrowdfund,
  upgradeChassisTier
} from '../../src/context/assetActionCreators.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import {
  MODULE_PROMPTS,
  MODULE_REGISTRY
} from '../../src/utils/assetModuleRegistry.ts'

// Snapshot the shared registries once and restore them after the suite so
// per-test mutations (setupTourbusT1, registerTestModule) don't leak into
// sibling test files.
const cfgSnapshot = structuredClone(CHASSIS_CONFIG)
const registrySnapshot = structuredClone(MODULE_REGISTRY)
const promptsSnapshot = structuredClone(MODULE_PROMPTS)
after(() => {
  for (const k of Object.keys(CHASSIS_CONFIG)) delete CHASSIS_CONFIG[k]
  Object.assign(CHASSIS_CONFIG, cfgSnapshot)
  for (const k of Object.keys(MODULE_REGISTRY)) delete MODULE_REGISTRY[k]
  Object.assign(MODULE_REGISTRY, registrySnapshot)
  for (const k of Object.keys(MODULE_PROMPTS)) delete MODULE_PROMPTS[k]
  Object.assign(MODULE_PROMPTS, promptsSnapshot)
})

// Test fixtures populate CHASSIS_CONFIG / MODULE_REGISTRY with a minimal entry
// so the creator can exercise its full validation path without depending on
// section plans 2-5.
const setupTourbusT1 = () => {
  CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.005
  }
  CHASSIS_CONFIG.tourbus_chassis.diy[1] = {
    price: 2000,
    upkeep: 14,
    revenue: 0,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.03
  }
}

const registerTestModule = (id, override = {}) => {
  MODULE_REGISTRY[id] = {
    id,
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 100,
    installCost: 10,
    removalRefundFraction: 0.5,
    boni: {},
    unlock: {},
    imagePromptKey: `prompt_${id}`,
    ...override
  }
  MODULE_PROMPTS[`prompt_${id}`] = `pixel art ${id}`
}

const makeState = (overrides = {}) => ({
  player: {
    fame: 100,
    money: 10000,
    fameLevel: 0,
    day: 5,
    ...overrides.player
  },
  band: { members: [], ...overrides.band },
  social: { ...overrides.social },
  activeStoryFlags: overrides.activeStoryFlags ?? [],
  assets: overrides.assets ?? [],
  liabilities: overrides.liabilities ?? []
})

const makeAsset = (overrides = {}) => ({
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

describe('purchaseChassis', () => {
  it('returns PURCHASE_CHASSIS on valid cash purchase', () => {
    setupTourbusT1()
    const action = purchaseChassis(
      { kind: 'tourbus_chassis', flavor: 'legit', tier: 1, mode: 'cash' },
      makeState()
    )
    assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS)
    assert.equal(action.payload.slotIds.length, 2)
    assert.equal(action.payload.today, 5)
  })

  it('returns FAILED for DIY + loan', () => {
    setupTourbusT1()
    const action = purchaseChassis(
      {
        kind: 'tourbus_chassis',
        flavor: 'diy',
        tier: 1,
        mode: 'loan',
        loanProfileId: 'shortTerm'
      },
      makeState()
    )
    assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
    assert.equal(action.payload.reason, 'DIY_LOAN_NOT_ALLOWED')
  })

  it('returns FAILED for insufficient funds', () => {
    setupTourbusT1()
    const action = purchaseChassis(
      { kind: 'tourbus_chassis', flavor: 'legit', tier: 1, mode: 'cash' },
      makeState({ player: { money: 100 } })
    )
    assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
    assert.equal(action.payload.reason, 'INSUFFICIENT_FUNDS')
  })

  it('returns FAILED for unknown loan profile', () => {
    setupTourbusT1()
    const action = purchaseChassis(
      {
        kind: 'tourbus_chassis',
        flavor: 'legit',
        tier: 1,
        mode: 'loan',
        loanProfileId: 'mythicTerm'
      },
      makeState()
    )
    assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
  })

  it('returns FAILED for empty CHASSIS_CONFIG entry', () => {
    const original = CHASSIS_CONFIG.studio_chassis.legit[3]
    CHASSIS_CONFIG.studio_chassis.legit[3] = {
      ...original,
      price: 0,
      slots: []
    }
    try {
      const action = purchaseChassis(
        { kind: 'studio_chassis', flavor: 'legit', tier: 3, mode: 'cash' },
        makeState()
      )
      assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
      assert.equal(action.payload.reason, 'UNKNOWN_KIND_OR_TIER')
    } finally {
      CHASSIS_CONFIG.studio_chassis.legit[3] = original
    }
  })

  it('returns FAILED for unknown kind/flavor/tier/mode', () => {
    const action = purchaseChassis(
      { kind: 'fake_kind', flavor: 'legit', tier: 1, mode: 'cash' },
      makeState()
    )
    assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
    assert.equal(action.payload.reason, 'UNKNOWN_KIND_OR_TIER')
  })
})

describe('installModule', () => {
  it('returns INSTALL_MODULE on valid install', () => {
    registerTestModule('install_ok')
    const asset = makeAsset({
      slots: [
        {
          id: 'slot_1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: null
        }
      ]
    })
    const action = installModule(
      { assetId: 'asset_1', slotId: 'slot_1', moduleId: 'install_ok' },
      makeState({ assets: [asset] })
    )
    assert.equal(action.type, ActionTypes.INSTALL_MODULE)
    assert.equal(action.payload.newSlotIds, undefined)
  })

  it('returns FAILED on slot type mismatch', () => {
    registerTestModule('install_mismatch', { slotType: 'tb_audio' })
    const asset = makeAsset({
      slots: [
        {
          id: 'slot_1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: null
        }
      ]
    })
    const action = installModule(
      { assetId: 'asset_1', slotId: 'slot_1', moduleId: 'install_mismatch' },
      makeState({ assets: [asset] })
    )
    assert.equal(action.type, ActionTypes.INSTALL_MODULE_FAILED)
    assert.equal(action.payload.reason, 'SLOT_TYPE_MISMATCH')
  })

  it('returns FAILED for locked module', () => {
    registerTestModule('install_locked', { unlock: { minFame: 999 } })
    const asset = makeAsset({
      slots: [
        {
          id: 'slot_1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: null
        }
      ]
    })
    const action = installModule(
      { assetId: 'asset_1', slotId: 'slot_1', moduleId: 'install_locked' },
      makeState({ assets: [asset] })
    )
    assert.equal(action.payload.reason, 'LOCKED')
  })

  it('returns FAILED for SLOT_OCCUPIED', () => {
    registerTestModule('install_occ')
    registerTestModule('already_there')
    const asset = makeAsset({
      slots: [
        {
          id: 'slot_1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'already_there'
        }
      ]
    })
    const action = installModule(
      { assetId: 'asset_1', slotId: 'slot_1', moduleId: 'install_occ' },
      makeState({ assets: [asset] })
    )
    assert.equal(action.payload.reason, 'SLOT_OCCUPIED')
  })

  it('returns FAILED for EXCLUSIVITY conflict', () => {
    registerTestModule('install_excl_a', { exclusiveWithGroup: 'g1' })
    registerTestModule('install_excl_b', {
      slotType: 'tb_audio',
      exclusiveWithGroup: 'g1'
    })
    const asset = makeAsset({
      slots: [
        {
          id: 'slot_b',
          slotType: 'tb_audio',
          position: { x: 0, y: 0 },
          installedModuleId: 'install_excl_b'
        },
        {
          id: 'slot_a',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: null
        }
      ]
    })
    const action = installModule(
      { assetId: 'asset_1', slotId: 'slot_a', moduleId: 'install_excl_a' },
      makeState({ assets: [asset] })
    )
    assert.equal(action.payload.reason, 'EXCLUSIVITY')
  })

  it('pre-generates newSlotIds for addsSlots modules', () => {
    registerTestModule('install_with_addsSlots', {
      slotType: 'tb_trailer_mount',
      addsSlots: [{ slotType: 'tb_trailer_addon', count: 2 }],
      maxPerAsset: 1
    })
    const asset = makeAsset({
      slots: [
        {
          id: 'slot_mount',
          slotType: 'tb_trailer_mount',
          position: { x: 0, y: 0 },
          installedModuleId: null
        }
      ]
    })
    const action = installModule(
      {
        assetId: 'asset_1',
        slotId: 'slot_mount',
        moduleId: 'install_with_addsSlots'
      },
      makeState({ assets: [asset] })
    )
    assert.equal(action.type, ActionTypes.INSTALL_MODULE)
    assert.equal(action.payload.newSlotIds.length, 2)
    for (const s of action.payload.newSlotIds) {
      assert.equal(s.slotType, 'tb_trailer_addon')
      assert.equal(typeof s.id, 'string')
      assert.ok(s.id.length > 0)
    }
  })

  it('returns FAILED for unknown module', () => {
    const action = installModule(
      { assetId: 'asset_1', slotId: 'slot_1', moduleId: 'nonexistent' },
      makeState({ assets: [makeAsset()] })
    )
    assert.equal(action.payload.reason, 'UNKNOWN_MODULE')
  })

  it('returns FAILED for unknown asset', () => {
    registerTestModule('install_ok2')
    const action = installModule(
      { assetId: 'no_such_asset', slotId: 'slot_1', moduleId: 'install_ok2' },
      makeState({ assets: [] })
    )
    assert.equal(action.payload.reason, 'UNKNOWN_ASSET')
  })
})

describe('upgradeChassisTier', () => {
  it('pre-generates ids only for newly exposed slot types', () => {
    CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
      price: 4000,
      upkeep: 20,
      revenue: 0,
      slots: ['tb_roof', 'tb_front'],
      baseRiskEventChance: 0.005
    }
    CHASSIS_CONFIG.tourbus_chassis.legit[2] = {
      price: 9000,
      upkeep: 35,
      revenue: 0,
      slots: ['tb_roof', 'tb_front', 'tb_side', 'tb_interior_cabin'],
      baseRiskEventChance: 0.005
    }
    const asset = makeAsset({
      chassisTier: 1,
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: null
        },
        {
          id: 's2',
          slotType: 'tb_front',
          position: { x: 0, y: 0 },
          installedModuleId: null
        }
      ]
    })
    const action = upgradeChassisTier(
      'asset_1',
      2,
      makeState({ assets: [asset] })
    )
    assert.equal(action.type, ActionTypes.UPGRADE_CHASSIS_TIER)
    assert.equal(action.payload.newSlotIds.length, 2)
    const types = action.payload.newSlotIds.map(s => s.slotType).sort()
    assert.deepEqual(types, ['tb_interior_cabin', 'tb_side'])
  })

  it('returns null when target tier is not greater', () => {
    const asset = makeAsset({ chassisTier: 2 })
    const action = upgradeChassisTier(
      'asset_1',
      1,
      makeState({ assets: [asset] })
    )
    assert.equal(action, null)
  })
})

describe('startCrowdfund / resolveCrowdfund / sellChassis / repairChassis / removeModule', () => {
  it('startCrowdfund stamps a uuid id and copies fields', () => {
    const action = startCrowdfund({
      kind: 'tourbus_chassis',
      flavor: 'legit',
      tier: 1,
      targetAmount: 5000,
      fameStake: 50,
      daysRemaining: 14,
      plannedSuccessRoll: 0.42
    })
    assert.equal(action.type, ActionTypes.START_CROWDFUND)
    assert.equal(action.payload.campaign.plannedSuccessRoll, 0.42)
    assert.equal(typeof action.payload.campaign.id, 'string')
  })

  it('resolveCrowdfund(success) generates asset + slot ids', () => {
    setupTourbusT1()
    const action = resolveCrowdfund('camp_1', 'success', {
      kind: 'tourbus_chassis',
      flavor: 'legit',
      tier: 1
    })
    assert.equal(action.payload.outcome, 'success')
    assert.equal(typeof action.payload.newAssetId, 'string')
    assert.equal(action.payload.newSlotIds.length, 2)
  })

  it('resolveCrowdfund(fail) omits asset/slot ids', () => {
    const action = resolveCrowdfund('camp_1', 'fail')
    assert.equal(action.payload.outcome, 'fail')
    assert.equal(action.payload.newAssetId, undefined)
  })

  it('sellChassis / repairChassis / removeModule shape', () => {
    assert.equal(sellChassis('a1').type, ActionTypes.SELL_CHASSIS)
    assert.equal(repairChassis('a1').type, ActionTypes.REPAIR_CHASSIS)
    assert.equal(removeModule('a1', 's1').type, ActionTypes.REMOVE_MODULE)
  })
})
