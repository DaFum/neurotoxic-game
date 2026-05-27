import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDiyTier,
  calculateChassisUpgradeCost,
  CHASSIS_CONFIG,
  DIY_PRICE_MULT,
  DIY_RISK,
  DIY_UPKEEP_MULT,
  getNextChassisTier,
  REPAIR_COST_PER_POINT,
  UPGRADE_OVERHEAD
} from '../../src/utils/assetConfig.ts'

describe('buildDiyTier', () => {
  it('applies DIY multipliers', () => {
    const legit = {
      price: 1000,
      upkeep: 10,
      revenue: 50,
      slots: ['tb_roof'],
      baseRiskEventChance: 0.005
    }
    const diy = buildDiyTier(legit)
    assert.equal(diy.price, Math.round(1000 * DIY_PRICE_MULT))
    assert.equal(diy.upkeep, Math.round(10 * DIY_UPKEEP_MULT))
    assert.equal(diy.baseRiskEventChance, DIY_RISK)
  })

  it('preserves revenue and clones slots', () => {
    const slots = ['tb_roof', 'tb_front']
    const legit = {
      price: 1000,
      upkeep: 10,
      revenue: 20,
      slots,
      baseRiskEventChance: 0.005
    }
    const diy = buildDiyTier(legit)
    assert.equal(diy.revenue, 20)
    assert.deepEqual(diy.slots, slots)
    assert.notEqual(diy.slots, slots, 'DIY slots must be a fresh array clone')
  })
})

describe('Asset constants', () => {
  it('UPGRADE_OVERHEAD is a positive number', () => {
    assert.equal(typeof UPGRADE_OVERHEAD, 'number')
    assert.ok(UPGRADE_OVERHEAD > 0)
  })

  it('REPAIR_COST_PER_POINT is a positive number', () => {
    assert.equal(typeof REPAIR_COST_PER_POINT, 'number')
    assert.ok(REPAIR_COST_PER_POINT > 0)
  })
})

describe('chassis upgrade helpers', () => {
  it('returns the next tier until the max tier is reached', () => {
    assert.equal(getNextChassisTier(1), 2)
    assert.equal(getNextChassisTier(2), 3)
    assert.equal(getNextChassisTier(3), null)
  })

  it('clamps upgrade cost to zero when tier pricing is inverted', () => {
    const current = {
      price: 9000,
      upkeep: 20,
      revenue: 0,
      slots: ['tb_roof'],
      baseRiskEventChance: 0.005
    }
    const target = {
      price: 1000,
      upkeep: 35,
      revenue: 0,
      slots: ['tb_roof', 'tb_front'],
      baseRiskEventChance: 0.005
    }

    assert.equal(calculateChassisUpgradeCost(current, target), 0)
  })
})

describe('CHASSIS_CONFIG skeleton', () => {
  it('has entries for all four asset kinds', () => {
    for (const k of [
      'tourbus_chassis',
      'studio_chassis',
      'bandhaus_chassis',
      'merch_workshop_chassis'
    ]) {
      assert.ok(CHASSIS_CONFIG[k], `missing ${k}`)
      assert.ok(CHASSIS_CONFIG[k].legit, `${k} missing legit`)
      assert.ok(CHASSIS_CONFIG[k].diy, `${k} missing diy`)
    }
  })

  it('each kind has three tiers per flavor', () => {
    for (const k of Object.values(CHASSIS_CONFIG)) {
      for (const flavor of ['legit', 'diy']) {
        for (const tier of [1, 2, 3]) {
          assert.ok(k[flavor][tier], `tier ${tier} missing`)
        }
      }
    }
  })
})
