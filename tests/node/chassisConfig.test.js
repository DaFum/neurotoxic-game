import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHASSIS_CONFIG, DIY_PRICE_MULT } from '../../src/utils/assetConfig.ts'
import {
  BANDHAUS_T1_SLOTS,
  BANDHAUS_T3_SLOTS
} from '../../src/utils/assetSections/bandhausConfig.ts'
import {
  STUDIO_T1_SLOTS,
  STUDIO_T3_SLOTS
} from '../../src/utils/assetSections/studioConfig.ts'
import {
  TOURBUS_T1_SLOTS,
  TOURBUS_T3_SLOTS
} from '../../src/utils/assetSections/tourbusConfig.ts'
import {
  WORKSHOP_T1_SLOTS,
  WORKSHOP_T3_SLOTS
} from '../../src/utils/assetSections/workshopConfig.ts'

const sections = [
  {
    name: 'bandhaus_chassis',
    tier1Slots: BANDHAUS_T1_SLOTS,
    tier3Slots: BANDHAUS_T3_SLOTS,
    basePrice: 8000,
    riskChance: 0.004
  },
  {
    name: 'studio_chassis',
    tier1Slots: STUDIO_T1_SLOTS,
    tier3Slots: STUDIO_T3_SLOTS,
    basePrice: 6000,
    riskChance: 0.003
  },
  {
    name: 'tourbus_chassis',
    tier1Slots: TOURBUS_T1_SLOTS,
    tier3Slots: TOURBUS_T3_SLOTS,
    basePrice: 4000,
    riskChance: 0.005
  },
  {
    name: 'merch_workshop_chassis',
    tier1Slots: WORKSHOP_T1_SLOTS,
    tier3Slots: WORKSHOP_T3_SLOTS,
    basePrice: 3500,
    riskChance: 0.003
  }
]

describe('CHASSIS_CONFIG section contracts', () => {
  for (const section of sections) {
    describe(section.name, () => {
      const config = CHASSIS_CONFIG[section.name]

      it('uses the canonical slot lists', () => {
        assert.deepEqual(config.legit[1].slots, [...section.tier1Slots])
        assert.deepEqual(config.legit[3].slots, [...section.tier3Slots])
      })

      it('derives the DIY price from the shared multiplier', () => {
        assert.equal(
          config.diy[1].price,
          Math.round(section.basePrice * DIY_PRICE_MULT)
        )
      })

      it('uses one risk chance across all legit tiers', () => {
        for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
          assert.equal(
            config.legit[tier].baseRiskEventChance,
            section.riskChance,
            `tier ${tier} baseRiskEventChance`
          )
        }
      })
    })
  }

  it('keeps bandhaus revenue neutral and its secret slot tier-gated', () => {
    const config = CHASSIS_CONFIG.bandhaus_chassis
    for (const tier of /** @type {(1|2|3)[]} */ ([1, 2, 3])) {
      assert.equal(config.legit[tier].revenue, 0, `tier ${tier} revenue`)
    }
    assert.ok(config.legit[3].slots.includes('bh_secret'))
    assert.ok(!config.legit[2].slots.includes('bh_secret'))
  })

  it('keeps revenue progression on revenue-generating sections', () => {
    assert.equal(CHASSIS_CONFIG.studio_chassis.legit[1].revenue, 20)
    assert.deepEqual(
      [1, 2, 3].map(
        tier => CHASSIS_CONFIG.merch_workshop_chassis.legit[tier].revenue
      ),
      [15, 40, 90]
    )
  })
})
