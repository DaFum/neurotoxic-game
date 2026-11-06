import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS,
  ASSET_MODULES_MAP
} from '../../src/utils/assets/assetModuleRegistry.ts'

describe('MODULE_REGISTRY invariants', () => {
  it('mutating MODULE_REGISTRY in place does not mutate ASSET_MODULES_MAP', () => {
    const testId = 'tb_roof_rack'
    const originalStatic = ASSET_MODULES_MAP.get(testId)
    assert.ok(originalStatic)
    const prevExclusive = originalStatic.exclusiveWithGroup

    const originalRegistry = MODULE_REGISTRY[testId]
    try {
      MODULE_REGISTRY[testId].exclusiveWithGroup = 'mutated_test_group'
      assert.equal(ASSET_MODULES_MAP.get(testId)?.exclusiveWithGroup, prevExclusive)
    } finally {
      MODULE_REGISTRY[testId] = originalRegistry
    }
  })
  it('no module has self-referential addsSlots (anti-stacking)', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      for (const a of m.addsSlots ?? []) {
        assert.notEqual(
          a.slotType,
          m.slotType,
          `${id} adds same slotType as it occupies — would enable infinite self-stacking`
        )
      }
    }
  })

  it('every module imagePromptKey exists in MODULE_PROMPTS', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      assert.ok(
        Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey),
        `${id} references missing prompt key "${m.imagePromptKey}"`
      )
    }
  })

  it('module ids are unique and match their registry key', () => {
    for (const [key, m] of Object.entries(MODULE_REGISTRY)) {
      assert.equal(m.id, key, `id ${m.id} stored under different key ${key}`)
    }
  })
})
