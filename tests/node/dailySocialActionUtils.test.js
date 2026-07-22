import test from 'node:test'
import assert from 'node:assert/strict'

import {
  hasDailySocialActionRunToday,
  validateDailySocialActionEligibility
} from '../../src/utils/dailySocialActionUtils'

test('hasDailySocialActionRunToday rejects missing and non-finite days', () => {
  assert.equal(hasDailySocialActionRunToday(3, 3), true)
  assert.equal(hasDailySocialActionRunToday(3, 4), false)
  assert.equal(hasDailySocialActionRunToday(3, Number.NaN), false)
  assert.equal(hasDailySocialActionRunToday(null, 3), false)
})

test('validateDailySocialActionEligibility rejects non-finite costs and thresholds', () => {
  assert.equal(
    validateDailySocialActionEligibility({
      lastActionDay: null,
      currentDay: 5,
      money: 1000,
      harmony: 50,
      cost: Number.NaN,
      harmonyCost: 10
    }),
    false
  )
  assert.equal(
    validateDailySocialActionEligibility({
      lastActionDay: null,
      currentDay: 5,
      money: 1000,
      harmony: 50,
      cost: 100,
      harmonyCost: 10,
      threshold: { value: Number.POSITIVE_INFINITY, required: 20 }
    }),
    false
  )
})

test('validateDailySocialActionEligibility clamps finite resources before comparing costs', () => {
  assert.equal(
    validateDailySocialActionEligibility({
      lastActionDay: 4,
      currentDay: 5,
      money: 200,
      harmony: 150,
      cost: 200,
      harmonyCost: 100
    }),
    true
  )
  assert.equal(
    validateDailySocialActionEligibility({
      lastActionDay: 5,
      currentDay: 5,
      money: 200,
      harmony: 100,
      cost: 200,
      harmonyCost: 10
    }),
    false
  )
})
