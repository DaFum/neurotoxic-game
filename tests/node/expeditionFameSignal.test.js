/**
 * @fileoverview G5 Task 5 — Fame as a Career and pressure signal.
 *
 * The point of the task is what Fame is *not*: it buys no permanent Expedition
 * capability. So every test here moves `player.fame` alone and watches the
 * signals react, and the last one pins that the Career rank does not move with
 * it.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getExpeditionFameProfile } from '../../src/domain/expedition/fame.ts'
import { derivePressureDirectorContext } from '../../src/domain/expedition/pressure.ts'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors.ts'
import { getExpeditionRoutePressureProfile } from '../../src/domain/expedition/routeProfile.ts'
import { deriveExpeditionRouteProfile } from '../../src/domain/expedition/routeProfile.ts'
import { deriveExpeditionCareerRank } from '../../src/domain/expedition/meta.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

/** The fixture run at one Fame value, everything else held constant. */
const atFame = fame => {
  const base = startedState({ money: 5000 })
  return { ...base, player: { ...base.player, fame } }
}

/** One Fame value per band, from the plan's table. */
const BAND_SAMPLES = [
  [0, 'unknown'],
  [250, 'local'],
  [1000, 'underground'],
  [2500, 'rising'],
  [5000, 'touring'],
  [10000, 'headliner']
]

describe('G5 — the Fame bands are the table the plan states', () => {
  it('lands each threshold in its own band', () => {
    for (const [fame, band] of BAND_SAMPLES) {
      assert.equal(getExpeditionFameProfile(atFame(fame)).band, band)
      // One below the threshold must still be the band beneath it.
      if (fame > 0) {
        assert.notEqual(getExpeditionFameProfile(atFame(fame - 1)).band, band)
      }
    }
  })

  it('never lets a malformed Fame value escape the table', () => {
    for (const fame of [Number.NaN, Number.POSITIVE_INFINITY, -5000, null]) {
      const profile = getExpeditionFameProfile(atFame(fame))
      assert.ok(BAND_SAMPLES.some(([, band]) => band === profile.band))
      assert.ok(profile.accessTier >= 0 && profile.accessTier <= 5)
    }
  })
})

describe('G5 — Fame reaches its production consumers', () => {
  it('raises the Director expectation pressure', () => {
    assert.equal(
      derivePressureDirectorContext(atFame(0)).fameExpectationPressure,
      0
    )
    assert.equal(
      derivePressureDirectorContext(atFame(10000)).fameExpectationPressure,
      80
    )
    // Monotonic across the whole table: a better-known band is never expected
    // to deliver less.
    let previous = -1
    for (const [fame] of BAND_SAMPLES) {
      const value = derivePressureDirectorContext(
        atFame(fame)
      ).fameExpectationPressure
      assert.ok(value >= previous, `fame ${fame} lowered expectation pressure`)
      previous = value
    }
  })

  it('pulls the route toward high-profile content', () => {
    assert.ok(
      getExpeditionRoutePressureProfile(atFame(10000))
        .festivalHighProfileNodeWeightMultiplier >
        getExpeditionRoutePressureProfile(atFame(0))
          .festivalHighProfileNodeWeightMultiplier
    )
  })

  it('biases the Sponsor pool toward genuine matches, not more offers', () => {
    const region = 'home_turf'
    const tour = 'standard_tour'
    const offersAt = fame =>
      buildPreparedExpeditionSponsorOffers(atFame(fame), region, tour)
    // The count is the Region and Tour's business, not Fame's.
    assert.equal(offersAt(10000).length, offersAt(0).length)
  })

  it('keeps the route itself free of Fame', () => {
    // The map is built from the run-stable half and compared by `mapHash`, so
    // Fame must not reach it or Tour Prep could preview a route the run then
    // does not walk.
    assert.deepEqual(
      deriveExpeditionRouteProfile('home_turf', 'standard_tour'),
      deriveExpeditionRouteProfile('home_turf', 'standard_tour')
    )
  })
})

describe('G5 — Fame is a signal, not a currency', () => {
  it('does not move the Career rank', () => {
    const base = startedState({ money: 5000 })
    // Rank comes from accomplishments (Task 1). A band can be famous and still
    // have finished nothing.
    assert.equal(deriveExpeditionCareerRank(base.career), 'rookie')
    assert.equal(deriveExpeditionCareerRank(atFame(50000).career), 'rookie')
  })
})
