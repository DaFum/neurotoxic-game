import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyPostGigPerformancePenalty,
  calculateExcessMissMoneyPenalty
} from '../../src/utils/postGigUtils'

const buildFinancials = () => ({
  income: { total: 500, breakdown: [] },
  expenses: { total: 300, breakdown: [] },
  net: 200
})

test('calculateExcessMissMoneyPenalty rejects invalid numeric invariants', () => {
  assert.throws(
    () =>
      calculateExcessMissMoneyPenalty({
        misses: 1.5,
        missTolerance: 3,
        missMoneyPenalty: 20
      }),
    /misses must be a finite integer >= 0/
  )
  assert.throws(
    () =>
      calculateExcessMissMoneyPenalty({
        misses: 1,
        missTolerance: -1,
        missMoneyPenalty: 20
      }),
    /missTolerance must be a finite integer >= 0/
  )
  assert.throws(
    () =>
      calculateExcessMissMoneyPenalty({
        misses: 1,
        missTolerance: 3,
        missMoneyPenalty: Number.NaN
      }),
    /missMoneyPenalty must be a finite number >= 0/
  )
})

test('applyPostGigPerformancePenalty validates penalty inputs before financial math', () => {
  assert.throws(
    () =>
      applyPostGigPerformancePenalty({
        financials: buildFinancials(),
        misses: 8,
        missTolerance: 5,
        missMoneyPenalty: Number.POSITIVE_INFINITY
      }),
    /missMoneyPenalty must be a finite number >= 0/
  )
})
