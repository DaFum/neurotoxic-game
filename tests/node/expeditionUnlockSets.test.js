/**
 * @fileoverview G5 Task 7 — unlock sets, their gates, and the purchase journal.
 *
 * A set is only ever worth its capabilities, so consumers ask for a capability
 * and never for a set id. The purchase is a three-step journal because a
 * process that dies mid-purchase must leave evidence of what it took.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

/** Repository root, so the source sweep below does not depend on the cwd. */
const REPO_ROOT = new URL('../../', import.meta.url).pathname

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  EXPEDITION_UNLOCK_SETS,
  EXPEDITION_UNLOCK_SET_IDS,
  isExpeditionCapabilityUnlocked
} from '../../src/data/expedition/unlockSets'
import {
  HQ_FACILITY_IDS,
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL
} from '../../src/data/expedition/hqFacilities'
import {
  getAvailableExpeditionRegionIds,
  getAvailableExpeditionTourTypeIds
} from '../../src/domain/expedition/loadout'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers'
import { createInitialState } from '../../src/context/initialState'
import { getEligibleCrewSignatureTrait } from '../../src/domain/expedition/career'
import { getAvailableStarterPerkIds } from '../../src/domain/expedition/loadout'
import { getAvailableNativeContractTemplateIds } from '../../src/domain/expedition/loadout'
import { validateExpeditionBuildCommitment } from '../../src/domain/expedition/loadout'
import { isCrewAvailable } from '../../src/domain/expedition/crew'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors'
import { resolveExpeditionInspection } from '../../src/domain/expedition/inspections'
import { resolveExpeditionPressureDirectorStep } from '../../src/domain/expedition/pressure'
import { selectExpeditionRivalForRun } from '../../src/domain/expedition/rivals'
import { startedState } from '../expeditionLifecycleFixture.js'

/**
 * Every sold capability and the production path that makes it authoritative.
 *
 * @remarks
 * Hand-written on purpose: it is the list a reviewer can check against the
 * code. A capability that reaches the registry without an entry here is dead
 * inventory - the Career is charged Tokens for something no availability path
 * consults - and the registry test below fails rather than shipping it.
 *
 * The consumer is the imported function itself rather than its name: a name
 * that no longer exists used to sit here as a string that nothing could
 * falsify, and two of them had already drifted off real exports.
 */
const CAPABILITY_CONSUMERS = new Map([
  ['region_industrial_belt', getAvailableExpeditionRegionIds],
  ['region_corporate_circuit', getAvailableExpeditionRegionIds],
  ['region_underground_scene', getAvailableExpeditionRegionIds],
  ['region_festival_fields', getAvailableExpeditionRegionIds],
  ['tour_survival_tour', getAvailableExpeditionTourTypeIds],
  ['tour_corporate_tour', getAvailableExpeditionTourTypeIds],
  ['tour_underground_tour', getAvailableExpeditionTourTypeIds],
  ['tour_blitz_tour', getAvailableExpeditionTourTypeIds],
  ['tour_rival_hunt_tour', getAvailableExpeditionTourTypeIds],
  ['crew_manager', isCrewAvailable],
  ['crew_security', isCrewAvailable],
  ['crew_signature_traits', getEligibleCrewSignatureTrait],
  ['perk_mechanic_kit', getAvailableStarterPerkIds],
  ['perk_press_pass', getAvailableStarterPerkIds],
  ['perk_underground_contact', getAvailableStarterPerkIds],
  ['perk_rehearsed_set', getAvailableStarterPerkIds],
  ['chassis_higher_tier', validateExpeditionBuildCommitment],
  ['advanced_inspection', resolveExpeditionInspection],
  ['premium_sponsor_pool', buildPreparedExpeditionSponsorOffers],
  ['performance_contract_pool', getAvailableNativeContractTemplateIds],
  // The *pre-selection* gate, not the resolution-side one: the Director filters
  // `isEligible` before it spends the step's single draw, so a fresh Career
  // never has the Underground invite surfaced at all. Checking only at
  // resolution would let the event be selected and shown first, which is the
  // content `underground_network` is charging for.
  ['black_market_content', resolveExpeditionPressureDirectorStep],
  ['rival_quest_continuation', selectExpeditionRivalForRun]
])

/** A Career that satisfies everything one set needs, and nothing more. */
const readyFor = (setId, overrides = {}) => {
  const set = EXPEDITION_UNLOCK_SETS[setId]
  const base = startedState({ money: 5000 })
  const rankCounters =
    set.requiredRank === 'headliner'
      ? {
          completedExpeditionRuns: 5,
          finalizedExpeditionRuns: 5,
          completedExpeditionRegionIds: ['home_turf', 'festival_fields']
        }
      : set.requiredRank === 'roadtested'
        ? {
            completedExpeditionRuns: 1,
            finalizedExpeditionRuns: 2,
            completedExpeditionRegionIds: []
          }
        : {}
  return {
    ...base,
    career: {
      ...base.career,
      ...rankCounters,
      tourTokens: set.cost,
      hqFacilityLevels: {
        [set.requiredFacility.id]: set.requiredFacility.level
      },
      ...overrides
    }
  }
}

const begin = (state, setId) =>
  gameReducer(state, {
    type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })
const complete = (state, setId) =>
  gameReducer(state, {
    type: ActionTypes.COMPLETE_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })
const rollback = (state, setId) =>
  gameReducer(state, {
    type: ActionTypes.ROLLBACK_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })

describe('G5 — the unlock registry pays for every facility level', () => {
  it('gives each purchasable facility level at least one consumer', () => {
    // The Task 6 requirement: a level nothing needs must not be sellable.
    const required = new Set(
      EXPEDITION_UNLOCK_SET_IDS.map(id => {
        const facility = EXPEDITION_UNLOCK_SETS[id].requiredFacility
        return `${facility.id}:${facility.level}`
      })
    )
    for (const facilityId of HQ_FACILITY_IDS) {
      for (
        let level = 1;
        level <= HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[facilityId];
        level++
      ) {
        assert.ok(
          required.has(`${facilityId}:${level}`),
          `${facilityId} L${level} is purchasable but no unlock set needs it`
        )
      }
    }
  })

  it('requires only levels the facility registry implements', () => {
    for (const id of EXPEDITION_UNLOCK_SET_IDS) {
      const { requiredFacility, capabilities, cost } =
        EXPEDITION_UNLOCK_SETS[id]
      assert.ok(
        requiredFacility.level <=
          HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[requiredFacility.id],
        `${id} needs an unbuilt level`
      )
      assert.ok(cost > 0, `${id} must cost something`)
      assert.ok(capabilities.length > 0, `${id} grants nothing`)
    }
  })

  it('never grants the same capability from two sets', () => {
    const seen = new Set()
    for (const id of EXPEDITION_UNLOCK_SET_IDS) {
      for (const capability of EXPEDITION_UNLOCK_SETS[id].capabilities) {
        assert.ok(!seen.has(capability), `${capability} is sold twice`)
        seen.add(capability)
      }
    }
  })
})

describe('G5 — capability is the only question a consumer asks', () => {
  it('resolves a capability from any owning set', () => {
    assert.equal(
      isExpeditionCapabilityUnlocked(['festival_network'], 'tour_blitz_tour'),
      true
    )
    assert.equal(
      isExpeditionCapabilityUnlocked(['festival_network'], 'crew_manager'),
      false
    )
  })

  it('refuses a malformed or forged owned-set list', () => {
    for (const owned of [null, undefined, 'festival_network', [42], ['nope']]) {
      assert.equal(
        isExpeditionCapabilityUnlocked(owned, 'tour_blitz_tour'),
        false
      )
    }
  })
})

describe('G5 — availability follows the capability', () => {
  it('offers exactly home_turf and standard_tour to a fresh Career', () => {
    const fresh = startedState({ money: 5000 })
    assert.deepEqual(getAvailableExpeditionTourTypeIds(fresh), [
      'standard_tour'
    ])
    // One free Region, and it is the only one. `industrial_belt` is the
    // pre-G5 route baseline but it is sold now, so leaving it here would
    // make `region_industrial_belt` dead inventory.
    assert.deepEqual(getAvailableExpeditionRegionIds(fresh), ['home_turf'])
  })

  it('opens exactly what the bought set is worth', () => {
    const base = startedState({ money: 5000 })
    const withFestival = {
      ...base,
      career: { ...base.career, unlockedSetIds: ['festival_network'] }
    }
    assert.ok(
      getAvailableExpeditionTourTypeIds(withFestival).includes('blitz_tour')
    )
    assert.ok(
      getAvailableExpeditionRegionIds(withFestival).includes('festival_fields')
    )
    // and nothing another set owns
    assert.ok(
      !getAvailableExpeditionTourTypeIds(withFestival).includes(
        'corporate_tour'
      )
    )
  })
})

describe('G5 — the purchase journal', () => {
  it('debits with the entry and grants only on complete', () => {
    const ready = readyFor('mechanic_network')
    const cost = EXPEDITION_UNLOCK_SETS.mechanic_network.cost

    const opened = begin(ready, 'mechanic_network')
    assert.equal(opened.career.tourTokens, 0)
    assert.deepEqual(opened.career.pendingUnlockPurchase, {
      setId: 'mechanic_network',
      debitedTokens: cost
    })
    // Not granted yet — the debit and the grant are deliberately separate.
    assert.deepEqual(opened.career.unlockedSetIds, [])

    const done = complete(opened, 'mechanic_network')
    assert.deepEqual(done.career.unlockedSetIds, ['mechanic_network'])
    assert.equal(done.career.pendingUnlockPurchase, null)
    assert.equal(done.career.tourTokens, 0)
  })

  it('refunds exactly what it debited on rollback', () => {
    const ready = readyFor('mechanic_network')
    const rolled = rollback(
      begin(ready, 'mechanic_network'),
      'mechanic_network'
    )
    assert.equal(rolled.career.tourTokens, ready.career.tourTokens)
    assert.deepEqual(rolled.career.unlockedSetIds, [])
    assert.equal(rolled.career.pendingUnlockPurchase, null)
  })

  it('holds one purchase open at a time', () => {
    const ready = readyFor('mechanic_network', { tourTokens: 50 })
    const opened = begin(ready, 'mechanic_network')
    // A second begin would stack debits, so it is refused outright.
    assert.equal(begin(opened, 'mechanic_network'), opened)
  })

  it('refuses a complete or rollback that names a different set', () => {
    const opened = begin(readyFor('mechanic_network'), 'mechanic_network')
    assert.equal(complete(opened, 'rival_network'), opened)
    assert.equal(rollback(opened, 'rival_network'), opened)
  })

  it('refuses a set whose rank the Career has not earned', () => {
    // rival_network needs headliner; a rookie with the Tokens and the facility
    // still cannot buy it.
    const rookie = readyFor('rival_network', {
      completedExpeditionRuns: 0,
      finalizedExpeditionRuns: 0,
      completedExpeditionRegionIds: []
    })
    assert.equal(begin(rookie, 'rival_network'), rookie)
  })

  it('refuses a set whose facility level is missing', () => {
    const noFacility = readyFor('mechanic_network', { hqFacilityLevels: {} })
    assert.equal(begin(noFacility, 'mechanic_network'), noFacility)
    // Management Office L1 does not pay for the set that needs L2.
    const tooLow = readyFor('rival_network', {
      hqFacilityLevels: { management_office: 1 }
    })
    assert.equal(begin(tooLow, 'rival_network'), tooLow)
  })

  it('refuses a set the Career cannot afford or already owns', () => {
    const broke = readyFor('mechanic_network', { tourTokens: 0 })
    assert.equal(begin(broke, 'mechanic_network'), broke)
    const owned = readyFor('mechanic_network', {
      unlockedSetIds: ['mechanic_network']
    })
    assert.equal(begin(owned, 'mechanic_network'), owned)
  })

  it('refuses malformed and hostile payloads', () => {
    const ready = readyFor('mechanic_network')
    for (const payload of [
      null,
      42,
      {},
      { setId: 'nope' },
      { setId: '__proto__' }
    ]) {
      assert.equal(
        gameReducer(ready, {
          type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
          payload
        }),
        ready
      )
    }
  })
})

describe('G5 — the journal survives a load', () => {
  it('clamps a forged refund to what the set actually costs', () => {
    const sanitized = sanitizeCareerState({
      pendingUnlockPurchase: {
        setId: 'mechanic_network',
        debitedTokens: 9999
      }
    })
    assert.deepEqual(sanitized.pendingUnlockPurchase, {
      setId: 'mechanic_network',
      debitedTokens: EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    })
  })

  it('drops an entry naming a set that does not exist', () => {
    for (const entry of [
      { setId: 'nope', debitedTokens: 3 },
      { setId: '__proto__', debitedTokens: 3 },
      'not-an-object',
      null
    ]) {
      assert.equal(
        sanitizeCareerState({ pendingUnlockPurchase: entry })
          .pendingUnlockPurchase,
        null
      )
    }
  })

  it('keeps only unlock ids the registry knows', () => {
    const sanitized = sanitizeCareerState({
      unlockedSetIds: [
        'mechanic_network',
        'mechanic_network',
        'nope',
        '__proto__',
        42
      ]
    })
    assert.deepEqual(sanitized.unlockedSetIds, ['mechanic_network'])
  })
})

describe('G5 — every sold capability is authoritative somewhere', () => {
  /** A fresh Career, optionally owning some sets. */
  const careerWith = (...setIds) => {
    const base = createInitialState()
    return { ...base, career: { ...base.career, unlockedSetIds: setIds } }
  }

  it('sells no capability that nothing gates', () => {
    // Dead inventory is the failure mode: a set that charges Tokens for a
    // capability no availability path consults.
    const gated = new Set([
      ...Object.keys(EXPEDITION_UNLOCK_SETS).flatMap(
        setId => EXPEDITION_UNLOCK_SETS[setId].capabilities
      )
    ])
    for (const capabilityId of gated) {
      assert.ok(
        CAPABILITY_CONSUMERS.has(capabilityId),
        `${capabilityId} is sold but has no named consumer`
      )
      assert.equal(
        typeof CAPABILITY_CONSUMERS.get(capabilityId),
        'function',
        `${capabilityId} names a consumer that does not exist`
      )
    }
  })

  it('names no consumer for a capability nothing sells', () => {
    // The other direction: an entry left behind by a removed capability makes
    // the table read as coverage it no longer provides.
    const sold = new Set(
      Object.values(EXPEDITION_UNLOCK_SETS).flatMap(set => set.capabilities)
    )
    for (const capabilityId of CAPABILITY_CONSUMERS.keys()) {
      assert.ok(
        sold.has(capabilityId),
        `${capabilityId} has a consumer but no set sells it`
      )
    }
  })

  it('reads every sold capability from production source', () => {
    // The table says *which* function is authoritative; this says the
    // capability id is actually asked for outside the registry that declares
    // it. A capability only ever mentioned by its own registry and its union
    // type is inventory nothing consults.
    const roots = [
      'src/domain/expedition',
      'src/data/expedition',
      'src/context'
    ]
    const sources = roots.flatMap(root =>
      readdirSync(join(REPO_ROOT, root), { recursive: true })
        .filter(name => /\.tsx?$/.test(String(name)))
        .map(name => join(REPO_ROOT, root, String(name)))
    )
    const corpus = sources
      .filter(file => !file.endsWith('data/expedition/unlockSets.ts'))
      .map(file => readFileSync(file, 'utf8'))
      .join('\n')
    for (const set of Object.values(EXPEDITION_UNLOCK_SETS)) {
      for (const capabilityId of set.capabilities) {
        assert.ok(
          corpus.includes(`'${capabilityId}'`),
          `${capabilityId} is never read outside its own registry`
        )
      }
    }
  })

  it('never surfaces the Underground invite to a fresh Career', () => {
    // The binding above names the Director, so this asserts the Director's own
    // behaviour: the invite is filtered out *before* the step's single draw,
    // not refused after being shown. Every seed and step, because the pool
    // gate is seeded and a single sample would prove nothing.
    const invite = 'expedition_underground_invite'
    const runIn = setIds => {
      const base = startedState({ money: 5000 })
      return {
        ...base,
        career: { ...base.career, unlockedSetIds: setIds }
      }
    }
    const surfaced = (state, routeStep) =>
      resolveExpeditionPressureDirectorStep({
        ...state,
        expedition: { ...state.expedition, routeStep }
      }).pendingDirectorEventId

    const fresh = runIn([])
    for (let routeStep = 0; routeStep < 9; routeStep += 1) {
      assert.notEqual(
        surfaced(fresh, routeStep),
        invite,
        `step ${routeStep} surfaced the invite to a Career that owns nothing`
      )
    }
    // Owned, and the Director may spend a step on it. Asserted as "some step
    // can" rather than "this step does": selection is weighted, so pinning one
    // step would test the seed instead of the gate.
    const owning = runIn(['underground_network'])
    const steps = []
    for (let routeStep = 0; routeStep < 40; routeStep += 1) {
      steps.push(surfaced(owning, routeStep))
    }
    assert.ok(
      steps.includes(invite),
      'the invite must be reachable once the set is owned'
    )
  })

  it('gates industrial_belt rather than handing it out free', () => {
    assert.ok(
      !getAvailableExpeditionRegionIds(careerWith()).includes('industrial_belt')
    )
    assert.ok(
      getAvailableExpeditionRegionIds(careerWith('mechanic_network')).includes(
        'industrial_belt'
      )
    )
    // The free Region is still free.
    assert.ok(
      getAvailableExpeditionRegionIds(careerWith()).includes('home_turf')
    )
  })

  it('gates a Crew signature trait on the set and the built facility', () => {
    const eligible = overrides => {
      const base = careerWith('crew_network')
      return getEligibleCrewSignatureTrait(
        {
          ...base,
          career: {
            ...base.career,
            crewById: {
              mika: {
                loyalty: 80,
                storyProgress: 5,
                signatureTraitId: null,
                unavailableUntilCompletedRunCount: 0
              }
            },
            hqFacilityLevels: { crew_lounge: 1 },
            ...overrides
          }
        },
        'mika'
      )
    }
    assert.ok(eligible({}))
    // An unbuilt lounge is level 0, not "no requirement".
    assert.equal(eligible({ hqFacilityLevels: {} }), null)
    assert.equal(eligible({ unlockedSetIds: [] }), null)
  })
})
