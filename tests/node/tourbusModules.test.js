import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS
} from '../../src/utils/assetModuleRegistry.ts'
import {
  TOURBUS_T1_SLOTS,
  TOURBUS_T2_SLOTS,
  TOURBUS_T3_SLOTS
} from '../../src/utils/assetSections/tourbusConfig.ts'

describe('tourbus modules registration', () => {
  it('registers exactly 17 tourbus_chassis modules', () => {
    const count = Object.values(MODULE_REGISTRY).filter(
      m => m.ownerKind === 'tourbus_chassis'
    ).length
    assert.equal(count, 17)
  })

  it('tb_trailer_hitch has correct slot/addsSlots/maxPerAsset shape', () => {
    const m = MODULE_REGISTRY['tb_trailer_hitch']
    assert.ok(m, 'tb_trailer_hitch must be registered')
    assert.equal(m.slotType, 'tb_trailer_mount')
    assert.ok(
      Array.isArray(m.addsSlots) && m.addsSlots.length > 0,
      'addsSlots must be non-empty'
    )
    assert.equal(m.addsSlots[0].slotType, 'tb_trailer_addon')
    assert.equal(m.addsSlots[0].count, 2)
    assert.equal(m.maxPerAsset, 1)
  })

  it('every chassis slot type (except tb_trailer_addon) has at least one compatible module', () => {
    const allSlots = new Set([
      ...TOURBUS_T1_SLOTS,
      ...TOURBUS_T2_SLOTS,
      ...TOURBUS_T3_SLOTS
    ])
    allSlots.delete('tb_trailer_addon')

    const coveredSlots = new Set(
      Object.values(MODULE_REGISTRY)
        .filter(m => m.ownerKind === 'tourbus_chassis')
        .map(m => m.slotType)
    )

    for (const slot of allSlots) {
      assert.ok(
        coveredSlots.has(slot),
        `slot type "${slot}" has no compatible tourbus module`
      )
    }
  })

  it('every module imagePromptKey resolves in MODULE_PROMPTS', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      if (m.ownerKind !== 'tourbus_chassis') continue
      assert.ok(
        Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey),
        `${id} references missing prompt key "${m.imagePromptKey}"`
      )
    }
  })
})
