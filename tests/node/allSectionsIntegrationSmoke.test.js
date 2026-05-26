import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_VIEWS } from '../../src/components/assets/sectionRegistry.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'
import { TOURBUS_SLOT_POSITIONS } from '../../src/utils/assetSections/tourbusConfig.ts'
import { STUDIO_SLOT_ZONES } from '../../src/utils/assetSections/studioConfig.ts'
import { BANDHAUS_SLOT_ZONES } from '../../src/utils/assetSections/bandhausConfig.ts'
import { WORKSHOP_SLOT_ZONES } from '../../src/utils/assetSections/workshopConfig.ts'

const ALL_SLOT_TYPES = [
  'tb_roof',
  'tb_front',
  'tb_side',
  'tb_interior_driver',
  'tb_interior_cabin',
  'tb_audio',
  'tb_decal',
  'tb_trailer_mount',
  'tb_trailer_addon',
  'st_control',
  'st_outboard',
  'st_mic',
  'st_monitoring',
  'st_treatment',
  'st_software',
  'st_vibe',
  'st_iso',
  'bh_stage',
  'bh_sleeping',
  'bh_kitchen',
  'bh_lounge',
  'bh_backyard',
  'bh_security',
  'bh_identity',
  'bh_secret',
  'mw_print',
  'mw_drying',
  'mw_cutting',
  'mw_packaging',
  'mw_storage',
  'mw_specialty',
  'mw_sales',
  'mw_automation'
]

const ASSET_KINDS = [
  'tourbus_chassis',
  'studio_chassis',
  'bandhaus_chassis',
  'merch_workshop_chassis'
]

describe('all long-term asset sections integration smoke', () => {
  it('every SlotType from the union has a position or zone in a section config', () => {
    const allZones = {
      ...TOURBUS_SLOT_POSITIONS,
      ...STUDIO_SLOT_ZONES,
      ...BANDHAUS_SLOT_ZONES,
      ...WORKSHOP_SLOT_ZONES
    }

    for (const slotType of ALL_SLOT_TYPES) {
      assert.ok(allZones[slotType], `Slot ${slotType} has no position/zone`)
    }
  })

  it('every AssetKind has exactly one SECTION_VIEWS entry', () => {
    for (const kind of ASSET_KINDS) {
      assert.ok(SECTION_VIEWS[kind], `${kind} has no registered view`)
    }

    const registeredKinds = Object.keys(SECTION_VIEWS).sort()
    assert.deepEqual(registeredKinds, [...ASSET_KINDS].sort())
  })

  it('MODULE_REGISTRY has 63 modules total', () => {
    assert.equal(Object.keys(MODULE_REGISTRY).length, 63)
  })
})
