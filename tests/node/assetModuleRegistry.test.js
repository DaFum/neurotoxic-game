import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS
} from '../../src/utils/assetModuleRegistry.ts'

describe('MODULE_REGISTRY invariants', () => {
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
