import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { calcCancellationRisk } from '../../src/utils/gameStateUtils'

describe('calcCancellationRisk', () => {
  it('returns 0 for harmony above threshold', () => {
    // harmony=20, threshold=15, chance=0.2 → above threshold → 0
    assert.strictEqual(calcCancellationRisk(20, 15, 0.2), 0)
  })

  it('returns 1 for harmony <= 1 (deterministic cancel)', () => {
    assert.strictEqual(calcCancellationRisk(1, 15, 0.2), 1)
  })

  it('returns the chance value for low harmony > 1', () => {
    // harmony=10, below threshold of 15, not <=1 → risk = chance = 0.2
    assert.strictEqual(calcCancellationRisk(10, 15, 0.2), 0.2)
  })

  it('uses BALANCE_CONSTANTS defaults when called with only harmony', () => {
    // harmony=1 → always 1
    assert.strictEqual(calcCancellationRisk(1), 1)
    // harmony=50 → 0
    assert.strictEqual(calcCancellationRisk(50), 0)
  })
})
