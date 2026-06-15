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

    // Set members[1].stamina to a survivable value: must be >= staminaCost + 10 = 30
    initialState.band.members[1].stamina = 30

    const payload = {
      moneyGain: 200,
      harmonyCost: 30,
      staminaCost: 20,
      controversyGain: 5,
      successToast: { message: 'Donation Success', type: 'success' }
    }

    const result = handleBloodBankDonate(initialState, payload)

    // Player money should increase (100 + 200)
    assert.strictEqual(result.player.money, 300)

    // Band harmony should decrease (80 - 30)
    assert.strictEqual(result.band.harmony, 50)

    // Social controversy should increase (10 + 5)
    assert.strictEqual(result.social.controversyLevel, 15)

    // Members stamina should decrease
    // m1: 80 - 20 = 60
    assert.strictEqual(result.band.members[0].stamina, 60)
    // m2: 30 - 20 = 10
    assert.strictEqual(result.band.members[1].stamina, 10)

    // Toast should be added
    assert.strictEqual(result.toasts.length, 1)
    assert.strictEqual(result.toasts[0].message, 'Donation Success')

    // Check actual deltas passed to toast
    const options = result.toasts[0].options
    assert.ok(options)
    assert.strictEqual(
      options.deltaMoney,
      formatCurrency(200, undefined, 'always')
    )
    assert.strictEqual(options.deltaHarmony, 30) // 80 - 50
    assert.strictEqual(options.deltaControversy, 5) // 15 - 10
    // deltaStamina should be the total actual loss:
    // m1: 80 -> 60 = 20 lost
    // m2: 30 -> 10 = 20 lost
    // total = 40
    assert.strictEqual(options.deltaStamina, 40)
  })

  test('rejects donation when harmony is insufficient (affordability guard)', () => {
    const initialState = getInitialState()
    initialState.band.harmony = 10

    const payload = {
      moneyGain: 100,
      harmonyCost: 50, // 10 > 50 is false — guard rejects
      staminaCost: 0,
      controversyGain: 0
    }

    const result = handleBloodBankDonate(initialState, payload)

    // Guard fires: state must be returned unchanged
    assert.strictEqual(result, initialState)
  })

  test('returns original state and warns if missing band or player state', () => {
    const initialState = {
      player: { money: 100 }
      // Missing band and social
    }

    const payload = {
      moneyGain: 100
    }

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

    const payload = {
      moneyGain: 100
    }

    const result = handleBloodBankDonate(initialState, payload)

    // Should return the unmodified state object
    assert.strictEqual(result, initialState)
  })

  test('floors negative payload values for defense-in-depth', () => {
    const initialState = getInitialState()
    const payload = {
      moneyGain: -200
    }

    // The reducer now floors negative payload fields (defense-in-depth)
    // alongside the action-creator-level sanitization. A raw negative
    // moneyGain is treated as 0, so money remains unchanged.
    const result = handleBloodBankDonate(initialState, payload)

    assert.strictEqual(result.player.money, initialState.player.money)
  })

  test('applies default payload values when payload is empty or undefined', () => {
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
