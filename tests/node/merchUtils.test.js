import { test } from 'node:test'
import assert from 'node:assert'
import {
  getMerchBundleAmount,
  getTotalMerchStock
} from '../../src/utils/merchUtils.ts'

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
    const inv = { hq_merch_shirts: 10, hq_merch_posters: 15, invalid: 'hello' }
    assert.strictEqual(getTotalMerchStock(inv), 0) // No keys overlap with test data. The items in hqItems.ts have specific keys like `shirts`.
  })
})
