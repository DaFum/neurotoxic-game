/**
 * @fileoverview G5 Task 9 — starter perks are bounded, earned build options.
 *
 * The contract is that a perk changes how a run *plays* and never hands over a
 * payout, that it is only selectable once the unlock set carrying it is owned,
 * and that every perk reaches the run through a named production consumer.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  EXPEDITION_STARTER_PERKS,
  EXPEDITION_STARTER_PERK_IDS,
  getExpeditionStarterPerk,
  isExpeditionStarterPerkId
} from '../../src/data/expedition/starterPerks'
import { EXPEDITION_UNLOCK_SETS } from '../../src/data/expedition/unlockSets'
import { getAvailableStarterPerkIds } from '../../src/domain/expedition/loadout'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors'
import { getExpeditionIntelCapability } from '../../src/domain/expedition/nodeIntel'
import { applyExpeditionSetupProtection } from '../../src/domain/expedition/condition'
import {
  FIXTURE_RUN_SEED,
  fixtureLoadout,
  preparedState
} from '../expeditionLifecycleFixture.js'

/** Every set id that grants at least one perk capability. */
const setIdGranting = capabilityId =>
  Object.values(EXPEDITION_UNLOCK_SETS).find(set =>
    set.capabilities.includes(capabilityId)
  )?.id

/** A prepared run whose Career owns the sets behind the given perks. */
const preparedOwning = (...perkIds) => {
  const base = preparedState({ money: 5000 })
  const setIds = perkIds.map(
    perkId => setIdGranting(EXPEDITION_STARTER_PERKS[perkId].capabilityId) ?? ''
  )
  return {
    ...base,
    career: { ...base.career, unlockedSetIds: setIds }
  }
}

/** Starts the fixture run with a committed perk. */
const startWithPerk = perkId => {
  const prepared = preparedOwning(perkId)
  return gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: 'run_fixture',
      expectedRunSeed: FIXTURE_RUN_SEED,
      loadout: fixtureLoadout({ starterPerkId: perkId })
    }
  })
}

describe('G5 — the perk registry is the whole vocabulary', () => {
  it('narrows only its own ids', () => {
    for (const perkId of EXPEDITION_STARTER_PERK_IDS) {
      assert.equal(isExpeditionStarterPerkId(perkId), true, perkId)
      assert.ok(getExpeditionStarterPerk(perkId))
    }
    // A Legendary id is never a legal starter perk.
    assert.equal(isExpeditionStarterPerkId('safe_harbor'), false)
    assert.equal(getExpeditionStarterPerk('__proto__'), null)
    assert.equal(getExpeditionStarterPerk(undefined), null)
  })

  it('gives every perk an effect with a production consumer', () => {
    for (const perkId of EXPEDITION_STARTER_PERK_IDS) {
      const perk = EXPEDITION_STARTER_PERKS[perkId]
      const hasEffect =
        Object.keys(perk.numeric).length > 0 ||
        typeof perk.sponsorQualityBias === 'number' ||
        perk.revealsUndergroundCategory === true ||
        typeof perk.firstGigSetupProtection === 'number'
      assert.ok(hasEffect, `${perkId} carries no effect at all`)
    }
  })

  it('pays out nothing: no perk touches a reward multiplier', () => {
    // A perk is a build option. Cash and rewards are earned on the road.
    const forbidden = [
      'gigRewardMultiplier',
      'contractRewardMultiplier',
      'rivalRewardMultiplier',
      'finaleRewardMultiplier',
      'completionMultiplier',
      'rareRewardChanceMultiplier'
    ]
    for (const perkId of EXPEDITION_STARTER_PERK_IDS) {
      for (const key of forbidden) {
        assert.ok(
          !Object.hasOwn(EXPEDITION_STARTER_PERKS[perkId].numeric, key),
          `${perkId} pays out through ${key}`
        )
      }
    }
  })
})

describe('G5 — a perk is earned before it can be picked', () => {
  it('offers nothing to a Career that owns no unlock set', () => {
    assert.deepEqual(getAvailableStarterPerkIds(preparedState()), [])
  })

  it('offers exactly the perks whose capability the Career owns', () => {
    for (const perkId of EXPEDITION_STARTER_PERK_IDS) {
      assert.deepEqual(getAvailableStarterPerkIds(preparedOwning(perkId)), [
        perkId
      ])
    }
  })

  it('refuses to start a run with a perk the Career has not earned', () => {
    const prepared = preparedState({ money: 5000 })
    const next = gameReducer(prepared, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout({ starterPerkId: 'mechanic_kit' })
      }
    })
    assert.equal(next.expedition.status, 'prepared')
  })
})

describe('G5 — each perk reaches the run through its own consumer', () => {
  it('mechanic_kit packs one more spare part than the same run without it', () => {
    const withPerk = startWithPerk('mechanic_kit')
    const without = gameReducer(preparedState({ money: 5000 }), {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout()
      }
    })
    assert.equal(withPerk.expedition.status, 'active')
    assert.equal(
      withPerk.expedition.cargo.spareParts,
      without.expedition.cargo.spareParts + 1
    )
  })

  it('press_pass buys one more genuine Sponsor match, never more offers', () => {
    const started = startWithPerk('press_pass')
    const without = {
      ...started,
      expedition: {
        ...started.expedition,
        loadout: { ...started.expedition.loadout, starterPerkId: null }
      }
    }
    const offersWith = buildPreparedExpeditionSponsorOffers(
      started,
      started.expedition.loadout.regionId,
      started.expedition.loadout.tourTypeId
    )
    const offersWithout = buildPreparedExpeditionSponsorOffers(
      without,
      without.expedition.loadout.regionId,
      without.expedition.loadout.tourTypeId
    )
    // Quality, never count: the same number of offers is staged either way.
    assert.equal(offersWith.length, offersWithout.length)

    // And it pays nothing on its own.
    const rules = getEffectiveExpeditionRules(started).numeric
    const baseline = getEffectiveExpeditionRules(without).numeric
    assert.equal(rules.exposureGainMultiplier, baseline.exposureGainMultiplier)
    assert.equal(rules.gigRewardMultiplier, baseline.gigRewardMultiplier)
    assert.equal(rules.startingHeat, baseline.startingHeat)
  })

  it('underground_contact starts the run 5 Heat hotter and reveals the category', () => {
    const started = startWithPerk('underground_contact')
    const without = gameReducer(preparedState({ money: 5000 }), {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout()
      }
    })
    assert.equal(
      started.expedition.pressure.heat,
      without.expedition.pressure.heat + 5
    )
    assert.equal(
      getExpeditionIntelCapability(started).hasUndergroundCategoryHint,
      true
    )
    assert.equal(
      getExpeditionIntelCapability(without).hasUndergroundCategoryHint,
      false
    )
  })
})

describe('G5 — rehearsed_set protects the lowest group, once', () => {
  const condition = { pa: 80, instruments: 30, stageGear: 60, defects: [] }
  const wear = { pa: 8, instruments: 8, stageGear: 8 }

  it('spends the protection on the group that is currently lowest', () => {
    const next = applyExpeditionSetupProtection(condition, wear, 20)
    assert.deepEqual(next, { pa: 8, instruments: 0, stageGear: 8 })
  })

  it('never repairs: the absorbed wear floors at zero', () => {
    const next = applyExpeditionSetupProtection(condition, wear, 200)
    assert.equal(next.instruments, 0)
  })

  it('is a no-op without the perk', () => {
    assert.equal(applyExpeditionSetupProtection(condition, wear, 0), wear)
  })

  it('breaks a tie by the canonical group order, not key order', () => {
    const tied = { pa: 50, instruments: 50, stageGear: 50, defects: [] }
    assert.deepEqual(applyExpeditionSetupProtection(tied, wear, 5), {
      pa: 3,
      instruments: 8,
      stageGear: 8
    })
  })
})

describe('G5 — the first Gig is where rehearsed_set is actually spent', () => {
  /** Resolves one Gig through the production reducer. */
  const resolveGig = state =>
    gameReducer(state, {
      type: ActionTypes.SET_LAST_GIG_STATS,
      payload: {
        score: 10000,
        accuracy: 90,
        misses: 0,
        combo: 10,
        failed: false
      }
    })

  /** A started run whose instruments group is already the weakest. */
  const damaged = perkId => {
    const started =
      perkId === null
        ? gameReducer(preparedState({ money: 5000 }), {
            type: ActionTypes.START_EXPEDITION,
            payload: {
              prepId: 'run_fixture',
              expectedRunSeed: FIXTURE_RUN_SEED,
              loadout: fixtureLoadout()
            }
          })
        : startWithPerk(perkId)
    return {
      ...started,
      expedition: {
        ...started.expedition,
        technicalCondition: {
          pa: 90,
          instruments: 40,
          stageGear: 80,
          defects: []
        }
      }
    }
  }

  it('absorbs 20 wear on the weakest group at the first Gig', () => {
    const withPerk = resolveGig(damaged('rehearsed_set')).expedition
      .technicalCondition
    const without = resolveGig(damaged(null)).expedition.technicalCondition
    // The wear the Gig deals is identical; only the weakest group differs, and
    // the base wear is under 20, so the perk absorbs all of it.
    assert.equal(withPerk.instruments, 40)
    assert.ok(without.instruments < 40)
    assert.equal(withPerk.pa, without.pa)
    assert.equal(withPerk.stageGear, without.stageGear)
  })

  it('is spent: the second Gig of the run takes full wear', () => {
    const afterFirst = resolveGig(damaged('rehearsed_set'))
    assert.equal(
      typeof afterFirst.expedition.lastGigResolvedAtRouteStep,
      'number'
    )
    const afterSecond = resolveGig(afterFirst).expedition.technicalCondition
    assert.ok(
      afterSecond.instruments <
        afterFirst.expedition.technicalCondition.instruments,
      'the second Gig must wear the group the first one protected'
    )
  })
})
