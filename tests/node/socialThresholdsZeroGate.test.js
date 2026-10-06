import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

// With a 0 gate, substituting 0 for a missing value would make an absent
// controversy count as high; the gates must reject non-finite input instead.
mock.module(new URL('../../src/config/balance.ts', import.meta.url).href, {
  namedExports: {
    BALANCE_CONFIG: {
      social: { highControversyThreshold: 0, cultLoyaltyThreshold: 0 }
    }
  }
})

const { isCultAudience, isHighControversy } =
  await import('../../src/utils/socialThresholds.ts')

test('a zero high-controversy gate still rejects non-finite controversy', () => {
  assert.equal(isHighControversy(0), true)
  for (const bad of [undefined, null, Number.NaN, Infinity, '5', true]) {
    assert.equal(isHighControversy(bad), false, String(bad))
  }
})

test('a zero cult gate still rejects non-finite controversy or loyalty', () => {
  assert.equal(isCultAudience(0, 0), true)
  assert.equal(isCultAudience(undefined, undefined), false)
  assert.equal(isCultAudience(10, undefined), false)
  assert.equal(isCultAudience(undefined, 10), false)
  assert.equal(isCultAudience(10, Number.NaN), false)
})
