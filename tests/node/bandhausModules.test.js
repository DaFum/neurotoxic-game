import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS
} from '../../src/utils/assetModuleRegistry.ts'
import {
  BANDHAUS_T1_SLOTS,
  BANDHAUS_T2_SLOTS,
  BANDHAUS_T3_SLOTS
} from '../../src/utils/assetSections/bandhausConfig.ts'

describe('bandhaus modules registration', () => {
  it('registers exactly 16 bandhaus_chassis modules', () => {
    const count = Object.values(MODULE_REGISTRY).filter(
      m => m.ownerKind === 'bandhaus_chassis'
    ).length
    assert.equal(count, 16)
  })

  it('every chassis slot type has at least one compatible bandhaus module', () => {
    const allSlots = new Set([
      ...BANDHAUS_T1_SLOTS,
      ...BANDHAUS_T2_SLOTS,
      ...BANDHAUS_T3_SLOTS
    ])

    const coveredSlots = new Set(
      Object.values(MODULE_REGISTRY)
        .filter(m => m.ownerKind === 'bandhaus_chassis')
        .map(m => m.slotType)
    )

    for (const slot of allSlots) {
      assert.ok(
        coveredSlots.has(slot),
        `slot type "${slot}" has no compatible bandhaus module`
      )
    }
  })

  it('every bandhaus module imagePromptKey resolves in MODULE_PROMPTS', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      if (m.ownerKind !== 'bandhaus_chassis') continue
      assert.ok(
        Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey),
        `${id} references missing prompt key "${m.imagePromptKey}"`
      )
    }
  })

  it('bh_wall_mural unlock.requiredStoryFlags contains saved_local_venue', () => {
    const m = MODULE_REGISTRY['bh_wall_mural']
    assert.ok(m, 'bh_wall_mural must be registered')
    assert.ok(
      Array.isArray(m.unlock.requiredStoryFlags) &&
        m.unlock.requiredStoryFlags.includes('saved_local_venue'),
      'bh_wall_mural must have saved_local_venue in requiredStoryFlags'
    )
  })
})
