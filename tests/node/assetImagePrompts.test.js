import test from 'node:test'
import assert from 'node:assert'
import {
  getChassisImagePrompt,
  getModuleImagePrompt,
  getRepairImagePrompt,
  appendImageSize,
  getRiskEventImagePrompt
} from '../../src/utils/imageGen.ts'

test('assetImagePrompts', async t => {
  await t.test(
    'getChassisImagePrompt returns non-empty string for all combinations',
    () => {
      const kinds = [
        'tourbus_chassis',
        'studio_chassis',
        'bandhaus_chassis',
        'merch_workshop_chassis'
      ]
      const flavors = ['legit', 'diy']
      const tiers = [1, 2, 3]
      for (const k of kinds) {
        for (const f of flavors) {
          for (const tr of tiers) {
            const p = getChassisImagePrompt(k, f, tr)
            assert.ok(p.length > 0)
          }
        }
      }
    }
  )

  await t.test('getModuleImagePrompt fallback', () => {
    const p = getModuleImagePrompt('unknown_module_xyz')
    assert.ok(p.includes('unknown module xyz'))
  })

  await t.test('getRepairImagePrompt conditions', () => {
    const p1 = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 10)
    assert.ok(p1.includes('severely damaged broken'))
    const p2 = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 30)
    assert.ok(p2.includes('damaged worn'))
    const p3 = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 80)
    assert.ok(p3.includes('needs maintenance'))
  })

  await t.test('appendImageSize', () => {
    assert.strictEqual(
      appendImageSize('http://test.com/img', 100, 200),
      'http://test.com/img?width=100&height=200'
    )
    assert.strictEqual(
      appendImageSize('http://test.com/img?seed=123', 100, 200),
      'http://test.com/img?seed=123&width=100&height=200'
    )
  })

  await t.test(
    'getRiskEventImagePrompt returns non-empty for every RiskEventType',
    () => {
      const events = [
        'eviction',
        'fire',
        'theft',
        'police_check',
        'copyright_strike',
        'raid',
        'scam_or_bust',
        'paranormal',
        'foreclosure'
      ]
      for (const ev of events) {
        assert.ok(getRiskEventImagePrompt(ev).length > 0)
      }
    }
  )
})
