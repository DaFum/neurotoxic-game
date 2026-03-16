// TODO: Implement this
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ALLOWED_TRENDS } from '../src/data/socialTrends.js'

test('ALLOWED_TRENDS data integrity', () => {
  assert.ok(Array.isArray(ALLOWED_TRENDS), 'ALLOWED_TRENDS should be an array')
  assert.strictEqual(
    ALLOWED_TRENDS.length,
    5,
    'ALLOWED_TRENDS should have exactly 5 items'
  )

  const expectedTrends = ['NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME']
  assert.deepEqual(
    ALLOWED_TRENDS,
    expectedTrends,
    'ALLOWED_TRENDS should match exactly'
  )

  ALLOWED_TRENDS.forEach(trend => {
    assert.strictEqual(
      typeof trend,
      'string',
      `Trend ${trend} should be a string`
    )
  })
})
