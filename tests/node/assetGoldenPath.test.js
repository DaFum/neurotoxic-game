import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig'
import {
  MODULE_PROMPTS,
  MODULE_REGISTRY
} from '../../src/utils/assetModuleRegistry'
import {
  purchaseChassis,
  installModule,
  startCrowdfund
} from '../../src/context/assetActionCreators'
import { advanceDay } from '../../src/context/actionCreators'

// Foundation-phase golden path: exercises every action surface end-to-end
// through the actual gameReducer. Section plans (2–5) will inherit this
// scaffold and add per-section variants (trailer stacking, etc.).

const TEST_MODULE_ID = 'gp_test_module'

let snapshot

const setupConfig = () => {
  snapshot = {
    legit: CHASSIS_CONFIG.tourbus_chassis?.legit?.[1],
    diy: CHASSIS_CONFIG.tourbus_chassis?.diy?.[1],
    module: MODULE_REGISTRY[TEST_MODULE_ID],
    prompt: MODULE_PROMPTS.gp_test_prompt
  }

  if (!CHASSIS_CONFIG.tourbus_chassis) {
    CHASSIS_CONFIG.tourbus_chassis = { legit: {}, diy: {} }
  }

  // Foundation config is empty stubs; populate just enough for the cycle.
  CHASSIS_CONFIG.tourbus_chassis.legit[1] = {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.5 // 50% risk so the seeded RNG can deterministically fire
  }
  CHASSIS_CONFIG.tourbus_chassis.diy[1] = {
    price: 2000,
    upkeep: 14,
    revenue: 0,
    slots: ['tb_roof', 'tb_front'],
    baseRiskEventChance: 0.03
  }
  MODULE_REGISTRY[TEST_MODULE_ID] = {
    id: TEST_MODULE_ID,
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 100,
    installCost: 10,
    removalRefundFraction: 0.5,
    boni: { fuelMultiplier: 0.85 },
    unlock: {},
    riskEventTypes: ['theft'],
    imagePromptKey: 'gp_test_prompt'
  }
  MODULE_PROMPTS.gp_test_prompt = 'pixel art test module'
}

afterEach(() => {
  if (snapshot.legit !== undefined) {
    CHASSIS_CONFIG.tourbus_chassis.legit[1] = snapshot.legit
  } else {
    delete CHASSIS_CONFIG.tourbus_chassis.legit[1]
  }

  if (snapshot.diy !== undefined) {
    CHASSIS_CONFIG.tourbus_chassis.diy[1] = snapshot.diy
  } else {
    delete CHASSIS_CONFIG.tourbus_chassis.diy[1]
  }

  if (snapshot.module !== undefined) {
    MODULE_REGISTRY[TEST_MODULE_ID] = snapshot.module
  } else {
    delete MODULE_REGISTRY[TEST_MODULE_ID]
  }

  if (snapshot.prompt !== undefined) {
    MODULE_PROMPTS.gp_test_prompt = snapshot.prompt
  } else {
    delete MODULE_PROMPTS.gp_test_prompt
  }
})

const seedState = (overrides = {}) => ({
  ...createInitialState(),
  player: {
    ...createInitialState().player,
    money: 10000,
    fame: 100,
    day: 1
  },
  ...overrides
})

describe('Asset golden path — cash purchase → install → advanceDay cycle', () => {
  it('full cycle drives money, condition, and modifiers through the reducer', () => {
    setupConfig()
    let state = seedState()

    // 1. Purchase a chassis via cash
    const purchaseAction = purchaseChassis(
      { kind: 'tourbus_chassis', flavor: 'legit', tier: 1, mode: 'cash' },
      state
    )
    assert.equal(purchaseAction.type, ActionTypes.PURCHASE_CHASSIS)
    state = gameReducer(state, purchaseAction)
    assert.equal(state.assets.length, 1)
    assert.equal(state.player.money, 10000 - 4000)
    const asset = state.assets[0]
    assert.equal(asset.slots.length, 2)
    assert.equal(asset.condition, 100)

    // 2. Install a module
    const installAction = installModule(
      {
        assetId: asset.id,
        slotId: asset.slots[0].id,
        moduleId: TEST_MODULE_ID
      },
      state
    )
    assert.equal(installAction.type, ActionTypes.INSTALL_MODULE)
    state = gameReducer(state, installAction)
    assert.equal(
      state.assets[0].slots[0].installedModuleId,
      TEST_MODULE_ID,
      'module landed in slot'
    )
    assert.equal(state.player.money, 10000 - 4000 - (100 + 10))

    // 3. advanceDay: tick fires, condition decays, fuel modifier applies
    state = gameReducer(state, advanceDay(state))
    assert.ok(state.assets[0].condition < 100, 'condition decayed during tick')
    // dayRngStream + nextRngSeed were on the payload; rngSeed updated
    assert.equal(typeof state.rngSeed, 'number')
  })
})

describe('Asset golden path — loan acquisition survives the cycle', () => {
  it('loan creates a liability and the daily payment ticks down', () => {
    setupConfig()
    let state = seedState()

    const action = purchaseChassis(
      {
        kind: 'tourbus_chassis',
        flavor: 'legit',
        tier: 1,
        mode: 'loan',
        loanProfileId: 'shortTerm'
      },
      state
    )
    state = gameReducer(state, action)
    assert.equal(state.liabilities.length, 1)
    const originalPrincipal = state.liabilities[0].principalRemaining
    assert.ok(originalPrincipal > 0)

    // Cash should NOT have moved — only liability was created.
    assert.equal(state.player.money, 10000)

    // advanceDay should debit dailyPayment and reduce principal.
    state = gameReducer(state, advanceDay(state))
    assert.ok(state.player.money < 10000, 'liability tick withdrew money')
    assert.ok(
      state.liabilities[0].principalRemaining < originalPrincipal,
      'principal decreased after payment'
    )
  })
})

describe('Asset golden path — crowdfund start → resolution', () => {
  it('successful campaign creates the asset and applies money+fame deltas', () => {
    setupConfig()
    let state = seedState({
      // Force success by stamping plannedSuccessRoll < plannedSuccessProbability.
      // Both are clamped to [0.05, 0.95] in the action creator.
      rngSeed: 0xffffffff
    })

    // Build a campaign that resolves on next advanceDay (daysRemaining: 1
    // → tick subtracts 1 → 0 → resolve)
    const startAction = startCrowdfund({
      kind: 'tourbus_chassis',
      flavor: 'legit',
      tier: 1,
      targetAmount: 4000,
      fameStake: 20,
      daysRemaining: 1,
      plannedSuccessRoll: 0.1,
      plannedSuccessProbability: 0.9
    })
    assert.equal(startAction.type, ActionTypes.START_CROWDFUND)
    // Materialized ids were stamped by the action creator (Task 11-13 fix).
    assert.equal(
      typeof startAction.payload.campaign.materializedAssetId,
      'string'
    )
    assert.equal(
      startAction.payload.campaign.materializedSlotIds.length,
      2,
      'materialized slot count matches chassis config'
    )

    state = gameReducer(state, startAction)
    assert.equal(state.crowdfundCampaigns.length, 1)

    // Tick to resolution
    const fameBefore = state.player.fame
    state = gameReducer(state, advanceDay(state))
    assert.equal(
      state.crowdfundCampaigns.length,
      0,
      'campaign removed after resolution'
    )
    assert.equal(state.assets.length, 1, 'asset materialized on success')
    assert.equal(state.assets[0].acquisitionMode, 'crowdfund')
    assert.ok(state.player.fame > fameBefore, 'fame gained on success')
  })

  it('failed campaign deducts fameStake without creating an asset', () => {
    setupConfig()
    let state = seedState()

    const startAction = startCrowdfund({
      kind: 'tourbus_chassis',
      flavor: 'legit',
      tier: 1,
      targetAmount: 4000,
      fameStake: 30,
      daysRemaining: 1,
      plannedSuccessRoll: 0.95,
      plannedSuccessProbability: 0.1 // roll >= probability → fail
    })
    state = gameReducer(state, startAction)

    // Crowdfund failure path: assert no asset was created and the campaign
    // was removed. Fame-stake math is unit-tested in assetTicks.test.js;
    // here we don't lock down absolute fame because handleAdvanceDay also
    // runs the daily-updates pipeline which independently grants fame.
    state = gameReducer(state, advanceDay(state))
    assert.equal(state.crowdfundCampaigns.length, 0)
    assert.equal(state.assets.length, 0, 'no asset on fail')
  })
})
