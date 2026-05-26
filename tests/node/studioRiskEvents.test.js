import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
// Side-effect: registers all modules including studio modules
import '../../src/utils/assetModuleRegistry.ts'
import { rollAssetRiskEvents } from '../../src/utils/assetTicks.ts'

/**
 * Builds a minimal GameState with one studio asset.
 *
 * moduleSlots: array of { moduleId, slotType }
 * assetOptions: overrides for the asset (e.g. condition, baseRiskEventChance)
 */
function makeStateWithStudio(moduleSlots, assetOptions = {}) {
  const { condition = 100, baseRiskEventChance = 0.5 } = assetOptions

  const asset = {
    id: 'test-studio',
    kind: 'studio_chassis',
    chassisFlavor: 'legit',
    chassisTier: 1,
    condition,
    baseUpkeep: 100,
    baseDailyRevenue: 0,
    baseRiskEventChance,
    acquiredOnDay: 0,
    acquisitionMode: 'cash',
    slots: moduleSlots.map(({ moduleId, slotType = 'st_software' }, i) => ({
      id: `slot-${i}`,
      slotType,
      position: { x: 0, y: 0 },
      installedModuleId: moduleId
    }))
  }

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

/**
 * dayRngStream layout for rollAssetRiskEvents (cursor starts at 0):
 *   [0] = triggerRoll  — must be < baseRiskEventChance to fire the event
 *   [1] = typeRoll     — used to pick from typesArray via Math.floor(roll * length)
 *
 * For a single-type array: any typeRoll 0..1 → index 0.
 */
describe('Studio risk events', () => {
  it('st_cracked_daw_bundle → can emit copyright_strike', () => {
    const state = makeStateWithStudio([
      { moduleId: 'st_cracked_daw_bundle', slotType: 'st_software' }
    ])
    // triggerRoll 0.1 < 0.5 → fires; typeRoll 0.0 → index 0 of ['copyright_strike']
    const dayRngStream = [0.1, 0.0]
    const result = rollAssetRiskEvents(state, dayRngStream, 0)
    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].eventType, 'copyright_strike')
  })

  it('st_haunted_reverb_chamber → can emit paranormal', () => {
    const state = makeStateWithStudio([
      { moduleId: 'st_haunted_reverb_chamber', slotType: 'st_treatment' }
    ])
    // triggerRoll 0.1 < 0.5 → fires; typeRoll 0.0 → index 0 of ['paranormal']
    const dayRngStream = [0.1, 0.0]
    const result = rollAssetRiskEvents(state, dayRngStream, 0)
    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].eventType, 'paranormal')
  })

  it('st_stolen_russian_compressors → can emit police_check', () => {
    const state = makeStateWithStudio([
      { moduleId: 'st_stolen_russian_compressors', slotType: 'st_outboard' }
    ])
    // triggerRoll 0.1 < 0.5 → fires; typeRoll 0.0 → index 0 of ['police_check']
    const dayRngStream = [0.1, 0.0]
    const result = rollAssetRiskEvents(state, dayRngStream, 0)
    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].eventType, 'police_check')
  })

  it('studio with no DIY risk modules → default fire event type', () => {
    // st_u87_mic has no riskEventTypes — falls back to default 'fire'
    const state = makeStateWithStudio([
      { moduleId: 'st_u87_mic', slotType: 'st_mic' }
    ])
    // triggerRoll 0.1 < 0.5 → fires; no typeRoll consumed (typesArray is empty)
    const dayRngStream = [0.1]
    const result = rollAssetRiskEvents(state, dayRngStream, 0)
    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].eventType, 'fire')
  })
})
