import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePirateBroadcast } from '../../src/utils/pirateRadioUtils'

test('validatePirateBroadcast rejects non-finite numeric invariants', () => {
  assert.equal(
    validatePirateBroadcast(
      { lastPirateBroadcastDay: 1 },
      { day: 5, money: Number.POSITIVE_INFINITY },
      { harmony: 50 },
      { COST: 200, HARMONY_COST: 10 }
    ),
    false
  )
})
