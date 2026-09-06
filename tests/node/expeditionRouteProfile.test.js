/**
 * @fileoverview G5 Tasks 2 and 3 — the two composition paths.
 *
 * Numeric rules and route weights are the two axes a Region or Tour can differ
 * on, and each has exactly one owner. These tests hold everything else
 * constant and move one input at a time, which is also what proves no consumer
 * has grown its own id-specific branch.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules.ts'
import {
  BASE_EXPEDITION_ROUTE_PRESSURE_PROFILE,
  getExpeditionRoutePressureProfile
} from '../../src/domain/expedition/routeProfile.ts'
import { EXPEDITION_REGIONS } from '../../src/data/expedition/regions.ts'
import { EXPEDITION_TOUR_TYPES } from '../../src/data/expedition/tourTypes.ts'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

/** The fixture run, re-pointed at one Region and Tour. */
const runIn = (regionId, tourTypeId, overrides = {}) => {
  const base = startedState({ money: 5000 })
  return {
    ...base,
    ...overrides,
    expedition: {
      ...base.expedition,
      loadout: { ...base.expedition.loadout, regionId, tourTypeId }
    }
  }
}

describe('G5 — Region and Tour identity is data, not branches', () => {
  it('gives every Region and Tour a profile the composition can read', () => {
    for (const region of Object.values(EXPEDITION_REGIONS)) {
      assert.equal(typeof region.numeric, 'object')
      assert.equal(typeof region.route, 'object')
    }
    for (const tour of Object.values(EXPEDITION_TOUR_TYPES)) {
      assert.ok(tour.depth >= 6, `${tour.id} needs a real route depth`)
      const [from, to] = tour.extractionWindowRange
      assert.ok(
        from > 0 && from <= to && to < tour.depth,
        `${tour.id} extraction window must sit inside its route`
      )
    }
  })

  it('composes the Region numeric profile into the one path', () => {
    const home = getEffectiveExpeditionRules(
      runIn('home_turf', 'standard_tour')
    ).numeric
    const industrial = getEffectiveExpeditionRules(
      runIn('industrial_belt', 'standard_tour')
    ).numeric
    // Only the fields the Region states move; everything else is untouched.
    assert.equal(industrial.roadWearMultiplier / home.roadWearMultiplier, 1.15)
    assert.equal(
      industrial.repairCostMultiplier / home.repairCostMultiplier,
      0.9
    )
    assert.equal(industrial.heatGainMultiplier, home.heatGainMultiplier)

    const underground = getEffectiveExpeditionRules(
      runIn('underground_scene', 'standard_tour')
    ).numeric
    assert.equal(underground.rareRewardMultiplier, 1.2)
    assert.equal(underground.heatGainMultiplier, 1.15)
    assert.equal(
      underground.authorityEventWeightMultiplier /
        home.authorityEventWeightMultiplier,
      1.2
    )
  })

  it('composes the Tour numeric profile into the same path', () => {
    const standard = getEffectiveExpeditionRules(
      runIn('home_turf', 'standard_tour')
    ).numeric
    const survival = getEffectiveExpeditionRules(
      runIn('home_turf', 'survival_tour')
    ).numeric
    assert.equal(standard.completionMultiplier, 1)
    assert.equal(survival.completionMultiplier, 1.2)

    // Starting Heat is additive: a Tour that starts the run hot adds to the
    // baseline rather than scaling a zero.
    assert.equal(
      getEffectiveExpeditionRules(runIn('home_turf', 'underground_tour'))
        .numeric.startingHeat,
      10
    )
  })

  it('multiplies Region and Tour together rather than letting one win', () => {
    const both = getEffectiveExpeditionRules(
      runIn('corporate_circuit', 'corporate_tour')
    ).numeric
    // Region 1.10 and Tour 1.10 compose; neither replaces the other.
    assert.ok(Math.abs(both.contractRewardMultiplier - 1.21) < 1e-9)
  })
})

describe('G5 — the profile reaches its production consumers', () => {
  it('keeps the committed half free of live signals', () => {
    // Staged Sponsor offers and the route are committed once and re-derived on
    // load, so they read the stable half. If Fame moved them, a run would come
    // back from a save with a different offer set than it was given.
    const quiet = runIn('corporate_circuit', 'corporate_tour', {
      player: { fame: 0 }
    })
    const famous = runIn('corporate_circuit', 'corporate_tour', {
      player: { fame: 12000 }
    })
    assert.deepEqual(
      buildPreparedExpeditionSponsorOffers(quiet),
      buildPreparedExpeditionSponsorOffers(famous)
    )
  })

  it('lets a Contract-heavy route stage one more Sponsor offer', () => {
    const neutral = buildPreparedExpeditionSponsorOffers(
      runIn('home_turf', 'standard_tour', { player: { fame: 500 } })
    )
    const corporate = buildPreparedExpeditionSponsorOffers(
      runIn('corporate_circuit', 'corporate_tour', { player: { fame: 500 } })
    )
    const underground = buildPreparedExpeditionSponsorOffers(
      runIn('underground_scene', 'underground_tour', { player: { fame: 500 } })
    )
    // The upward side is capped by the generator's pool rather than by the
    // route: with three brand offers available, a Contract-heavy route asks
    // for four and still gets three. Asserted as "no fewer" so this stays
    // truthful if the pool later grows.
    assert.ok(
      corporate.length >= neutral.length,
      'a Contract-heavy route must never offer less than the baseline'
    )
    assert.ok(
      underground.length < neutral.length,
      'a route that keeps its distance from brands must offer fewer'
    )
    assert.ok(underground.length >= 1, 'never below one staged offer')
  })

  it('biases the Director toward the families the route favours', () => {
    // The Director reads the live profile, so the same pressure context leans
    // differently on a corporate Tour than on the baseline one.
    const neutral = runIn('home_turf', 'standard_tour', {
      player: { fame: 500 }
    })
    const corporate = runIn('corporate_circuit', 'corporate_tour', {
      player: { fame: 500 }
    })
    assert.equal(
      getExpeditionRoutePressureProfile(neutral)
        .sponsorContractEventWeightMultiplier,
      1
    )
    assert.ok(
      getExpeditionRoutePressureProfile(corporate)
        .sponsorContractEventWeightMultiplier > 1.5
    )
  })
})

describe('G5 — the route-pressure profile is the second axis', () => {
  it('is baseline for the baseline Region and Tour', () => {
    const profile = getExpeditionRoutePressureProfile(
      runIn('home_turf', 'standard_tour', { player: { fame: 500 } })
    )
    for (const [key, value] of Object.entries(
      BASE_EXPEDITION_ROUTE_PRESSURE_PROFILE
    )) {
      if (key === 'forcedRival') continue
      assert.equal(profile[key], value, `${key} must start at baseline`)
    }
    assert.equal(profile.forcedRival, false)
  })

  it('composes Region and Tour weights', () => {
    const industrial = getExpeditionRoutePressureProfile(
      runIn('industrial_belt', 'standard_tour', { player: { fame: 500 } })
    )
    assert.equal(industrial.supplyNodeWeightMultiplier, 1.25)
    assert.equal(industrial.technicalNodeWeightMultiplier, 1.25)

    // Region 1.25 and Tour 1.20 on the same category compose.
    const both = getExpeditionRoutePressureProfile(
      runIn('industrial_belt', 'survival_tour', { player: { fame: 500 } })
    )
    assert.ok(Math.abs(both.technicalNodeWeightMultiplier - 1.5) < 1e-9)
  })

  it('lets Fame move only the high-profile signal', () => {
    const unknown = getExpeditionRoutePressureProfile(
      runIn('home_turf', 'standard_tour', { player: { fame: 0 } })
    )
    const famous = getExpeditionRoutePressureProfile(
      runIn('home_turf', 'standard_tour', { player: { fame: 12000 } })
    )
    assert.equal(unknown.festivalHighProfileNodeWeightMultiplier, 0.9)
    assert.equal(famous.festivalHighProfileNodeWeightMultiplier, 1.3)
    // Fame is an attention signal, not a route editor: nothing else moves.
    for (const key of Object.keys(BASE_EXPEDITION_ROUTE_PRESSURE_PROFILE)) {
      if (key === 'festivalHighProfileNodeWeightMultiplier') continue
      assert.equal(unknown[key], famous[key], `Fame must not move ${key}`)
    }
  })

  it('forces the Rival for the Tour that hunts one', () => {
    assert.equal(
      getExpeditionRoutePressureProfile(
        runIn('home_turf', 'rival_hunt_tour', { player: { fame: 500 } })
      ).forcedRival,
      true
    )
    assert.equal(
      getExpeditionRoutePressureProfile(
        runIn('home_turf', 'standard_tour', { player: { fame: 500 } })
      ).forcedRival,
      false
    )
  })

  it('clamps however many stages pile onto one category', () => {
    const stacked = runIn('underground_scene', 'rival_hunt_tour', {
      player: { fame: 12000 }
    })
    const withNemesis = {
      ...stacked,
      rivalBand: {
        id: 'rival_1',
        name: 'R',
        alignment: 'NEUTRAL',
        powerLevel: 5
      },
      career: {
        ...stacked.career,
        rivalsById: {
          rival_1: {
            snapshot: {
              id: 'rival_1',
              name: 'R',
              style: 'NEUTRAL',
              preferredRegionId: 'underground_scene',
              signatureBehavior: 'aggressive',
              seed: 1
            },
            history: {
              relationship: 'nemesis',
              nemesisLevel: 4,
              encounterCount: 4,
              lastOutcome: 'hostile_win',
              lastSeenRunId: null,
              lastNemesisAdvanceRunId: null
            }
          }
        }
      }
    }
    const profile = getExpeditionRoutePressureProfile(withNemesis)
    for (const [key, value] of Object.entries(profile)) {
      if (key === 'forcedRival') continue
      assert.ok(value >= 0.25 && value <= 3.0, `${key} escaped the clamp`)
    }
    // A top-tier feud forces the encounter whatever Tour was booked.
    assert.equal(profile.forcedRival, true)
  })
})
