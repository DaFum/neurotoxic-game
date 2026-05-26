import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import {
  TOURBUS_T1_SLOTS,
  TOURBUS_T3_SLOTS
} from '../../src/utils/assetSections/tourbusConfig.ts'

describe('CHASSIS_CONFIG.tourbus_chassis', () => {
  it('legit tier 1 has 4 slots matching T1_SLOTS contents', () => {
    const tier1 = CHASSIS_CONFIG.tourbus_chassis.legit[1]
    assert.equal(tier1.slots.length, 4)
    const expected = [...TOURBUS_T1_SLOTS]
    assert.deepEqual(tier1.slots, expected)
  })

  it('diy tier 1 price equals Math.round(4000 * 0.5) = 2000', () => {
    const diy1 = CHASSIS_CONFIG.tourbus_chassis.diy[1]
    assert.equal(diy1.price, Math.round(4000 * 0.5))
    assert.equal(diy1.price, 2000)
  })

  it('legit tier 3 has 8 slots matching T3_SLOTS contents', () => {
    const tier3 = CHASSIS_CONFIG.tourbus_chassis.legit[3]
    assert.equal(tier3.slots.length, 8)
    const expected = [...TOURBUS_T3_SLOTS]
    assert.deepEqual(tier3.slots, expected)
  })

  it('all three legit tiers have baseRiskEventChance === 0.005', () => {
    for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
      assert.equal(
        CHASSIS_CONFIG.tourbus_chassis.legit[tier].baseRiskEventChance,
        0.005,
        `tier ${tier} baseRiskEventChance`
      )
    }
  })
})
