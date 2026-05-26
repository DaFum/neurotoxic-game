import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
// Side-effect: registers all modules including studio modules
import '../../src/utils/assetModuleRegistry.ts'
import {
  getAssetAggregateBoni,
  getActiveAssetModifiers
} from '../../src/utils/assetSelectors.ts'

/**
 * Builds a minimal studio_chassis LongTermAsset with one slot per moduleId.
 */
function makeStudioAsset(moduleIds, { condition = 100 } = {}) {
  return {
    id: 'test-studio',
    kind: 'studio_chassis',
    chassisFlavor: 'legit',
    chassisTier: 1,
    condition,
    baseUpkeep: 100,
    baseDailyRevenue: 0,
    baseRiskEventChance: 0.05,
    acquiredOnDay: 0,
    acquisitionMode: 'cash',
    slots: moduleIds.map((moduleId, i) => ({
      id: `slot-${i}`,
      slotType: 'st_control',
      position: { x: 0, y: 0 },
      installedModuleId: moduleId
    }))
  }
}

describe('Studio economy integration', () => {
  it('st_ssl_console installed → aggregated songQualityBonus is 0.20', () => {
    const asset = makeStudioAsset(['st_ssl_console'])
    const boni = getAssetAggregateBoni(asset)
    assert.strictEqual(boni.songQualityBonus, 0.2)
  })

  it('st_pro_tools_hd installed → enablesReRecording flag is true in active modifiers', () => {
    const asset = makeStudioAsset(['st_pro_tools_hd'])
    const modifiers = getActiveAssetModifiers([asset])
    assert.strictEqual(modifiers.flags.enablesReRecording, true)
  })

  it('broken studio (condition < 20) → boni neutralized to {}', () => {
    const asset = makeStudioAsset(['st_ssl_console'], { condition: 10 })
    const boni = getAssetAggregateBoni(asset)
    // The contract documented in src/utils/AGENTS.md is "condition < 20 →
    // aggregated boni neutralized" — assert the exact empty object rather
    // than a 0/undefined coalescence so a regression that surfaces a 0
    // bonus would still fail.
    assert.deepStrictEqual(boni, {})
  })

  it('two studio modules with songQualityBonus stack additively (0.20 + 0.08 = 0.28)', () => {
    const asset = makeStudioAsset(['st_ssl_console', 'st_u87_mic'])
    const boni = getAssetAggregateBoni(asset)
    // Floating-point: use approximate equality
    assert.ok(
      Math.abs((boni.songQualityBonus ?? 0) - 0.28) < 1e-9,
      `Expected 0.28 but got ${boni.songQualityBonus}`
    )
  })
})
