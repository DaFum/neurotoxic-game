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

test('validateZealotryAction uses spendable money over raw player money', () => {
  const descriptor = {
    dayField: 'lastVoidSermonDay',
    config: { COST: 500, HARMONY_COST: 10 },
    loggerScope: 'VoidSermon',
    validationFailureMessage: 'test',
    successMessageKey: 'ui:void_sermon.success'
  }
  const args = [
    { lastVoidSermonDay: 1 },
    { day: 5, money: 1000 },
    { harmony: 50 }
  ]
  assert.equal(validateZealotryAction(...args, descriptor), true)
  assert.equal(validateZealotryAction(...args, descriptor, 200), false)
  assert.equal(validateZealotryAction(...args, descriptor, 500), true)
})
