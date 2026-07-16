import { describe, it, expect } from 'vitest'
import {
  clampUnit,
  formatNumber,
  formatCurrency,
  formatSignedFinancialAmount
} from '../../src/utils/numberUtils'
import { finiteNumberOr } from '../../src/utils/finiteNumber'

describe('numberUtils', () => {
  describe('clampUnit', () => {
    it('clamps values to the [0, 1] interval', () => {
      expect(clampUnit(0.5)).toBe(0.5)
      expect(clampUnit(0)).toBe(0)
      expect(clampUnit(1)).toBe(1)
      expect(clampUnit(-0.1)).toBe(0)
      expect(clampUnit(-5)).toBe(0)
      expect(clampUnit(1.1)).toBe(1)
      expect(clampUnit(5)).toBe(1)
    })

    it('returns 0 for non-finite values', () => {
      expect(clampUnit(NaN)).toBe(0)
      expect(clampUnit(Infinity)).toBe(0)
      expect(clampUnit(-Infinity)).toBe(0)
    })
  })

  describe('formatNumber', () => {
    it('formats numbers using en locale by default', () => {
      expect(formatNumber(1234, 'en')).toBe('1,234')
      expect(formatNumber(1234567.89, 'en')).toBe('1,234,568') // Rounds and formats
    })

    it('formats numbers using specified locale', () => {
      // German uses dot as thousands separator
      expect(formatNumber(1234, 'de')).toBe('1.234')
      expect(formatNumber(1234567.89, 'de')).toBe('1.234.568')
    })

    it('handles non-number edge inputs consistently', () => {
      expect(formatNumber(NaN, 'en')).toBe('NaN')
      expect(formatNumber('not a number' as unknown as number, 'en')).toBe(
        'NaN'
      )
      expect(formatNumber(null as unknown as number, 'en')).toBe('0')
      expect(formatNumber(undefined as unknown as number, 'en')).toBe('NaN')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency using en locale by default', () => {
      // 'en' locale currency formatting for EUR
      expect(formatCurrency(50, 'en')).toBe('€50')
      expect(formatCurrency(1234.56, 'en')).toBe('€1,235') // Rounds to 0 fraction digits
    })

    it('formats currency using specified locale', () => {
      // 'de' locale uses non-breaking space before €, but exact space type varies by ICU version.
      // We normalize all whitespace to a standard space for robust environment-independent assertions.
      expect(formatCurrency(50, 'de').replace(/\s/g, ' ')).toBe('50 €')
      expect(formatCurrency(1234.56, 'de').replace(/\s/g, ' ')).toBe('1.235 €')
    })

    it('handles non-number edge inputs consistently', () => {
      expect(formatCurrency(NaN, 'en').replace(/\s+/g, ' ')).toBe('€NaN')
      expect(
        formatCurrency('not a number' as unknown as number, 'en').replace(
          /\s+/g,
          ' '
        )
      ).toBe('€NaN')
      expect(
        formatCurrency(null as unknown as number, 'en').replace(/\s+/g, ' ')
      ).toBe('€0')
      expect(
        formatCurrency(undefined as unknown as number, 'en').replace(
          /\s+/g,
          ' '
        )
      ).toBe('€NaN')
    })

    it('respects signDisplay option', () => {
      expect(formatCurrency(50, 'en', 'always')).toBe('+€50')
      expect(formatCurrency(0, 'en', 'always')).toBe('+€0')
      expect(formatCurrency(-50, 'en', 'always')).toBe('-€50')
      expect(formatCurrency(1000, 'de', 'always').replace(/\s+/g, ' ')).toBe(
        '+1.000 €'
      )

      expect(formatCurrency(1000, 'en', 'exceptZero')).toBe('+€1,000')
      expect(formatCurrency(0, 'en', 'exceptZero')).toBe('€0')

      expect(formatCurrency(50, 'en', 'never')).toBe('€50')
      expect(formatCurrency(-50, 'en', 'never')).toBe('€50')
    })
  })

  describe('finiteNumberOr', () => {
    it('returns finite numbers and falls back for non-finite or non-number values', () => {
      expect(finiteNumberOr(12, 99)).toBe(12)
      expect(finiteNumberOr(Number.NaN, 99)).toBe(99)
      expect(finiteNumberOr(Number.POSITIVE_INFINITY, 99)).toBe(99)
      expect(finiteNumberOr(Number.NEGATIVE_INFINITY, 99)).toBe(99)
      expect(finiteNumberOr('12', 99)).toBe(99)
    })
  })

  describe('formatSignedFinancialAmount', () => {
    it('formats income correctly', () => {
      expect(formatSignedFinancialAmount(50, 'income', 'en')).toBe('+€50')
      // Even if raw value is negative, income forces a leading +
      expect(formatSignedFinancialAmount(-50, 'income', 'en')).toBe('+€50')
      expect(formatSignedFinancialAmount(0, 'income', 'en')).toBe('+€0')
    })

    it('formats expenses correctly', () => {
      expect(formatSignedFinancialAmount(50, 'expense', 'en')).toBe('-€50')
      // Even if raw value is negative, expense forces a leading -
      expect(formatSignedFinancialAmount(-50, 'expense', 'en')).toBe('-€50')
      expect(formatSignedFinancialAmount(0, 'expense', 'en')).toBe('-€0')
    })

    it('uses the specified locale', () => {
      expect(
        formatSignedFinancialAmount(50, 'income', 'de').replace(/\s/g, ' ')
      ).toBe('+50 €')
      expect(
        formatSignedFinancialAmount(50, 'expense', 'de').replace(/\s/g, ' ')
      ).toBe('-50 €')
    })
  })
})
