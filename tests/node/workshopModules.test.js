import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_PROMPTS,
  MODULE_REGISTRY
} from '../../src/utils/assetModuleRegistry.ts'
import {
  WORKSHOP_T1_SLOTS,
  WORKSHOP_T2_SLOTS,
  WORKSHOP_T3_SLOTS
} from '../../src/utils/assetSections/workshopConfig.ts'

const EXPECTED_WORKSHOP_MODULE_IDS = [
  'mw_4color_carousel',
  'mw_manual_press',
  'mw_eco_ink_supply',
  'mw_conveyor_dryer',
  'mw_heat_press_box',
  'mw_vinyl_cutter',
  'mw_embroidery_machine',
  'mw_badge_press',
  'mw_hot_foil_station',
  'mw_cassette_dubber',
  'mw_sticker_bot',
  'mw_storage_racks',
  'mw_mailorder_script',
  'mw_bandcamp_bot',
  'mw_darkweb_vendor',
  'mw_hype_drop_machine'
]

describe('workshop modules registration', () => {
  it('registers exactly 16 merch_workshop_chassis modules', () => {
    const moduleIds = Object.values(MODULE_REGISTRY)
      .filter(m => m.ownerKind === 'merch_workshop_chassis')
      .map(m => m.id)
      .sort()

    assert.deepEqual(moduleIds, [...EXPECTED_WORKSHOP_MODULE_IDS].sort())
  })

  it('every workshop module uses a valid workshop slot type', () => {
    const allSlots = new Set([
      ...WORKSHOP_T1_SLOTS,
      ...WORKSHOP_T2_SLOTS,
      ...WORKSHOP_T3_SLOTS
    ])

    for (const m of Object.values(MODULE_REGISTRY)) {
      if (m.ownerKind !== 'merch_workshop_chassis') continue
      assert.ok(
        allSlots.has(m.slotType),
        `${m.id} uses non-workshop slot type "${m.slotType}"`
      )
    }
  })

  it('every workshop module imagePromptKey resolves in MODULE_PROMPTS', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      if (m.ownerKind !== 'merch_workshop_chassis') continue
      assert.ok(
        Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey),
        `${id} references missing prompt key "${m.imagePromptKey}"`
      )
    }
  })

  it('mw_eco_ink_supply requires either legit or diy print module', () => {
    const m = MODULE_REGISTRY['mw_eco_ink_supply']
    assert.ok(m, 'mw_eco_ink_supply must be registered')
    assert.deepEqual(m.unlock.requiredOtherModuleInstalled, [
      'mw_4color_carousel',
      'mw_manual_press'
    ])
  })

  it('mw_darkweb_vendor registers both scam and police risk events', () => {
    const m = MODULE_REGISTRY['mw_darkweb_vendor']
    assert.ok(m, 'mw_darkweb_vendor must be registered')
    assert.deepEqual(m.riskEventTypes, ['scam_or_bust', 'police_check'])
  })
})
