import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS
} from '../../src/utils/assetModuleRegistry.ts'
import {
  STUDIO_T1_SLOTS,
  STUDIO_T2_SLOTS,
  STUDIO_T3_SLOTS
} from '../../src/utils/assetSections/studioConfig.ts'

describe('studio modules registration', () => {
  it('registers exactly 14 studio_chassis modules', () => {
    const count = Object.values(MODULE_REGISTRY).filter(
      m => m.ownerKind === 'studio_chassis'
    ).length
    assert.equal(count, 14)
  })

  it('every chassis slot type has at least one compatible studio module', () => {
    const allSlots = new Set([
      ...STUDIO_T1_SLOTS,
      ...STUDIO_T2_SLOTS,
      ...STUDIO_T3_SLOTS
    ])

    const coveredSlots = new Set(
      Object.values(MODULE_REGISTRY)
        .filter(m => m.ownerKind === 'studio_chassis')
        .map(m => m.slotType)
    )

    for (const slot of allSlots) {
      assert.ok(
        coveredSlots.has(slot),
        `slot type "${slot}" has no compatible studio module`
      )
    }
  })

  it('every studio module imagePromptKey resolves in MODULE_PROMPTS', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      if (m.ownerKind !== 'studio_chassis') continue
      assert.ok(
        Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey),
        `${id} references missing prompt key "${m.imagePromptKey}"`
      )
    }
  })

  it('st_pro_tools_hd has enablesReRecording === true', () => {
    const m = MODULE_REGISTRY['st_pro_tools_hd']
    assert.ok(m, 'st_pro_tools_hd must be registered')
    assert.equal(m.boni.enablesReRecording, true)
  })
})
