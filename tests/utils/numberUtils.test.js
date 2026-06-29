import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  clampUnit,
  formatNumber,
  formatCurrency,
  formatSignedFinancialAmount
} from '../../src/utils/numberUtils'

describe('numberUtils', () => {
  describe('clampUnit', () => {
    it('clamps values to the [0, 1] interval', () => {
      assert.equal(clampUnit(0.5), 0.5)
      assert.equal(clampUnit(0), 0)
      assert.equal(clampUnit(1), 1)
      assert.equal(clampUnit(-0.1), 0)
      assert.equal(clampUnit(-5), 0)
      assert.equal(clampUnit(1.1), 1)
      assert.equal(clampUnit(5), 1)
    })

    it('returns 0 for non-finite values', () => {
      assert.equal(clampUnit(NaN), 0)
      assert.equal(clampUnit(Infinity), 0)
      assert.equal(clampUnit(-Infinity), 0)
    })
  })

  describe('formatNumber', () => {
    it('formats numbers using en locale by default', () => {
      assert.equal(formatNumber(1234), '1,234')
      assert.equal(formatNumber(1234567.89), '1,234,568') // Rounds and formats
    })

    it('formats numbers using specified locale', () => {
      // German uses dot as thousands separator
      assert.equal(formatNumber(1234, 'de'), '1.234')
      assert.equal(formatNumber(1234567.89, 'de'), '1.234.568')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency using en locale by default', () => {
      // 'en' locale currency formatting for EUR
      assert.equal(formatCurrency(50), '€50')
      assert.equal(formatCurrency(1234.56), '€1,235') // Rounds to 0 fraction digits
    })

    it('formats currency using specified locale', () => {
      // 'de' locale uses non-breaking space \xA0 before €
      assert.equal(formatCurrency(50, 'de'), '50\xA0€')
      assert.equal(formatCurrency(1234.56, 'de'), '1.235\xA0€')
    })

    it('respects signDisplay option', () => {
      assert.equal(formatCurrency(50, 'en', 'always'), '+€50')
      assert.equal(formatCurrency(0, 'en', 'always'), '+€0')
      assert.equal(formatCurrency(-50, 'en', 'always'), '-€50')

      assert.equal(formatCurrency(50, 'en', 'never'), '€50')
      assert.equal(formatCurrency(-50, 'en', 'never'), '€50')
    })
  })

  describe('formatSignedFinancialAmount', () => {
    it('formats income correctly', () => {
      assert.equal(formatSignedFinancialAmount(50, 'income'), '+€50')
      // Even if raw value is negative, income forces a leading +
      assert.equal(formatSignedFinancialAmount(-50, 'income'), '+€50')
      assert.equal(formatSignedFinancialAmount(0, 'income'), '+€0')
    })

    it('formats expenses correctly', () => {
      assert.equal(formatSignedFinancialAmount(50, 'expense'), '-€50')
      // Even if raw value is negative, expense forces a leading -
      assert.equal(formatSignedFinancialAmount(-50, 'expense'), '-€50')
      assert.equal(formatSignedFinancialAmount(0, 'expense'), '-€0')
    })

    it('uses the specified locale', () => {
      assert.equal(formatSignedFinancialAmount(50, 'income', 'de'), '+50\xA0€')
      assert.equal(formatSignedFinancialAmount(50, 'expense', 'de'), '-50\xA0€')
    })
  })
})
