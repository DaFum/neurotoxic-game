import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
// Side-effect: registers all modules including bandhaus modules
import '../../src/utils/assetModuleRegistry.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import {
  isModuleUnlocked,
  getActiveAssetModifiers
} from '../../src/utils/assetSelectors.ts'
import { rollAssetRiskEvents } from '../../src/utils/assetTicks.ts'

/**
 * Builds a minimal bandhaus LongTermAsset.
 */
function makeBandhausAsset(
  slots,
  { condition = 100, baseRiskEventChance = 0.5 } = {}
) {
  return {
    id: 'test-bandhaus',
    kind: 'bandhaus_chassis',
    chassisFlavor: 'legit',
    chassisTier: 1,
    condition,
    baseUpkeep: 30,
    baseDailyRevenue: 0,
    baseRiskEventChance,
    acquiredOnDay: 0,
    acquisitionMode: 'cash',
    slots: slots.map(({ slotType, installedModuleId = null }, i) => ({
      id: `slot-${i}`,
      slotType,
      position: { x: 0, y: 0 },
      installedModuleId
    }))
  }
}

/**
 * Builds a minimal GameState with one bandhaus asset.
 */
function makeStateWithBandhaus(slots, assetOptions = {}) {
  const asset = makeBandhausAsset(slots, assetOptions)
  return {
    assets: [asset],
    player: { money: 1000, fame: 50, day: 1 },
    band: { members: [] },
    social: {},
    liabilities: [],
    crowdfundCampaigns: [],
    activeStoryFlags: []
  }
}

describe('Bandhaus integration tests', () => {
  it('bh_weed_garden triggers raid event deterministically', () => {
    // Asset with bh_weed_garden in a bh_backyard slot, high risk chance
    const state = makeStateWithBandhaus(
      [{ slotType: 'bh_backyard', installedModuleId: 'bh_weed_garden' }],
      { condition: 100, baseRiskEventChance: 0.5 }
    )
    // dayRngStream layout:
    //   [0] = triggerRoll 0.1 < 0.5 → event fires
    //   [1] = typeRoll 0.0 → index 0 of ['raid']
    const dayRngStream = [0.1, 0.0]
    const result = rollAssetRiskEvents(state, dayRngStream, 0)
    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].eventType, 'raid')
  })

  it('bh_wall_mural unlock requires saved_local_venue story flag', () => {
    const module = MODULE_REGISTRY['bh_wall_mural']
    assert.ok(module, 'bh_wall_mural must be registered')

    // Without the required story flag → locked
    const stateWithout = {
      assets: [],
      player: { money: 10000, fame: 100, day: 1 },
      band: { members: [] },
      social: {},
      liabilities: [],
      crowdfundCampaigns: [],
      activeStoryFlags: []
    }
    assert.strictEqual(isModuleUnlocked(module, stateWithout), false)

    // With the required story flag → unlocked
    const stateWith = {
      ...stateWithout,
      activeStoryFlags: ['saved_local_venue']
    }
    assert.strictEqual(isModuleUnlocked(module, stateWith), true)
  })

  it('bh_hot_tub aggregates infightingDamper: true in AssetModifiers', () => {
    const asset = makeBandhausAsset(
      [{ slotType: 'bh_lounge', installedModuleId: 'bh_hot_tub' }],
      { condition: 100 }
    )
    const modifiers = getActiveAssetModifiers([asset])
    assert.strictEqual(modifiers.flags.infightingDamper, true)
  })

  it('tier-2 chassis does NOT expose bh_secret slot; tier-3 DOES', () => {
    const legitT2Slots = CHASSIS_CONFIG['bandhaus_chassis']['legit'][2].slots
    const legitT3Slots = CHASSIS_CONFIG['bandhaus_chassis']['legit'][3].slots
    assert.ok(
      !legitT2Slots.includes('bh_secret'),
      'legit tier-2 must not have bh_secret'
    )
    assert.ok(
      legitT3Slots.includes('bh_secret'),
      'legit tier-3 must have bh_secret'
    )

    const diyT2Slots = CHASSIS_CONFIG['bandhaus_chassis']['diy'][2].slots
    const diyT3Slots = CHASSIS_CONFIG['bandhaus_chassis']['diy'][3].slots
    assert.ok(
      !diyT2Slots.includes('bh_secret'),
      'diy tier-2 must not have bh_secret'
    )
    assert.ok(
      diyT3Slots.includes('bh_secret'),
      'diy tier-3 must have bh_secret'
    )
  })
})
