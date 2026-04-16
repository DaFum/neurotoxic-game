import test from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber, formatCurrency } from '../../src/utils/numberUtils.ts'

test('formatNumber - formats numbers with default English locale', () => {
  assert.equal(formatNumber(1234567.89), '1,234,568')
  assert.equal(formatNumber(1000), '1,000')
  assert.equal(formatNumber(0), '0')
})

test('formatNumber - formats numbers with German locale', () => {
  assert.equal(formatNumber(1234567.89, 'de'), '1.234.568')
  assert.equal(formatNumber(1000, 'de'), '1.000')
})

test('formatNumber - handles edge cases gracefully', () => {
  assert.equal(formatNumber(NaN), 'NaN')
  assert.equal(formatNumber('not a number'), 'NaN')
  assert.equal(formatNumber(null), '0')
  assert.equal(formatNumber(undefined), 'NaN')
})

test('formatNumber - formats negative numbers', () => {
  assert.equal(formatNumber(-1234567.89), '-1,234,568')
  assert.equal(formatNumber(-1000), '-1,000')
})

test('formatCurrency - formats currency with default English locale', () => {
  assert.equal(formatCurrency(1234567.89).replace(/\s+/g, ' '), '€1,234,568')
  assert.equal(formatCurrency(1000).replace(/\s+/g, ' '), '€1,000')
  assert.equal(formatCurrency(0).replace(/\s+/g, ' '), '€0')
})

test('formatCurrency - formats currency with German locale', () => {
  assert.equal(
    formatCurrency(1234567.89, 'de').replace(/\s+/g, ' '),
    '1.234.568 €'
  )
  assert.equal(formatCurrency(1000, 'de').replace(/\s+/g, ' '), '1.000 €')
})

test('formatCurrency - respects signDisplay option', () => {
  assert.equal(
    formatCurrency(1000, 'en', 'always').replace(/\s+/g, ' '),
    '+€1,000'
  )
  assert.equal(
    formatCurrency(1000, 'de', 'always').replace(/\s+/g, ' '),
    '+1.000 €'
  )
})

test('formatCurrency - handles edge cases gracefully', () => {
  assert.equal(formatCurrency(NaN).replace(/\s+/g, ' '), '€NaN')
  assert.equal(formatCurrency('not a number').replace(/\s+/g, ' '), '€NaN')
  assert.equal(formatCurrency(null).replace(/\s+/g, ' '), '€0')
  assert.equal(formatCurrency(undefined).replace(/\s+/g, ' '), '€NaN')
})

test('formatCurrency - formats negative numbers with default English locale', () => {
  assert.equal(formatCurrency(-1234567.89).replace(/\s+/g, ' '), '-€1,234,568')
  assert.equal(formatCurrency(-1000).replace(/\s+/g, ' '), '-€1,000')
})

test('formatCurrency - supports other signDisplay options', () => {
  assert.equal(
    formatCurrency(1000, 'en', 'exceptZero').replace(/\s+/g, ' '),
    '+€1,000'
  )
  assert.equal(formatCurrency(0, 'en', 'exceptZero').replace(/\s+/g, ' '), '€0')
  assert.equal(
    formatCurrency(-1000, 'en', 'never').replace(/\s+/g, ' '),
    '€1,000'
  )
})
