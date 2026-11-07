import { test } from 'node:test'
import assert from 'node:assert'
import {
  getMerchBundleAmount,
  getTotalMerchStock,
  resolveMerchRestock
} from '../../src/utils/merchUtils.ts'
import { DEFAULT_MERCH_PRICES } from '../../src/data/merch.ts'
import { HQ_ITEMS_BY_MERCH_KEY } from '../../src/data/hqItems.ts'

test('getMerchBundleAmount', async t => {
  await t.test('returns effect value if valid', () => {
    const def = { effect: { value: 25 } }
    assert.strictEqual(getMerchBundleAmount(def), 25)
  })
  await t.test('returns 10 if invalid effect', () => {
    const def = { effect: { value: -5 } }
    assert.strictEqual(getMerchBundleAmount(def), 10)
  })
  await t.test('returns 10 if null', () => {
    assert.strictEqual(getMerchBundleAmount(null), 10)
  })
})

test('getTotalMerchStock', async t => {
  await t.test('returns total stock correctly', () => {
    const inv = { shirts: 10, hoodies: 15, invalid: 'hello' }
    assert.strictEqual(getTotalMerchStock(inv), 25)
  })
  await t.test('returns 0 if no keys overlap', () => {
    const inv = { hq_merch_shirts: 10, hq_merch_posters: 15, invalid: 'hello' }
    assert.strictEqual(getTotalMerchStock(inv), 0)
  })
})

const NEUTRAL = { merchCapacityBonus: 0, merchCostMultiplier: 1 }

test('resolveMerchRestock', async t => {
  await t.test(
    'quotes a full bundle for every key the pre-gig UI renders',
    () => {
      // The pre-gig merch rows iterate DEFAULT_MERCH_PRICES; none may reach the
      // null "unavailable" branch with the shipped catalog.
      const keys = Object.keys(DEFAULT_MERCH_PRICES)
      assert.ok(keys.length > 0)
      for (const key of keys) {
        const itemDef = HQ_ITEMS_BY_MERCH_KEY.get(key)
        assert.ok(itemDef, `${key} has an HQ merch bundle`)
        assert.strictEqual(itemDef.category, 'MERCH')
        assert.strictEqual(itemDef.currency, 'money')
        assert.strictEqual(itemDef.effect.type, 'inventory_add')
        assert.deepStrictEqual(resolveMerchRestock(key, {}, NEUTRAL), {
          restockAmount: itemDef.effect.value,
          cost: itemDef.cost
        })
      }
    }
  )

  await t.test('prorates a discounted bundle to the remaining capacity', () => {
    // 95 of 100 stocked: 5 of 25 shirts fit; ceil(ceil(150 * 0.75) * 5/25) = 23.
    assert.deepStrictEqual(
      resolveMerchRestock(
        'shirts',
        { patches: 95 },
        { merchCapacityBonus: 0, merchCostMultiplier: 0.75 }
      ),
      { restockAmount: 5, cost: 23 }
    )
  })

  await t.test('counts every merch item against the combined capacity', () => {
    const inventory = { shirts: 60, patches: 35 }
    assert.deepStrictEqual(resolveMerchRestock('shirts', inventory, NEUTRAL), {
      restockAmount: 5,
      cost: 30
    })
    assert.deepStrictEqual(
      resolveMerchRestock('shirts', inventory, {
        merchCapacityBonus: 30,
        merchCostMultiplier: 1
      }),
      { restockAmount: 25, cost: 150 }
    )
    assert.deepStrictEqual(
      resolveMerchRestock('shirts', { shirts: 60, patches: 40 }, NEUTRAL),
      { restockAmount: 0, cost: 0 }
    )
  })

  await t.test('ignores malformed stock and modifiers', () => {
    const inventory = {
      shirts: 'lots',
      patches: Number.NaN,
      hoodies: Number.POSITIVE_INFINITY,
      vinyl: 90
    }
    assert.deepStrictEqual(
      resolveMerchRestock('shirts', inventory, {
        merchCapacityBonus: Number.NaN,
        merchCostMultiplier: Number.NaN
      }),
      { restockAmount: 10, cost: 60 }
    )
  })

  await t.test(
    'returns null for keys without a restockable merch bundle',
    () => {
      for (const key of ['not_merch', '__proto__', 'constructor']) {
        assert.strictEqual(resolveMerchRestock(key, {}, NEUTRAL), null)
      }
    }
  )
})
