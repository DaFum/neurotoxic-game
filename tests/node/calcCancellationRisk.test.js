import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { calcCancellationRisk } from '../../src/utils/gameState'

describe('calcCancellationRisk', () => {
  const cases = [
    {
      label: 'harmony above threshold → 0',
      harmony: 20,
      threshold: 15,
      chance: 0.2,
      expected: 0
    },
    {
      label: 'harmony <= 1 → deterministic cancel (1)',
      harmony: 1,
      threshold: 15,
      chance: 0.2,
      expected: 1
    },
    {
      label: 'low harmony > 1 → returns chance value',
      harmony: 10,
      threshold: 15,
      chance: 0.2,
      expected: 0.2
    }
  ]

  cases.forEach(({ label, harmony, threshold, chance, expected }) => {
    it(label, () => {
      assert.strictEqual(
        calcCancellationRisk(harmony, threshold, chance),
        expected
      )
    })
  })

  it('uses BALANCE_CONSTANTS defaults when called with only harmony', () => {
    assert.strictEqual(calcCancellationRisk(1), 1)
    assert.strictEqual(calcCancellationRisk(50), 0)
  })
})
