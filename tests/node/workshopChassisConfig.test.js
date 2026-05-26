import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHASSIS_CONFIG, DIY_PRICE_MULT } from '../../src/utils/assetConfig.ts'
import {
  WORKSHOP_T1_SLOTS,
  WORKSHOP_T3_SLOTS
} from '../../src/utils/assetSections/workshopConfig.ts'

describe('CHASSIS_CONFIG.merch_workshop_chassis', () => {
  it('legit tier 1 has 3 slots matching T1_SLOTS contents', () => {
    const tier1 = CHASSIS_CONFIG.merch_workshop_chassis.legit[1]
    assert.equal(tier1.slots.length, 3)
    const expected = [...WORKSHOP_T1_SLOTS]
    assert.deepEqual(tier1.slots, expected)
  })

  it('legit tier 3 has 8 slots matching T3_SLOTS contents', () => {
    const tier3 = CHASSIS_CONFIG.merch_workshop_chassis.legit[3]
    assert.equal(tier3.slots.length, 8)
    const expected = [...WORKSHOP_T3_SLOTS]
    assert.deepEqual(tier3.slots, expected)
  })

  it('diy tier 1 price equals Math.round(3500 * DIY_PRICE_MULT)', () => {
    const diy1 = CHASSIS_CONFIG.merch_workshop_chassis.diy[1]
    assert.equal(diy1.price, Math.round(3500 * DIY_PRICE_MULT))
  })

  it('all three legit tiers have baseRiskEventChance === 0.003', () => {
    for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
      assert.equal(
        CHASSIS_CONFIG.merch_workshop_chassis.legit[tier].baseRiskEventChance,
        0.003,
        `tier ${tier} baseRiskEventChance`
      )
    }
  })

  it('legit tiers define merch workshop daily revenue progression', () => {
    assert.equal(CHASSIS_CONFIG.merch_workshop_chassis.legit[1].revenue, 15)
    assert.equal(CHASSIS_CONFIG.merch_workshop_chassis.legit[2].revenue, 40)
    assert.equal(CHASSIS_CONFIG.merch_workshop_chassis.legit[3].revenue, 90)
  })
})
