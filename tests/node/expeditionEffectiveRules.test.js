import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NEUTRAL_EXPEDITION_MODULE_PROFILE,
  getExpeditionModuleProfile,
  aggregateExpeditionModuleProfiles
} from '../../src/domain/expedition/modules'
import {
  BASE_EXPEDITION_NUMERIC_RULES,
  getEffectiveExpeditionRules
} from '../../src/domain/expedition/effectiveRules'
import { getExplicitExtractionRareCarrySlots } from '../../src/domain/expedition/extraction'

test('Task 2: Expedition Vehicle Module Profiles', async t => {
  await t.test('returns neutral profile for empty or unmapped module', () => {
    assert.deepEqual(
      getExpeditionModuleProfile('unknown_module'),
      NEUTRAL_EXPEDITION_MODULE_PROFILE
    )
    assert.deepEqual(
      aggregateExpeditionModuleProfiles([]),
      NEUTRAL_EXPEDITION_MODULE_PROFILE
    )
  })

  await t.test(
    'maps expected real Tourbus modules to non-neutral profiles',
    () => {
      const jammer = getExpeditionModuleProfile('tb_gps_jammer')
      assert.equal(jammer.authorityIntelBonus, 1)

      const rack = getExpeditionModuleProfile('tb_roof_rack')
      assert.ok(rack.cargoCapacityBonus > 0)

      const hitch = getExpeditionModuleProfile('tb_trailer_hitch')
      assert.ok(hitch.cargoCapacityBonus > 0)

      const bunks = getExpeditionModuleProfile('tb_sleeping_bunks')
      assert.ok(bunks.restStressRecoveryBonus > 0)

      const radio = getExpeditionModuleProfile('tb_cb_radio_mesh')
      assert.ok(radio.inspectionLevel >= 1)

      const solar = getExpeditionModuleProfile('tb_solar_panel')
      assert.ok(solar.fuelConsumptionMultiplier < 1.0)
    }
  )

  await t.test('aggregates installed module profiles correctly', () => {
    const combined = aggregateExpeditionModuleProfiles([
      'tb_roof_rack',
      'tb_trailer_hitch',
      'tb_gps_jammer',
      'tb_cb_radio_mesh'
    ])
    assert.equal(
      combined.cargoCapacityBonus,
      getExpeditionModuleProfile('tb_roof_rack').cargoCapacityBonus +
        getExpeditionModuleProfile('tb_trailer_hitch').cargoCapacityBonus
    )
    assert.equal(combined.authorityIntelBonus, 1)
    assert.equal(combined.inspectionLevel, 1)
  })
})

test('Task 3: Single Effective-Rules Entrypoint', async t => {
  const mockBaseState = {
    expedition: {
      status: 'active',
      loadout: {
        activeTourbusAssetId: null,
        selectedTourbusModuleIds: []
      }
    },
    assets: []
  }

  await t.test(
    'returns canonical base rules when no chassis or modules committed',
    () => {
      const rules = getEffectiveExpeditionRules(mockBaseState)
      assert.equal(
        rules.numeric.startingSpareParts,
        BASE_EXPEDITION_NUMERIC_RULES.startingSpareParts
      )
      assert.equal(rules.numeric.explicitExtractionRareCarrySlots, 1)
      assert.equal(rules.flags.fieldRepairNoHiddenDefect, false)
      assert.equal(rules.flags.severeReliefBypass, false)
      assert.deepEqual(rules.legendary, {})
    }
  )

  await t.test(
    'composes chassis and installed module modifiers into effective rules',
    () => {
      const stateWithChassisAndModules = {
        expedition: {
          status: 'active',
          loadout: {
            activeTourbusAssetId: 'tb_asset_1',
            selectedTourbusModuleIds: [
              'tb_roof_rack',
              'tb_solar_panel',
              'tb_gps_jammer'
            ]
          }
        },
        assets: [
          {
            id: 'tb_asset_1',
            kind: 'tourbus_chassis',
            chassisFlavor: 'legit',
            chassisTier: 2, // 'coach'
            slots: [
              { id: 's1', installedModuleId: 'tb_roof_rack' },
              { id: 's2', installedModuleId: 'tb_solar_panel' },
              { id: 's3', installedModuleId: 'tb_gps_jammer' }
            ]
          }
        ]
      }

      const rules = getEffectiveExpeditionRules(stateWithChassisAndModules)
      // Coach fuel (1.20) * solar panel fuel (0.90) = 1.08
      assert.ok(
        Math.abs(rules.numeric.fuelConsumptionMultiplier - 1.2 * 0.9) < 0.001
      )
      // Coach road wear = 0.85
      assert.equal(rules.numeric.roadWearMultiplier, 0.85)
      // Coach field repair efficiency = 0.05
      assert.equal(rules.numeric.fieldRepairEfficiency, 0.05)
      // Jammer grants nodeIntelFloor 1
      assert.equal(rules.numeric.nodeIntelFloor, 1)
    }
  )

  await t.test(
    'getExplicitExtractionRareCarrySlots redirects to effective rules',
    () => {
      const slots = getExplicitExtractionRareCarrySlots(mockBaseState)
      assert.equal(slots, 1)
    }
  )
})
