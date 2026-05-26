import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHASSIS_CONFIG, DIY_PRICE_MULT } from '../../src/utils/assetConfig.ts'
import {
  BANDHAUS_T1_SLOTS,
  BANDHAUS_T3_SLOTS
} from '../../src/utils/assetSections/bandhausConfig.ts'

describe('CHASSIS_CONFIG.bandhaus_chassis', () => {
  it('legit tier 1 has 3 slots matching T1_SLOTS contents', () => {
    const tier1 = CHASSIS_CONFIG.bandhaus_chassis.legit[1]
    assert.equal(tier1.slots.length, 3)
    const expected = [...BANDHAUS_T1_SLOTS]
    assert.deepEqual(tier1.slots, expected)
  })

  it('legit tier 3 has 8 slots matching T3_SLOTS contents', () => {
    const tier3 = CHASSIS_CONFIG.bandhaus_chassis.legit[3]
    assert.equal(tier3.slots.length, 8)
    const expected = [...BANDHAUS_T3_SLOTS]
    assert.deepEqual(tier3.slots, expected)
  })

  it('diy tier 1 price equals Math.round(8000 * DIY_PRICE_MULT)', () => {
    const diy1 = CHASSIS_CONFIG.bandhaus_chassis.diy[1]
    assert.equal(diy1.price, Math.round(8000 * DIY_PRICE_MULT))
  })

  it('all three legit tiers have baseRiskEventChance === 0.004', () => {
    for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
      assert.equal(
        CHASSIS_CONFIG.bandhaus_chassis.legit[tier].baseRiskEventChance,
        0.004,
        `tier ${tier} baseRiskEventChance`
      )
    }
  })

  it('all legit tiers have revenue === 0', () => {
    for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
      assert.equal(
        CHASSIS_CONFIG.bandhaus_chassis.legit[tier].revenue,
        0,
        `tier ${tier} revenue`
      )
    }
  })

  it('tier 3 contains bh_secret slot, tier 2 does not', () => {
    const tier3Slots = CHASSIS_CONFIG.bandhaus_chassis.legit[3].slots
    const tier2Slots = CHASSIS_CONFIG.bandhaus_chassis.legit[2].slots
    assert.ok(
      tier3Slots.includes('bh_secret'),
      'tier 3 should include bh_secret'
    )
    assert.ok(
      !tier2Slots.includes('bh_secret'),
      'tier 2 should not include bh_secret'
    )
  })
})
