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

  test('rejects non-finite or out-of-range funds without Number() coercion', () => {
    const payload = {
      cost: 1,
      loyaltyGain: 1,
      controversyGain: 1,
      harmonyCost: 1
    }
    for (const [money, harmony] of [
      [Number.NaN, 50],
      [Number.POSITIVE_INFINITY, 50],
      [-5, 50],
      ['1000', 50],
      [true, 50],
      [100, '50'],
      [100, 0],
      [100, 101]
    ]) {
      const state = {
        player: { money, fame: 0, fameLevel: 0 },
        band: { harmony, inventory: {} },
        social: { loyalty: 10, controversyLevel: 0 }
      }
      assert.strictEqual(
        handleMerchPress(state, payload),
        state,
        `money=${String(money)} harmony=${String(harmony)} must be rejected`
      )
    }
  })

  test('zealotry-style actions share the finite-number funds read', () => {
    const payload = {
      cost: 10,
      fameGain: 1,
      zealotryGain: 1,
      controversyGain: 1,
      harmonyCost: 1
    }
    const makeState = (money, harmony) => ({
      player: { money, fame: 0, fameLevel: 0, day: 3 },
      band: { harmony, inventory: {} },
      social: { zealotry: 0, controversyLevel: 0 }
    })

    // A numeric string used to pass through Number() and be accepted.
    const stringMoney = makeState('1000', 50)
    assert.strictEqual(handleDarkWebLeak(stringMoney, payload), stringMoney)
    const boolMoney = makeState(true, 50)
    assert.strictEqual(handleDarkWebLeak(boolMoney, payload), boolMoney)

    // Fractional funds are valid state and produce a whole-unit result.
    const fractional = handleDarkWebLeak(makeState(100.5, 50.5), payload)
    assert.strictEqual(fractional.player.money, 90)
    assert.strictEqual(fractional.band.harmony, 49)
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
