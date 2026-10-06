import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  addClampedPercent,
  clampPercent,
  clampMemberSkill
} from '../../src/utils/gameState/clamps.ts'
import { isNonNegativeInteger } from '../../src/utils/finiteNumber.ts'

const NON_NUMBERS = [true, false, '50', '', [], [5], {}, null, undefined]
const NON_FINITE = [
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY
]

describe('clampPercent', () => {
  it('passes values inside 0..100 through without rounding', () => {
    assert.equal(clampPercent(0), 0)
    assert.equal(clampPercent(33.7), 33.7)
    assert.equal(clampPercent(100), 100)
  })

  it('clamps out-of-range values to the bounds', () => {
    assert.equal(clampPercent(-5), 0)
    assert.equal(clampPercent(250.5), 100)
  })

  it('falls back for NaN and Infinity', () => {
    for (const value of NON_FINITE) {
      assert.equal(clampPercent(value), 0)
      assert.equal(clampPercent(value, 40), 40)
    }
  })

  it('falls back for booleans, numeric strings, arrays and other non-numbers', () => {
    for (const value of NON_NUMBERS) {
      assert.equal(clampPercent(value), 0)
      assert.equal(clampPercent(value, 12.5), 12.5)
    }
  })

  it('normalizes negative zero', () => {
    assert.equal(Object.is(clampPercent(-0), 0), true)
  })
})

describe('addClampedPercent', () => {
  it('adds and range-clamps an ordinary sum', () => {
    assert.equal(addClampedPercent(40, 15.5), 55.5)
    assert.equal(addClampedPercent(90, 30), 100)
    assert.equal(addClampedPercent(10, -30), 0)
  })

  it('caps an overflowing sum at the bounds instead of falling back', () => {
    assert.equal(addClampedPercent(Number.MAX_VALUE, Number.MAX_VALUE), 100)
    assert.equal(addClampedPercent(0, Number.MAX_VALUE * 2), 100)
    assert.equal(addClampedPercent(-Number.MAX_VALUE, -Number.MAX_VALUE), 0)
  })

  it('recovers a malformed stored base before adding', () => {
    for (const base of [...NON_NUMBERS, ...NON_FINITE]) {
      assert.equal(addClampedPercent(base, 7), 7)
    }
  })
})

describe('clampMemberSkill', () => {
  it('passes values inside 1..10 through without flooring', () => {
    assert.equal(clampMemberSkill(1), 1)
    assert.equal(clampMemberSkill(5.5), 5.5)
    assert.equal(clampMemberSkill(10), 10)
  })

  it('clamps out-of-range values to 1..10', () => {
    assert.equal(clampMemberSkill(0), 1)
    assert.equal(clampMemberSkill(-3), 1)
    assert.equal(clampMemberSkill(11), 10)
    assert.equal(clampMemberSkill(1e9), 10)
  })

  it('falls back for NaN and Infinity, then clamps the fallback', () => {
    for (const value of NON_FINITE) {
      assert.equal(clampMemberSkill(value), 1)
      assert.equal(clampMemberSkill(value, 5), 5)
      assert.equal(clampMemberSkill(value, 99), 10)
    }
  })

  it('falls back for booleans, numeric strings, arrays and other non-numbers', () => {
    for (const value of NON_NUMBERS) {
      assert.equal(clampMemberSkill(value), 1)
      assert.equal(clampMemberSkill(value, 7), 7)
    }
  })
})

describe('isNonNegativeInteger', () => {
  it('accepts zero and positive integers', () => {
    assert.equal(isNonNegativeInteger(0), true)
    assert.equal(isNonNegativeInteger(1), true)
    assert.equal(isNonNegativeInteger(Number.MAX_SAFE_INTEGER), true)
  })

  it('rejects negatives and fractions', () => {
    assert.equal(isNonNegativeInteger(-1), false)
    assert.equal(isNonNegativeInteger(1.5), false)
    assert.equal(isNonNegativeInteger(-0.5), false)
  })

  it('rejects NaN and Infinity', () => {
    for (const value of NON_FINITE) {
      assert.equal(isNonNegativeInteger(value), false)
    }
  })

  it('rejects booleans, numeric strings and other non-numbers', () => {
    for (const value of NON_NUMBERS) {
      assert.equal(isNonNegativeInteger(value), false)
    }
  })
})
