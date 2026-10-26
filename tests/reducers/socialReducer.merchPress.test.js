import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

mock.module('../../src/utils/logger', {
  namedExports: {
    logger: { warn: mock.fn(), info: mock.fn() },
    isValidLogLevel: mock.fn(() => true),
    LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
  }
})

const { handleMerchPress, handleDarkWebLeak } =
  await import('../../src/context/reducers/socialReducer')
const { handleUpdateSocial } =
  await import('../../src/context/reducers/socialReducer')
const { formatCurrency } = await import('../../src/utils/numberUtils')

describe('socialReducer.merchPress', () => {
  test('drops non-finite social update numbers instead of zeroing them', () => {
    const state = {
      social: { zealotry: 7, loyalty: 11, controversyLevel: 13 },
      pendingEvents: [],
      activeStoryFlags: {}
    }

    const result = handleUpdateSocial(state, {
      zealotry: Number.POSITIVE_INFINITY,
      loyalty: Number.NaN,
      controversyLevel: Number.NEGATIVE_INFINITY
    })

    assert.strictEqual(result.social.zealotry, 7)
    assert.strictEqual(result.social.loyalty, 11)
    assert.strictEqual(result.social.controversyLevel, 13)
  })

  test('rejects if insufficient funds', () => {
    const state = {
      player: { money: 100, fame: 0, fameLevel: 0 },
      band: { harmony: 100 },
      social: { loyalty: 0, controversyLevel: 0 }
    }
    const result = handleMerchPress(state, { cost: 150 })
    assert.strictEqual(result.player.money, 100)
  })

  test('a zero-gain failed press costs cash and harmony only (#3311)', () => {
    const state = {
      player: { money: 1000, fame: 40, fameLevel: 0 },
      band: { harmony: 90, inventory: {} },
      social: { loyalty: 10, controversyLevel: 84, activeDeals: [] },
      toasts: []
    }
    const result = handleMerchPress(state, {
      cost: 150,
      loyaltyGain: 0,
      controversyGain: 0,
      fameGain: 0,
      harmonyCost: 15
    })

    assert.strictEqual(result.player.money, 850)
    assert.strictEqual(result.band.harmony, 75)
    assert.strictEqual(result.player.fame, 40)
    assert.strictEqual(result.social.loyalty, 10)
    assert.strictEqual(result.social.controversyLevel, 84)
  })

  test('applies costs and gains', () => {
    const state = {
      player: { money: 1000, fame: 0, fameLevel: 0 },
      band: { harmony: 100, inventory: {} },
      social: { loyalty: 10, controversyLevel: 0 }
    }
    const result = handleMerchPress(state, {
      cost: 150,
      loyaltyGain: 5,
      controversyGain: 10,
      harmonyCost: 0
    })

    assert.strictEqual(result.player.money, 850)
    assert.strictEqual(result.social.loyalty, 15)
    assert.strictEqual(result.social.controversyLevel, 10)
    assert.strictEqual(result.band.harmony, 100)
  })

  test('handles harmony cost on equipment failure', () => {
    const state = {
      player: { money: 1000, fame: 0, fameLevel: 0 },
      band: { harmony: 100, inventory: {} },
      social: { loyalty: 10, controversyLevel: 0 }
    }
    const result = handleMerchPress(state, {
      cost: 150,
      loyaltyGain: 5,
      controversyGain: 10,
      harmonyCost: 15
    })

    assert.strictEqual(result.player.money, 850)
    assert.strictEqual(result.band.harmony, 85)
  })

  test('returns state unchanged for payloadless or non-object dispatches', () => {
    const state = {
      player: { money: 1000, fame: 0, fameLevel: 0 },
      band: { harmony: 100, inventory: {} },
      social: { loyalty: 10, controversyLevel: 0 }
    }
    for (const hostile of [undefined, null, 'merch', 5]) {
      assert.strictEqual(handleMerchPress(state, hostile), state)
    }
  })

  test('accepts fractional player money and harmony instead of rejecting them', () => {
    const state = {
      player: { money: 1000.75, fame: 0, fameLevel: 0 },
      band: { harmony: 80.5, inventory: {} },
      social: { loyalty: 10, controversyLevel: 0 }
    }
    const result = handleMerchPress(state, {
      cost: 150,
      loyaltyGain: 5,
      controversyGain: 10,
      harmonyCost: 10
    })

    assert.notStrictEqual(result, state)
    assert.strictEqual(result.player.money, 850)
    assert.strictEqual(result.band.harmony, 70)
  })

  test('repairs non-finite or out-of-range funds without Number() coercion', () => {
    // One funds policy for every paid social action: corrupt persisted money
    // recovers to 0 and corrupt harmony to 1 (`finiteNumberOr`, then the
    // canonical clamps) instead of rejecting the action outright.
    const payload = {
      cost: 1,
      loyaltyGain: 1,
      controversyGain: 1,
      harmonyCost: 1
    }
    const makeState = (money, harmony) => ({
      player: { money, fame: 0, fameLevel: 0 },
      band: { harmony, inventory: {} },
      social: { loyalty: 10, controversyLevel: 0 }
    })
    // Corrupt money repairs to 0, which can never pay a positive cost.
    for (const money of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      -5,
      '1000',
      true
    ]) {
      const state = makeState(money, 50)
      assert.strictEqual(
        handleMerchPress(state, payload),
        state,
        `money=${String(money)} must not pay`
      )
    }
    // Corrupt harmony repairs into 1..100 and is never written back raw.
    for (const [harmony, expected] of [
      ['50', 1],
      [0, 1],
      [101, 99]
    ]) {
      const result = handleMerchPress(makeState(100, harmony), payload)
      assert.strictEqual(result.player.money, 99)
      assert.strictEqual(
        result.band.harmony,
        expected,
        `harmony=${String(harmony)}`
      )
    }
  })

  test('zealotry-style actions share the finite-number funds read', () => {
    // Cost and gains come from DARK_WEB_LEAK_CONFIG (500 cash, 20 harmony).
    const payload = {}
    const makeState = (money, harmony) => ({
      player: { money, fame: 0, fameLevel: 0, day: 3 },
      band: { harmony, inventory: {} },
      // At the dark-web leak's controversy gate, so only funds decide.
      social: { zealotry: 0, controversyLevel: 40 }
    })

    // A numeric string used to pass through Number() and be accepted.
    const stringMoney = makeState('1000', 50)
    assert.strictEqual(handleDarkWebLeak(stringMoney, payload), stringMoney)
    const boolMoney = makeState(true, 50)
    assert.strictEqual(handleDarkWebLeak(boolMoney, payload), boolMoney)

    // Fractional funds are valid state and produce a whole-unit result.
    const fractional = handleDarkWebLeak(makeState(600.5, 50.5), payload)
    assert.strictEqual(fractional.player.money, 100)
    assert.strictEqual(fractional.band.harmony, 30)
  })

  test('formats toast cost at dispatch time', () => {
    const state = {
      player: { money: 1000, fame: 0, fameLevel: 0 },
      band: { harmony: 100, inventory: {} },
      social: { loyalty: 10, controversyLevel: 0 },
      toasts: []
    }
    const result = handleMerchPress(state, {
      cost: 150,
      loyaltyGain: 5,
      controversyGain: 10,
      harmonyCost: 0,
      successToast: {
        messageKey: 'ui:test',
        type: 'success',
        options: {}
      }
    })

    assert.strictEqual(
      result.toasts[0].options.cost,
      formatCurrency(-150, undefined, 'always')
    )
  })

  test('clamps bounds at 100 and 0', () => {
    const state = {
      player: { money: 1000, fame: 0, fameLevel: 0 },
      band: { harmony: 100, inventory: {} },
      social: { loyalty: 98, controversyLevel: 95 }
    }
    const result = handleMerchPress(state, {
      cost: 150,
      loyaltyGain: 5,
      controversyGain: 10,
      harmonyCost: 0
    })

    assert.strictEqual(result.social.loyalty, 100)
    assert.strictEqual(result.social.controversyLevel, 100)
  })
})
