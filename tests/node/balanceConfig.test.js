import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  BALANCE_CONFIG,
  BALANCE_CONFIG_VERSION,
  parseBalanceConfig
} from '../../src/config/balance'
import {
  BAR_RATE_NORMAL,
  BAR_RATE_VIP,
  GLOBAL_PAYOUT_NERF,
  MANAGEMENT_CUT_RATE,
  MAX_GIG_NET,
  MODIFIER_COSTS,
  TICKET_SALES_CONSTANTS,
  TRAVEL_LOGISTICS_CASH_CAP,
  VENUE_SPLIT_RATES,
  calculateGigModifierCost
} from '../../src/utils/economy/constants'

/** Returns a deep, mutable clone of the shipped config. */
const cloneConfig = () => structuredClone(BALANCE_CONFIG)

describe('balance config boot guard', () => {
  it('validates the shipped config at import time', () => {
    assert.equal(BALANCE_CONFIG.configVersion, BALANCE_CONFIG_VERSION)
    assert.equal(Object.isFrozen(BALANCE_CONFIG), true)
    assert.equal(Object.isFrozen(BALANCE_CONFIG.modifiers), true)
  })

  it('round-trips its own output', () => {
    assert.deepEqual(parseBalanceConfig(cloneConfig()), BALANCE_CONFIG)
  })

  for (const [label, raw] of Object.entries({
    null: null,
    'an array': [],
    'a number': 7,
    'a string': 'config'
  })) {
    it(`rejects ${label}`, () => {
      assert.throws(() => parseBalanceConfig(raw), /must be an object/)
    })
  }

  it('rejects a mismatched configVersion', () => {
    const config = cloneConfig()
    config.configVersion = BALANCE_CONFIG_VERSION + 1
    assert.throws(() => parseBalanceConfig(config), /does not match expected/)
  })

  it('rejects a non-integer configVersion', () => {
    const config = cloneConfig()
    config.configVersion = 1.5
    assert.throws(() => parseBalanceConfig(config), /must be an integer/)
  })

  for (const section of ['attendance', 'penalties', 'modifiers', 'caps']) {
    it(`names the missing section "${section}"`, () => {
      const config = cloneConfig()
      delete config[section]
      assert.throws(
        () => parseBalanceConfig(config),
        new RegExp(`missing section "${section}"`)
      )
    })

    it(`rejects a non-object "${section}"`, () => {
      const config = cloneConfig()
      config[section] = 42
      assert.throws(
        () => parseBalanceConfig(config),
        new RegExp(`section "${section}" must be an object`)
      )
    })
  }

  it('names the missing field', () => {
    const config = cloneConfig()
    delete config.caps.maxGigNet
    assert.throws(() => parseBalanceConfig(config), /missing caps\.maxGigNet/)
  })

  for (const [label, value] of Object.entries({
    NaN: Number.NaN,
    Infinity: Number.POSITIVE_INFINITY,
    'a string': '0.5',
    null: null
  })) {
    it(`rejects ${label} for a numeric field`, () => {
      const config = cloneConfig()
      config.penalties.globalPayoutNerf = value
      assert.throws(
        () => parseBalanceConfig(config),
        /penalties\.globalPayoutNerf must be finite/
      )
    })
  }

  it('rejects an out-of-range value with its bounds', () => {
    const config = cloneConfig()
    config.attendance.baseDrawRatio = 1.5
    assert.throws(
      () => parseBalanceConfig(config),
      /attendance\.baseDrawRatio is outside \[0, 1\]: 1\.5/
    )
  })

  it('rejects a non-numeric venue split rate', () => {
    const config = cloneConfig()
    config.penalties.venueSplitRates = { 3: 'half' }
    assert.throws(
      () => parseBalanceConfig(config),
      /venueSplitRates\.3 must be finite/
    )
  })

  it('rejects a non-integer venue difficulty key', () => {
    const config = cloneConfig()
    config.penalties.venueSplitRates = { hard: 0.5 }
    assert.throws(
      () => parseBalanceConfig(config),
      /must be an integer difficulty/
    )
  })

  it('rejects an out-of-range venue split rate', () => {
    const config = cloneConfig()
    config.penalties.venueSplitRates = { 3: 2 }
    assert.throws(
      () => parseBalanceConfig(config),
      /venueSplitRates\.3 is outside \[0, 1\]/
    )
  })
})

describe('economy constants derive from the balance config', () => {
  it('keeps the shipped values', () => {
    assert.equal(GLOBAL_PAYOUT_NERF, 0.97)
    assert.equal(MAX_GIG_NET, 14550)
    assert.equal(MANAGEMENT_CUT_RATE, 0.15)
    assert.equal(BAR_RATE_VIP, 0.3)
    assert.equal(BAR_RATE_NORMAL, 0.15)
    assert.equal(TRAVEL_LOGISTICS_CASH_CAP, 45)
    assert.deepEqual(TICKET_SALES_CONSTANTS, {
      BASE_DRAW_RATIO: 0.37,
      FAME_CAPACITY_SCALER: 10,
      FAME_FILL_WEIGHT: 0.15
    })
    assert.deepEqual({ ...VENUE_SPLIT_RATES }, { 3: 0.3, 4: 0.5 })
    assert.deepEqual(
      { ...MODIFIER_COSTS },
      {
        catering: 18,
        promo: 26,
        merch: 26,
        soundcheck: 42,
        guestlist: 50
      }
    )
  })

  it('prices modifiers from the config passed as a parameter', () => {
    const config = parseBalanceConfig({
      ...cloneConfig(),
      modifiers: {
        catering: 1,
        promo: 2,
        merch: 3,
        soundcheck: 4,
        guestlist: 5
      }
    })

    assert.equal(calculateGigModifierCost('catering', undefined, config), 1)
    assert.equal(calculateGigModifierCost('guestlist', undefined, config), 5)
    // Production config stays untouched by the alternative one.
    assert.equal(calculateGigModifierCost('catering'), 18)
  })

  it('still applies the song-cost multiplier to soundcheck', () => {
    assert.equal(
      calculateGigModifierCost('soundcheck', { songCostMultiplier: 2 }),
      84
    )
  })
})
