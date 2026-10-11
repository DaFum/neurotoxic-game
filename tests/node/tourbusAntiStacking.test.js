import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry'
import {
  purchaseChassis,
  installModule
} from '../../src/context/assetActionCreators'

// Integration tests for tb_trailer_hitch anti-stacking rules.

// Production addons for the two tb_trailer_addon slots the hitch adds.
const ADDON_MODULE_A = 'tb_trailer_merch_box'
const ADDON_MODULE_B = 'tb_trailer_bunk_pod'

/**
 * Build a state with a tourbus_chassis tier 3 asset purchased via cash.
 * player.fame must be >= 40 (tb_trailer_hitch unlock.minFame).
 * player.money must be >= 18000 (tier 3 price).
 */
const buildTier3State = () => {
  // Verify CHASSIS_CONFIG has a real tier 3 slot list
  const t3Slots = CHASSIS_CONFIG.tourbus_chassis?.legit?.[3]?.slots
  assert.ok(
    Array.isArray(t3Slots) && t3Slots.length > 0,
    'CHASSIS_CONFIG.tourbus_chassis.legit[3] must have slots'
  )
  assert.ok(
    t3Slots.includes('tb_trailer_mount'),
    'Tier 3 must include tb_trailer_mount'
  )

  let state = {
    ...createInitialState(),
    player: {
      ...createInitialState().player,
      money: 50000,
      fame: 100,
      day: 1
    }
  }

  const purchaseAction = purchaseChassis(
    { kind: 'tourbus_chassis', flavor: 'legit', tier: 3, mode: 'cash' },
    state
  )
  assert.equal(
    purchaseAction.type,
    ActionTypes.PURCHASE_CHASSIS,
    'purchase must succeed'
  )
  state = gameReducer(state, purchaseAction)
  assert.equal(state.assets.length, 1, 'asset created')

  return state
}

describe('Tourbus anti-stacking — tb_trailer_hitch integration', () => {
  it('the addon modules are real tb_trailer_addon registrations', () => {
    for (const id of [ADDON_MODULE_A, ADDON_MODULE_B]) {
      assert.equal(MODULE_REGISTRY[id]?.slotType, 'tb_trailer_addon')
      assert.equal(MODULE_REGISTRY[id]?.addsSlots, undefined)
    }
  })

  it('Test 1: installing tb_trailer_hitch adds exactly 2 tb_trailer_addon slots with addedByModuleId', () => {
    let state = buildTier3State()
    const asset = state.assets[0]

    // Find the tb_trailer_mount slot
    const mountSlot = asset.slots.find(s => s.slotType === 'tb_trailer_mount')
    assert.ok(mountSlot, 'asset must have a tb_trailer_mount slot')

    const installAction = installModule(
      { assetId: asset.id, slotId: mountSlot.id, moduleId: 'tb_trailer_hitch' },
      state
    )
    assert.equal(
      installAction.type,
      ActionTypes.INSTALL_MODULE,
      'installModule must return INSTALL_MODULE (not FAILED): ' +
        (installAction.payload?.reason ?? '')
    )
    state = gameReducer(state, installAction)

    const updatedAsset = state.assets[0]
    const addonSlots = updatedAsset.slots.filter(
      s => s.slotType === 'tb_trailer_addon'
    )
    assert.equal(
      addonSlots.length,
      2,
      'must have exactly 2 tb_trailer_addon slots'
    )

    for (const slot of addonSlots) {
      assert.equal(
        slot.addedByModuleId,
        'tb_trailer_hitch',
        'addedByModuleId must equal tb_trailer_hitch'
      )
      assert.equal(slot.installedModuleId, null, 'addon slots start empty')
    }
  })

  it('Test 2: tb_trailer_hitch cannot be installed into a tb_trailer_addon slot (slot_type_mismatch)', () => {
    // Build state through Test 1 steps to get addon slots
    let state = buildTier3State()
    const asset = state.assets[0]
    const mountSlot = asset.slots.find(s => s.slotType === 'tb_trailer_mount')
    assert.ok(mountSlot)

    const installAction = installModule(
      { assetId: asset.id, slotId: mountSlot.id, moduleId: 'tb_trailer_hitch' },
      state
    )
    state = gameReducer(state, installAction)

    const updatedAsset = state.assets[0]
    const addonSlot = updatedAsset.slots.find(
      s => s.slotType === 'tb_trailer_addon'
    )
    assert.ok(addonSlot, 'addon slot must exist after hitch install')

    // Attempt to install another hitch into the addon slot — should fail with slot_type_mismatch
    const stateBefore = state
    const failAction = installModule(
      {
        assetId: updatedAsset.id,
        slotId: addonSlot.id,
        moduleId: 'tb_trailer_hitch'
      },
      state
    )
    assert.equal(
      failAction.type,
      ActionTypes.INSTALL_MODULE_FAILED,
      'must return INSTALL_MODULE_FAILED'
    )
    assert.equal(
      failAction.payload.reason,
      'SLOT_TYPE_MISMATCH',
      'reason must be SLOT_TYPE_MISMATCH'
    )

    // Reducer no-ops on INSTALL_MODULE_FAILED — state unchanged
    const stateAfter = gameReducer(state, failAction)
    assert.deepEqual(
      stateAfter.assets,
      stateBefore.assets,
      'state must be unchanged after failed install'
    )
  })

  it('Test 3: second tb_trailer_hitch on same already-occupied slot fails with SLOT_OCCUPIED', () => {
    // Tier 3 chassis has exactly one tb_trailer_mount slot.
    // After installing the hitch, the mount slot is occupied.
    // A re-install attempt on the same occupied slot → SLOT_OCCUPIED.
    // (maxPerAsset=1 would kick in before slot-occupancy if a chassis had
    //  multiple tb_trailer_mount slots, but today Tier 3 has only one.)
    let state = buildTier3State()
    const asset = state.assets[0]
    const mountSlot = asset.slots.find(s => s.slotType === 'tb_trailer_mount')
    assert.ok(mountSlot)

    // Install the first hitch
    const installAction = installModule(
      { assetId: asset.id, slotId: mountSlot.id, moduleId: 'tb_trailer_hitch' },
      state
    )
    assert.equal(installAction.type, ActionTypes.INSTALL_MODULE)
    state = gameReducer(state, installAction)

    // Try to install hitch again on the same now-occupied slot
    const failAction = installModule(
      { assetId: asset.id, slotId: mountSlot.id, moduleId: 'tb_trailer_hitch' },
      state
    )
    assert.equal(
      failAction.type,
      ActionTypes.INSTALL_MODULE_FAILED,
      'second hitch install must fail'
    )
    // SLOT_OCCUPIED is the expected reason here; MAX_PER_ASSET would fire
    // first on a multi-mount chassis (but Tier 3 has only one tb_trailer_mount).
    assert.equal(
      failAction.payload.reason,
      'SLOT_OCCUPIED',
      'reason must be SLOT_OCCUPIED'
    )
  })

  it('Test 4: golden path — hitch + 2 addon installs leaves exactly 2 tb_trailer_addon slots (no recursive expansion)', () => {
    let state = buildTier3State()
    const asset = state.assets[0]
    const mountSlot = asset.slots.find(s => s.slotType === 'tb_trailer_mount')
    assert.ok(mountSlot)

    // Install the trailer hitch
    const hitchAction = installModule(
      { assetId: asset.id, slotId: mountSlot.id, moduleId: 'tb_trailer_hitch' },
      state
    )
    assert.equal(hitchAction.type, ActionTypes.INSTALL_MODULE)
    state = gameReducer(state, hitchAction)

    let updatedAsset = state.assets[0]
    const addonSlots = updatedAsset.slots.filter(
      s => s.slotType === 'tb_trailer_addon'
    )
    assert.equal(addonSlots.length, 2, 'exactly 2 addon slots after hitch')

    // Install addon module A into first addon slot
    const installA = installModule(
      {
        assetId: updatedAsset.id,
        slotId: addonSlots[0].id,
        moduleId: ADDON_MODULE_A
      },
      state
    )
    assert.equal(
      installA.type,
      ActionTypes.INSTALL_MODULE,
      'addon module A install must succeed: ' + (installA.payload?.reason ?? '')
    )
    state = gameReducer(state, installA)

    updatedAsset = state.assets[0]
    assert.equal(
      updatedAsset.slots.filter(s => s.slotType === 'tb_trailer_addon').length,
      2,
      'still exactly 2 addon slots after first addon install (no expansion)'
    )

    // Install addon module B into second addon slot
    const installB = installModule(
      {
        assetId: updatedAsset.id,
        slotId: addonSlots[1].id,
        moduleId: ADDON_MODULE_B
      },
      state
    )
    assert.equal(
      installB.type,
      ActionTypes.INSTALL_MODULE,
      'addon module B install must succeed: ' + (installB.payload?.reason ?? '')
    )
    state = gameReducer(state, installB)

    updatedAsset = state.assets[0]
    const finalAddonSlots = updatedAsset.slots.filter(
      s => s.slotType === 'tb_trailer_addon'
    )
    assert.equal(
      finalAddonSlots.length,
      2,
      'exactly 2 tb_trailer_addon slots after both addon installs — no recursive stacking'
    )

    // Both addon slots should now be occupied
    assert.ok(
      finalAddonSlots.every(s => s.installedModuleId !== null),
      'both addon slots must be filled'
    )
  })
})
