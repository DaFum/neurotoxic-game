import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  BALANCE_CONSTANTS,
  calcCancellationRisk
} from '../../src/utils/gameState'

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

  describe('tourSuccess scaling', () => {
    const threshold = BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
    const chance = BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
    const harmony = threshold - 1

    // Mirrors the roll target computed in arrivalUtils handleArrival (GIG branch).
    const engineChance = tourSuccess => chance * (1 - tourSuccess)

    ;[0, 0.5, 1].forEach(tourSuccess => {
      it(`matches the engine roll target for tourSuccess ${tourSuccess}`, () => {
        assert.strictEqual(
          calcCancellationRisk(harmony, threshold, chance, tourSuccess),
          engineChance(tourSuccess)
        )
      })
    })

    it('clamps out-of-range and non-finite tourSuccess', () => {
      assert.strictEqual(calcCancellationRisk(harmony, threshold, chance, 2), 0)
      assert.strictEqual(
        calcCancellationRisk(harmony, threshold, chance, -1),
        chance
      )
      assert.strictEqual(
        calcCancellationRisk(harmony, threshold, chance, Number.NaN),
        chance
      )
    })

    it('keeps the deterministic harmony <= 1 cancel regardless of tourSuccess', () => {
      assert.strictEqual(calcCancellationRisk(1, threshold, chance, 1), 1)
    })
  })
})
