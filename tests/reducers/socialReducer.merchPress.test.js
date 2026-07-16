import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

mock.module('../../src/utils/logger', {
  namedExports: {
    logger: { warn: mock.fn(), info: mock.fn() },
    isValidLogLevel: mock.fn(() => true),
    LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
  }
})

const { handleMerchPress } =
  await import('../../src/context/reducers/socialReducer')
const { handleUpdateSocial } =
  await import('../../src/context/reducers/socialReducer')
const { formatCurrency } = await import('../../src/utils/numberUtils')

describe('socialReducer.merchPress', () => {
  test('sanitizes non-finite social update numbers before clamping', () => {
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

    assert.strictEqual(result.social.zealotry, 0)
    assert.strictEqual(result.social.loyalty, 0)
    assert.strictEqual(result.social.controversyLevel, 0)
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
