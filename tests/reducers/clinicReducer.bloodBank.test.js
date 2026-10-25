import { formatCurrency } from '../../src/utils/numberUtils'
import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

mock.module('../../src/utils/logger', {
  namedExports: {
    logger: { warn: mock.fn(), info: mock.fn(), debug: mock.fn() },
    isValidLogLevel: mock.fn(() => true),
    LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
  }
})

const { handleBloodBankDonate } =
  await import('../../src/context/reducers/clinicReducer')

describe('handleBloodBankDonate Reducer', () => {
  const getInitialState = () => ({
    player: {
      money: 100
    },
    band: {
      harmony: 80,
      members: [
        { id: 'm1', stamina: 80, staminaMax: 100 },
        { id: 'm2', stamina: 50, staminaMax: 100 }
      ]
    },
    social: {
      controversyLevel: 10
    },
    toasts: []
  })

  test('successfully applies donation effects and clamps correctly', () => {
    const initialState = getInitialState()

    // Set members[1].stamina to a survivable value: must be >= staminaCost + 10 = 40
    initialState.band.members[1].stamina = 40

    // The reducer derives the amounts from the donation kind: a blood donation
    // at fame level 0 pays 100 and costs 15 harmony and 30 stamina.
    const payload = {
      kind: 'blood',
      successToast: { message: 'Donation Success', type: 'success' }
    }

    const result = handleBloodBankDonate(initialState, payload)

    // Player money should increase (100 + 100)
    assert.strictEqual(result.player.money, 200)

    // Band harmony should decrease (80 - 15)
    assert.strictEqual(result.band.harmony, 65)

    // Social controversy should increase (10 + 5)
    assert.strictEqual(result.social.controversyLevel, 15)

    // Members stamina should decrease
    // m1: 80 - 30 = 50
    assert.strictEqual(result.band.members[0].stamina, 50)
    // m2: 40 - 30 = 10
    assert.strictEqual(result.band.members[1].stamina, 10)

    // Toast should be added
    assert.strictEqual(result.toasts.length, 1)
    assert.strictEqual(result.toasts[0].message, 'Donation Success')

    // Check actual deltas passed to toast
    const options = result.toasts[0].options
    assert.ok(options)
    assert.strictEqual(
      options.deltaMoney,
      formatCurrency(100, undefined, 'always')
    )
    assert.strictEqual(options.deltaHarmony, 15) // 80 - 65
    assert.strictEqual(options.deltaControversy, 5) // 15 - 10
    // deltaStamina should be the total actual loss:
    // m1: 80 -> 50 = 30 lost
    // m2: 40 -> 10 = 30 lost
    // total = 60
    assert.strictEqual(options.deltaStamina, 60)
  })

  test('rejects donation when harmony is insufficient (affordability guard)', () => {
    const initialState = getInitialState()
    initialState.band.harmony = 10

    // 10 > 15 (the blood donation's harmony cost) is false — guard rejects
    const payload = { kind: 'blood' }

    const result = handleBloodBankDonate(initialState, payload)

    // Guard fires: state must be returned unchanged
    assert.strictEqual(result, initialState)
  })

  test('returns original state and warns if missing band or player state', () => {
    const initialState = {
      player: { money: 100 }
      // Missing band and social
    }

    const payload = { kind: 'blood' }

    const result = handleBloodBankDonate(initialState, payload)

    // Should return the unmodified state object
    assert.strictEqual(result, initialState)
  })

  test('returns original state and warns if band members are missing', () => {
    const initialState = {
      player: { money: 100 },
      band: { harmony: 100, members: [] }, // empty members
      social: { controversyLevel: 10 }
    }

    const payload = { kind: 'blood' }

    const result = handleBloodBankDonate(initialState, payload)

    // Should return the unmodified state object
    assert.strictEqual(result, initialState)
  })

  test('ignores negative or malformed amounts in the payload', () => {
    for (const amounts of [
      { moneyGain: -200 },
      { harmonyCost: Number.NaN, staminaCost: 10 },
      { harmonyCost: 10, staminaCost: '5' },
      { harmonyCost: -1, staminaCost: -1, moneyGain: 1e9 }
    ]) {
      const initialState = getInitialState()
      const result = handleBloodBankDonate(initialState, {
        kind: 'blood',
        ...amounts
      })
      // Only the kind counts: the canonical blood donation is applied.
      assert.strictEqual(result.player.money, 200)
      assert.strictEqual(result.band.harmony, 65)
    }
  })

  test('changes nothing when the payload is empty, undefined or has no kind', () => {
    const testCases = [{}, undefined, null]

    for (const payload of testCases) {
      const initialState = getInitialState()
      const result = handleBloodBankDonate(initialState, payload)

      assert.strictEqual(result.player.money, 100)
      assert.strictEqual(result.band.harmony, 80)
      assert.strictEqual(result.social.controversyLevel, 10)
      assert.strictEqual(result.band.members[0].stamina, 80)
      assert.strictEqual(result.band.members[1].stamina, 50)
    }
  })
})
