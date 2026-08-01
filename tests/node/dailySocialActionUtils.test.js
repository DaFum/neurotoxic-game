import test from 'node:test'
import assert from 'node:assert/strict'
import { validateZealotryAction } from '../../src/utils/dailySocialActionUtils'

test('validateZealotryAction rejects non-finite numeric invariants', () => {
  assert.equal(
    validateZealotryAction(
      { lastPirateBroadcastDay: 1 },
      { day: 5, money: Number.POSITIVE_INFINITY },
      { harmony: 50 },
      {
        dayField: 'lastPirateBroadcastDay',
        config: { COST: 200, HARMONY_COST: 10 },
        loggerScope: 'PirateRadio',
        validationFailureMessage: 'test',
        successMessageKey: 'ui:pirate_radio.success'
      }
    ),
    false
  )
})
