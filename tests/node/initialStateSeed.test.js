import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState.ts'

test('createInitialState rngSeed is crypto-derived, not clock-derived', () => {
  // With the clock frozen, a Date.now()-derived seed would be identical for
  // every fresh run started in the same millisecond.
  const dateNow = mock.method(Date, 'now', () => 1_700_000_000_000)
  try {
    const seeds = new Set()
    for (let i = 0; i < 8; i++) {
      const { rngSeed } = createInitialState()
      assert.ok(Number.isInteger(rngSeed))
      assert.ok(rngSeed >= 0 && rngSeed <= 0xffffffff)
      seeds.add(rngSeed)
    }
    assert.ok(
      seeds.size > 1,
      'rngSeed must not collapse to one value under a frozen clock'
    )
  } finally {
    dateNow.mock.restore()
  }
})
