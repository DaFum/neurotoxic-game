import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clampUnit,
  formatNumber,
  formatCurrency
} from '../../src/utils/numberUtils'
import { finiteNumberOr } from '../../src/utils/finiteNumber'

// --- formatNumber ---

const formatNumberCases = [
  {
    label: 'en large float',
    value: 1234567.89,
    locale: 'en',
    expected: '1,234,568'
  },
  { label: 'en thousands', value: 1000, locale: 'en', expected: '1,000' },
  { label: 'en zero', value: 0, locale: 'en', expected: '0' },
  {
    label: 'de large float',
    value: 1234567.89,
    locale: 'de',
    expected: '1.234.568'
  },
  { label: 'de thousands', value: 1000, locale: 'de', expected: '1.000' },
  {
    label: 'en negative large',
    value: -1234567.89,
    locale: 'en',
    expected: '-1,234,568'
  },
  {
    label: 'en negative thousands',
    value: -1000,
    locale: 'en',
    expected: '-1,000'
  }
]

formatNumberCases.forEach(({ label, value, locale, expected }) => {
  test(`formatNumber - ${label}`, () => {
    assert.equal(formatNumber(value, locale), expected)
  })
})

test('formatNumber - handles edge cases gracefully', () => {
  assert.equal(formatNumber(NaN, 'en'), 'NaN')
  assert.equal(formatNumber('not a number', 'en'), 'NaN')
  assert.equal(formatNumber(null, 'en'), '0')
  assert.equal(formatNumber(undefined, 'en'), 'NaN')
})

test('finiteNumberOr - returns finite numbers and falls back for non-finite values', () => {
  assert.equal(finiteNumberOr(12, 99), 12)
  assert.equal(finiteNumberOr(Number.NaN, 99), 99)
  assert.equal(finiteNumberOr(Number.POSITIVE_INFINITY, 99), 99)
  assert.equal(finiteNumberOr(Number.NEGATIVE_INFINITY, 99), 99)
  assert.equal(finiteNumberOr('12', 99), 99)
})

test('clampUnit - treats non-finite values as 0', () => {
  assert.equal(clampUnit(Number.NaN), 0)
  assert.equal(clampUnit(Number.POSITIVE_INFINITY), 0)
  assert.equal(clampUnit(Number.NEGATIVE_INFINITY), 0)
})

// --- formatCurrency ---

const formatCurrencyCases = [
  {
    label: 'en large float',
    value: 1234567.89,
    locale: 'en',
    expected: '€1,234,568'
  },
  { label: 'en thousands', value: 1000, locale: 'en', expected: '€1,000' },
  { label: 'en zero', value: 0, locale: 'en', expected: '€0' },
  {
    label: 'de large float',
    value: 1234567.89,
    locale: 'de',
    expected: '1.234.568 €'
  },
  { label: 'de thousands', value: 1000, locale: 'de', expected: '1.000 €' },
  {
    label: 'en negative large',
    value: -1234567.89,
    locale: 'en',
    expected: '-€1,234,568'
  },
  {
    label: 'en negative thousands',
    value: -1000,
    locale: 'en',
    expected: '-€1,000'
  }
]

formatCurrencyCases.forEach(({ label, value, locale, expected }) => {
  test(`formatCurrency - ${label}`, () => {
    assert.equal(formatCurrency(value, locale).replace(/\s+/g, ' '), expected)
  })
})

test('formatCurrency - handles edge cases gracefully', () => {
  assert.equal(formatCurrency(NaN, 'en').replace(/\s+/g, ' '), '€NaN')
  assert.equal(formatCurrency('not a number', 'en').replace(/\s+/g, ' '), '€NaN')
  assert.equal(formatCurrency(null, 'en').replace(/\s+/g, ' '), '€0')
  assert.equal(formatCurrency(undefined, 'en').replace(/\s+/g, ' '), '€NaN')
})

const signDisplayCases = [
  {
    label: 'en always positive',
    locale: 'en',
    signDisplay: 'always',
    value: 1000,
    expected: '+€1,000'
  },
  {
    label: 'de always positive',
    locale: 'de',
    signDisplay: 'always',
    value: 1000,
    expected: '+1.000 €'
  },
  {
    label: 'en exceptZero positive',
    locale: 'en',
    signDisplay: 'exceptZero',
    value: 1000,
    expected: '+€1,000'
  },
  {
    label: 'en exceptZero zero (no sign)',
    locale: 'en',
    signDisplay: 'exceptZero',
    value: 0,
    expected: '€0'
  },
  {
    label: 'en never negative',
    locale: 'en',
    signDisplay: 'never',
    value: -1000,
    expected: '€1,000'
  }
]

signDisplayCases.forEach(({ label, locale, signDisplay, value, expected }) => {
  test(`formatCurrency - signDisplay ${label}`, () => {
    assert.equal(
      formatCurrency(value, locale, signDisplay).replace(/\s+/g, ' '),
      expected
    )
  })
})
