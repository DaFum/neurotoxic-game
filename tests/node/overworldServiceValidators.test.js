import test from 'node:test'
import assert from 'node:assert/strict'

import { validateBloodBankDonation } from '../../src/utils/bloodBankUtils'
import { validateDarkWebLeak } from '../../src/utils/darkWebLeakUtils'

const leakConfig = {
  COST: 100,
  FAME_GAIN: 10,
  ZEALOTRY_GAIN: 5,
  CONTROVERSY_GAIN: 5,
  HARMONY_COST: 10,
  REQUIRED_CONTROVERSY: 20
}

test('validateDarkWebLeak rejects non-finite resource values', () => {
  assert.equal(
    validateDarkWebLeak(
      { controversyLevel: 50 },
      { money: Number.NaN, day: 1 },
      { harmony: 50 },
      leakConfig
    ),
    false
  )
  assert.equal(
    validateDarkWebLeak(
      { controversyLevel: Number.NaN },
      { money: 500, day: 1 },
      { harmony: 50 },
      leakConfig
    ),
    false
  )
  assert.equal(
    validateDarkWebLeak(
      { controversyLevel: 50 },
      { money: 500, day: 1 },
      { harmony: Number.POSITIVE_INFINITY },
      leakConfig
    ),
    false
  )
})

test('validateBloodBankDonation rejects non-finite harmony and stamina', () => {
  assert.equal(
    validateBloodBankDonation(
      { harmony: Number.NaN, members: [{ stamina: 100 }] },
      { harmonyCost: 10, staminaCost: 20 }
    ),
    false
  )
  assert.equal(
    validateBloodBankDonation(
      { harmony: 50, members: [{ stamina: Number.NaN }] },
      { harmonyCost: 10, staminaCost: 20 }
    ),
    false
  )
})
