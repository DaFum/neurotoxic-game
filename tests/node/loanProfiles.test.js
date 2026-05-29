import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  LOAN_PROFILES,
  computeAmortization,
  isLoanProfileEligible
} from '../../src/utils/loanProfiles.ts'

const readLocale = locale =>
  JSON.parse(readFileSync(`public/locales/${locale}/assets.json`, 'utf8'))

describe('LOAN_PROFILES', () => {
  it('all five profiles defined and no extras', () => {
    assert.deepEqual(Object.keys(LOAN_PROFILES).sort(), [
      'coop',
      'loanShark',
      'longTerm',
      'mediumTerm',
      'shortTerm'
    ])
  })

  it('every profile has positive term and non-negative rate', () => {
    for (const p of Object.values(LOAN_PROFILES)) {
      assert.ok(p.termDays > 0, `${p.id} termDays not positive`)
      assert.ok(p.interestRate >= 0, `${p.id} interestRate negative`)
      assert.equal(typeof p.labelKey, 'string')
    }
  })

  it('coop has scene presence requirement', () => {
    assert.equal(LOAN_PROFILES.coop.minScenePresenceRequired, 50)
  })

  it('profile labels resolve through the assets namespace', () => {
    const locales = {
      en: readLocale('en'),
      de: readLocale('de')
    }

    for (const profile of Object.values(LOAN_PROFILES)) {
      assert.match(profile.labelKey, /^assets:/, `${profile.id} labelKey`)
      const key = profile.labelKey.slice('assets:'.length)
      for (const [locale, entries] of Object.entries(locales)) {
        assert.equal(
          typeof entries[key],
          'string',
          `${locale}/assets.json missing ${key}`
        )
        assert.notEqual(entries[key].trim(), '')
      }
    }
  })
})

describe('computeAmortization', () => {
  it('zero-interest payment is principal/term', () => {
    assert.equal(computeAmortization(1000, 0, 100), 10)
  })

  it('positive interest returns a positive daily payment below principal', () => {
    const p = computeAmortization(10000, 0.08, 60)
    assert.ok(p > 0, 'must be positive')
    assert.ok(p < 10000, 'must be < principal')
  })

  it('shorter term means higher daily payment', () => {
    const short = computeAmortization(10000, 0.08, 30)
    const long = computeAmortization(10000, 0.08, 180)
    assert.ok(short > long, 'short term should pay more per day')
  })

  it('higher rate means higher payment at same term', () => {
    const cheap = computeAmortization(10000, 0.02, 100)
    const expensive = computeAmortization(10000, 0.2, 100)
    assert.ok(expensive > cheap, 'high rate should pay more per day')
  })
})

describe('isLoanProfileEligible', () => {
  it('rejects non-finite gate values', () => {
    assert.equal(
      isLoanProfileEligible(LOAN_PROFILES.coop, {
        fame: Number.NaN,
        scenePresence: 50
      }),
      false
    )
    assert.equal(
      isLoanProfileEligible(LOAN_PROFILES.coop, {
        fame: 0,
        scenePresence: Number.POSITIVE_INFINITY
      }),
      false
    )
  })
})
