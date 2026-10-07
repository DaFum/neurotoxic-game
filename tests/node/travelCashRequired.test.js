import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateTravelCashRequired } from '../../src/utils/mapUtils'

test('calculateTravelCashRequired adds positive obligations on top of the trip cost', () => {
  assert.equal(calculateTravelCashRequired(40, 25), 65)
})

test('calculateTravelCashRequired never drops below the trip cost for net-income days', () => {
  assert.equal(calculateTravelCashRequired(40, -100), 40)
  assert.equal(calculateTravelCashRequired(0, 0), 0)
})

test('calculateTravelCashRequired matches the retired inline formulas and rejects NaN', () => {
  const legacy = (cost, obligations) => Math.max(cost, cost + obligations)
  for (const cost of [0, 12.5, 80, 300]) {
    for (const obligations of [-50, 0, 15, 120.5]) {
      assert.equal(
        calculateTravelCashRequired(cost, obligations),
        legacy(cost, obligations)
      )
    }
  }
  assert.equal(calculateTravelCashRequired(Number.NaN, 10), 10)
  assert.equal(calculateTravelCashRequired(40, Number.NaN), 40)
})
