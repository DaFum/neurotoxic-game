import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHASSIS_CONFIG, DIY_PRICE_MULT } from '../../src/utils/assetConfig.ts'
import {
  STUDIO_T1_SLOTS,
  STUDIO_T3_SLOTS
} from '../../src/utils/assetSections/studioConfig.ts'

describe('CHASSIS_CONFIG.studio_chassis', () => {
  it('legit tier 1 has 3 slots matching T1_SLOTS contents', () => {
    const tier1 = CHASSIS_CONFIG.studio_chassis.legit[1]
    assert.equal(tier1.slots.length, 3)
    const expected = [...STUDIO_T1_SLOTS]
    assert.deepEqual(tier1.slots, expected)
  })

  it('legit tier 3 has 8 slots matching T3_SLOTS contents', () => {
    const tier3 = CHASSIS_CONFIG.studio_chassis.legit[3]
    assert.equal(tier3.slots.length, 8)
    const expected = [...STUDIO_T3_SLOTS]
    assert.deepEqual(tier3.slots, expected)
  })

  it('diy tier 1 price equals Math.round(6000 * DIY_PRICE_MULT)', () => {
    const diy1 = CHASSIS_CONFIG.studio_chassis.diy[1]
    assert.equal(diy1.price, Math.round(6000 * DIY_PRICE_MULT))
  })

  it('all three legit tiers have baseRiskEventChance === 0.003', () => {
    for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
      assert.equal(
        CHASSIS_CONFIG.studio_chassis.legit[tier].baseRiskEventChance,
        0.003,
        `tier ${tier} baseRiskEventChance`
      )
    }
  })

  it('legit tier 1 has positive revenue (revenue === 20)', () => {
    assert.equal(CHASSIS_CONFIG.studio_chassis.legit[1].revenue, 20)
  })
})
