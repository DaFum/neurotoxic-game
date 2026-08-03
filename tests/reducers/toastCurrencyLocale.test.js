/**
 * @fileoverview Locale contract for currency baked into dispatched toasts.
 *
 * `AGENTS.md` requires every currency value baked into toast options to go
 * through `formatCurrency(value, i18n.language, signDisplay)`. These are the only
 * two reducers that bake currency at dispatch time, and nothing enforced the rule
 * before: the existing suites assert against `formatCurrency(…, undefined, …)`,
 * which cannot tell a locale-aware path from a hardcoded one.
 *
 * The `i18n` singleton is mocked with a mutable `language` so the same reducer
 * input can be driven under `en` and `de`. Expected values come from calling the
 * real `formatCurrency`, not from hardcoded strings, so an ICU version
 * difference cannot make this flaky.
 */

import { test, describe, mock } from 'node:test'
import assert from 'node:assert/strict'

// `t` is here because module-level consumers of the singleton (e.g.
// `src/data/postOptions.ts`) call it at import time; only `language` matters to
// the currency path under test.
const i18nStub = { language: 'en', t: key => key }

mock.module('../../src/i18n', {
  defaultExport: i18nStub
})

mock.module('../../src/utils/logger', {
  namedExports: {
    logger: { warn: mock.fn(), info: mock.fn(), debug: mock.fn() },
    isValidLogLevel: mock.fn(() => true),
    LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
  }
})

const { handleBloodBankDonate } =
  await import('../../src/context/reducers/clinicReducer')
const { handleMerchPress, handleDarkWebLeak } =
  await import('../../src/context/reducers/socialReducer')
const { formatCurrency } = await import('../../src/utils/numberUtils')

const LOCALES = ['en', 'de']

const withLocale = (locale, fn) => {
  const previous = i18nStub.language
  i18nStub.language = locale
  try {
    return fn()
  } finally {
    i18nStub.language = previous
  }
}

describe('toast-baked currency follows the active locale', () => {
  const bloodBankState = () => ({
    player: { money: 100 },
    band: {
      harmony: 80,
      members: [
        { id: 'm1', stamina: 80, staminaMax: 100 },
        { id: 'm2', stamina: 60, staminaMax: 100 }
      ]
    },
    social: { controversyLevel: 10 },
    toasts: []
  })

  const socialState = () => ({
    player: { money: 5000, fame: 0, fameLevel: 0, day: 5 },
    band: { harmony: 100, inventory: {} },
    social: {
      loyalty: 10,
      controversyLevel: 90,
      zealotry: 10,
      lastDarkWebLeakDay: null
    },
    toasts: []
  })

  for (const locale of LOCALES) {
    test(`blood-bank donate bakes deltaMoney via formatCurrency in ${locale}`, () => {
      const result = withLocale(locale, () =>
        handleBloodBankDonate(bloodBankState(), {
          moneyGain: 1200,
          harmonyCost: 30,
          staminaCost: 20,
          controversyGain: 5,
          successToast: { message: 'Donation Success', type: 'success' }
        })
      )

      assert.strictEqual(
        result.toasts[0].options.deltaMoney,
        formatCurrency(1200, locale, 'always')
      )
    })

    test(`merch press bakes the cost via formatCurrency in ${locale}`, () => {
      const result = withLocale(locale, () =>
        handleMerchPress(socialState(), {
          cost: 1500,
          loyaltyGain: 5,
          controversyGain: 10,
          harmonyCost: 0,
          successToast: { messageKey: 'ui:test', type: 'success', options: {} }
        })
      )

      assert.strictEqual(
        result.toasts[0].options.cost,
        formatCurrency(-1500, locale, 'always')
      )
    })

    test(`dark-web leak bakes the cost via formatCurrency in ${locale}`, () => {
      const result = withLocale(locale, () =>
        handleDarkWebLeak(socialState(), {
          cost: 1500,
          fameGain: 8,
          zealotryGain: 4,
          controversyGain: 10,
          harmonyCost: 5,
          successToast: { messageKey: 'ui:test', type: 'success', options: {} }
        })
      )

      assert.strictEqual(
        result.toasts[0].options.cost,
        formatCurrency(-1500, locale, 'always')
      )
    })
  }

  test('the same delta renders differently in en and de', () => {
    // Without this, all of the above would still pass if `i18n.language` were
    // ignored and a single locale were hardcoded at the formatting boundary.
    const perLocale = LOCALES.map(
      locale =>
        withLocale(locale, () =>
          handleBloodBankDonate(bloodBankState(), {
            moneyGain: 1200,
            harmonyCost: 30,
            staminaCost: 20,
            controversyGain: 5,
            successToast: { message: 'Donation Success', type: 'success' }
          })
        ).toasts[0].options.deltaMoney
    )

    assert.notStrictEqual(perLocale[0], perLocale[1])
    assert.strictEqual(perLocale[0], '+€1,200')
    assert.strictEqual(perLocale[1].replace(/\s/g, ' '), '+1.200 €')
  })
})
