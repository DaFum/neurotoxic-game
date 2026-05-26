import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
// Side-effect: registers all modules including workshop modules
import '../../src/utils/assetModuleRegistry.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { installModule } from '../../src/context/assetActionCreators.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'
import {
  getActiveAssetModifiers,
  getAssetAggregateBoni,
  getAssetTotalDailyRevenue,
  isModuleUnlocked
} from '../../src/utils/assetSelectors.ts'
import { rollAssetRiskEvents } from '../../src/utils/assetTicks.ts'

function makeWorkshopAsset(
  slots,
  { condition = 100, baseRiskEventChance = 0.5, baseDailyRevenue = 15 } = {}
) {
  return {
    id: 'test-workshop',
    kind: 'merch_workshop_chassis',
    chassisFlavor: 'legit',
    chassisTier: 3,
    condition,
    baseUpkeep: 18,
    baseDailyRevenue,
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

function makeState({ installedModules = [], scenePresence = 100 } = {}) {
  return {
    assets: [
      makeWorkshopAsset(
        installedModules.map((installedModuleId, i) => ({
          slotType: i === 0 ? 'mw_print' : 'mw_specialty',
          installedModuleId
        }))
      )
    ],
    player: { money: 10000, fame: 100, day: 1 },
    band: { members: [{ id: 'tech-1', skills: { tech: 3 } }] },
    social: { scenePresence },
    liabilities: [],
    crowdfundCampaigns: [],
    activeStoryFlags: []
  }
}

describe('Workshop economy integration', () => {
  it('mw_4color_carousel installed exposes merchCostMultiplier 0.75', () => {
    const asset = makeWorkshopAsset([
      { slotType: 'mw_print', installedModuleId: 'mw_4color_carousel' }
    ])

    const modifiers = getActiveAssetModifiers([asset])

    assert.strictEqual(modifiers.merchCostMultiplier, 0.75)
  })

  it('mw_vinyl_cutter installed enables limited editions flag', () => {
    const asset = makeWorkshopAsset([
      { slotType: 'mw_cutting', installedModuleId: 'mw_vinyl_cutter' }
    ])

    const modifiers = getActiveAssetModifiers([asset])

    assert.strictEqual(modifiers.flags.enablesLimitedEditions, true)
  })

  it('mw_eco_ink_supply unlock requires mw_4color_carousel OR mw_manual_press installed', () => {
    const module = MODULE_REGISTRY['mw_eco_ink_supply']
    assert.ok(module, 'mw_eco_ink_supply must be registered')

    const stateWithoutPress = makeState()
    assert.strictEqual(isModuleUnlocked(module, stateWithoutPress), false)

    const stateWithManualPress = makeState({
      installedModules: ['mw_manual_press']
    })
    assert.strictEqual(isModuleUnlocked(module, stateWithManualPress), true)

    const stateWithCarousel = makeState({
      installedModules: ['mw_4color_carousel']
    })
    assert.strictEqual(isModuleUnlocked(module, stateWithCarousel), true)
  })

  it('mw_eco_ink_supply can be installed into storage after a print module is installed', () => {
    const state = makeState()
    state.assets = [
      makeWorkshopAsset([
        { slotType: 'mw_print', installedModuleId: 'mw_manual_press' },
        { slotType: 'mw_storage', installedModuleId: null }
      ])
    ]

    const action = installModule(
      {
        assetId: 'test-workshop',
        slotId: 'slot-1',
        moduleId: 'mw_eco_ink_supply'
      },
      state
    )

    assert.equal(action.type, ActionTypes.INSTALL_MODULE)
  })

  it('mw_darkweb_vendor triggers scam_or_bust event on pinned RNG roll', () => {
    const state = makeState({
      installedModules: ['mw_darkweb_vendor']
    })

    const result = rollAssetRiskEvents(state, [0.1, 0.0], 0)

    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].eventType, 'scam_or_bust')
  })

  it('multiple revenue modules stack additively', () => {
    const asset = makeWorkshopAsset([
      { slotType: 'mw_automation', installedModuleId: 'mw_mailorder_script' },
      { slotType: 'mw_sales', installedModuleId: 'mw_bandcamp_bot' },
      { slotType: 'mw_specialty', installedModuleId: 'mw_sticker_bot' }
    ])

    const boni = getAssetAggregateBoni(asset)
    const revenue = getAssetTotalDailyRevenue(asset)

    assert.strictEqual(boni.baseDailyRevenueDelta, 65)
    assert.strictEqual(revenue, 80)
  })
})
