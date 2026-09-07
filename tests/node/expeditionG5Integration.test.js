/**
 * @fileoverview G5 Task 14 — integration evidence for the whole gate.
 *
 * Every other G5 suite tests one task against the state it owns. This one
 * drives a *real Career* through the production dispatch path - PREPARE, START,
 * the walked route, the Finale, both settlements, the facility and unlock
 * purchases, the Between-Tour answers, PREPARE_NEXT - and asserts each line of
 * the plan's required integration evidence against what that Career actually
 * became. A gate that only passes when a fixture injects the right slice is not
 * earnable, and the difference only shows here.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import { SONGS_BY_ID } from '../../src/data/songs'
import { quest_expedition_meta_unlock } from '../../src/data/quests/quest_expedition_meta_unlock'
import {
  deriveExpeditionCareerRank,
  isExpeditionAscensionEligible
} from '../../src/domain/expedition/meta'
import { resolveExpeditionLegendaryCandidate } from '../../src/domain/expedition/legendaries'
import { getExpeditionLegendaryMarkerId } from '../../src/data/expedition/legendaries'
import {
  getExpeditionRoutePressureProfile,
  getExpeditionStaticRoutePressureProfile
} from '../../src/domain/expedition/routeProfile'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors'
import {
  getAvailableExpeditionRegionIds,
  getAvailableExpeditionTourTypeIds,
  getAvailablePressureModifierIds
} from '../../src/domain/expedition/loadout'
import { getExpeditionFameProfile } from '../../src/domain/expedition/fame'
import {
  HQ_FACILITY_IDS,
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL
} from '../../src/data/expedition/hqFacilities'
import { EXPEDITION_UNLOCK_SETS } from '../../src/data/expedition/unlockSets'
import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog'
import { isExpeditionLegacyHqPurchaseAllowed } from '../../src/domain/expedition/legacyHqPolicy'
import { areBetweenTourDecisionsResolved } from '../../src/domain/expedition/betweenTour'
import { EXPEDITION_REGIONS } from '../../src/data/expedition/regions'
import { EXPEDITION_TOUR_TYPES } from '../../src/data/expedition/tourTypes'
import { walkToFinale } from '../expeditionLifecycleFixture.js'

const SONG_ID = [...SONGS_BY_ID.keys()][0]

/** A minimal but validator-accepted build for one Region and Tour. */
const loadoutFor = (regionId, tourTypeId) => ({
  tourTypeId,
  regionId,
  activeTourbusAssetId: null,
  crewIds: [],
  cargo: { spareParts: 0, supplies: 0 },
  starterPerkId: null,
  nativeContracts: [],
  insurancePolicyId: null,
  pressureModifierIds: [],
  build: {
    setlistSongIds: [SONG_ID],
    equipment: { selectedGearItemIds: [] },
    selectedTourbusModuleIds: [],
    merch: [],
    contraband: [],
    sponsorOfferId: null,
    startingFuelTarget: 100,
    protectedCareerCash: 0
  }
})

/**
 * One complete Tour, entirely through production dispatches.
 *
 * Deliberately answers only the free Between-Tour options: the Career's Cash is
 * not the subject here, and a paid answer would make the progression depend on
 * a balance rather than on runs completed.
 */
const runTour = (state, index, regionId, tourTypeId) => {
  const prepId = `integration_tour_${index}`
  // Fuel and condition are restocked between Tours the way a hub visit would;
  // nothing else about the Career is touched.
  let current = {
    ...state,
    player: {
      ...state.player,
      van: { ...state.player.van, fuel: 100, condition: 100 }
    }
  }
  current = gameReducer(current, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId, runSeed: 1000 + index }
  })
  assert.equal(current.expedition.status, 'prepared')
  current = gameReducer(current, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId,
      expectedRunSeed: current.runSeed,
      loadout: loadoutFor(regionId, tourTypeId)
    }
  })
  assert.equal(
    current.expedition.status,
    'active',
    `tour ${index} on ${regionId}/${tourTypeId} was refused`
  )

  current = walkToFinale(current)
  // The Finale profile is committed on the way into PRE_GIG, and the resolved
  // gig is what `COMPLETE_EXPEDITION` demands as proof the show was played.
  current = {
    ...current,
    currentGig: { id: 'finale_venue' },
    lastGigStats: { score: 9000, accuracy: 85, failed: false },
    expedition: {
      ...current.expedition,
      finaleType: 'regional_headliner',
      lastGigResolvedAtRouteStep: current.expedition.routeStep
    }
  }
  current = gameReducer(current, {
    type: ActionTypes.COMPLETE_EXPEDITION,
    payload: {
      finaleResultId: `integration_finale_${index}`,
      expectedRouteStep: current.expedition.routeStep
    }
  })
  assert.equal(current.expedition.status, 'completed')

  const runId = current.expedition.outcome.runId
  current = gameReducer(current, {
    type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
    payload: { runId }
  })
  current = gameReducer(current, {
    type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
    payload: { runId }
  })
  const candidate = resolveExpeditionLegendaryCandidate(current, runId)
  if (candidate) {
    current = gameReducer(current, {
      type: ActionTypes.COMMIT_EXPEDITION_LEGENDARY_REWARD,
      payload: { runId, expectedCapabilityId: candidate }
    })
  }
  current = gameReducer(current, {
    type: ActionTypes.UNLOCK_EXPEDITION_ASCENSION,
    payload: { runId }
  })
  current = gameReducer(current, {
    type: ActionTypes.GENERATE_EXPEDITION_BETWEEN_TOUR_DECISIONS,
    payload: { runId }
  })
  for (const decision of current.career.betweenTourByRunId[runId]?.decisions ??
    []) {
    const free =
      decision.optionIds.find(optionId =>
        [
          'accept_unavailability',
          'rest_band',
          'carry_damage',
          'cool_down',
          'walk_away',
          'cash_out'
        ].includes(optionId)
      ) ?? decision.optionIds[0]
    const answered = gameReducer(current, {
      type: ActionTypes.RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION,
      payload: { runId, decisionId: decision.id, optionId: free }
    })
    assert.notEqual(
      answered,
      current,
      `${decision.type}/${free} was refused on tour ${index}`
    )
    current = answered
  }
  current = gameReducer(current, {
    type: ActionTypes.PREPARE_NEXT_EXPEDITION,
    payload: { runId }
  })
  assert.equal(
    current.expedition.status,
    'idle',
    `tour ${index} did not return to idle`
  )
  return current
}

/** Buys one facility level and the unlock set it gates, through the reducer. */
const buySet = (state, setId) => {
  const set = EXPEDITION_UNLOCK_SETS[setId]
  let current = gameReducer(state, {
    type: ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY,
    payload: {
      facilityId: set.requiredFacility.id,
      expectedLevel: set.requiredFacility.level - 1
    }
  })
  assert.equal(
    current.career.hqFacilityLevels[set.requiredFacility.id],
    set.requiredFacility.level,
    `${set.requiredFacility.id} was not bought (${state.career.tourTokens} Tokens)`
  )
  current = gameReducer(current, {
    type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })
  assert.equal(
    current.career.pendingUnlockPurchase?.setId,
    setId,
    `${setId} purchase was refused (${current.career.tourTokens} Tokens)`
  )
  current = gameReducer(current, {
    type: ActionTypes.COMPLETE_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })
  assert.ok(current.career.unlockedSetIds.includes(setId))
  return current
}

/**
 * A Career that has actually toured: Headliner, three sets, Ascension, and one
 * Legendary, reached only through the dispatches above.
 *
 * Built once and shared: seven Tours through the full production path is the
 * expensive part, and every assertion below reads the same Career rather than
 * a differently-shaped shortcut to it.
 */
let touredCareerCache = null

/**
 * The toured Career, built on first use rather than at module scope.
 *
 * @remarks
 * Seven Tours through the production path is the expensive part, so it is built
 * once and shared - but building it while the module evaluates would surface
 * any assertion inside `runTour` or `buySet` as an import error with no owning
 * test, and every `describe` in this file would be skipped rather than one test
 * failing. Memoized behind a call so a failure reports where it happened.
 */
const touredCareer = () => {
  if (touredCareerCache) return touredCareerCache
  let state = createInitialState()
  state.player.money = 500000
  // Accepted, then completed by the two Finales the Career actually plays -
  // the quest's own `expedition.finaleCompleted` rule does the counting, so
  // the Ascension prerequisite is earned rather than seeded.
  state.activeQuests = [
    {
      ...quest_expedition_meta_unlock,
      id: 'quest_expedition_meta_unlock',
      progress: 0,
      status: 'active',
      deadline: 999
    }
  ]
  for (let index = 1; index <= 3; index += 1) {
    state = runTour(state, index, 'home_turf', 'standard_tour')
  }
  // Roadtested opens the first set, which is what opens the second Region -
  // and the second Region is what Headliner requires.
  state = buySet(state, 'mechanic_network')
  for (let index = 4; index <= 6; index += 1) {
    state = runTour(state, index, 'industrial_belt', 'standard_tour')
  }
  state = buySet(state, 'industry_network')
  state = buySet(state, 'festival_network')
  state = runTour(state, 7, 'home_turf', 'standard_tour')
  touredCareerCache = state
  return touredCareerCache
}

describe('G5 evidence — a real Career earns its rank and its meta', () => {
  it('reaches headliner from completed runs and Regions alone', () => {
    const career = touredCareer().career
    assert.equal(deriveExpeditionCareerRank(career), 'headliner')
    assert.equal(career.completedExpeditionRuns, 7)
    assert.equal(career.finalizedExpeditionRuns, 7)
    assert.deepEqual(career.completedExpeditionRegionIds, [
      'home_turf',
      'industrial_belt'
    ])
  })

  it('earns Ascension through its prerequisites, and opens Tour Pressure', () => {
    // A fresh Career is not ascended and cannot book Tour Pressure at all.
    const fresh = createInitialState()
    assert.equal(fresh.career.ascensionUnlocked, false)
    assert.deepEqual(getAvailablePressureModifierIds(fresh), [])

    assert.equal(isExpeditionAscensionEligible(touredCareer()), true)
    assert.equal(touredCareer().career.ascensionUnlocked, true)
    assert.deepEqual(
      touredCareer().completedQuestIds.includes('quest_expedition_meta_unlock'),
      true,
      'the meta-unlock quest must be completed by the Finales, not seeded'
    )
    assert.equal(touredCareer().career.unlockedSetIds.length >= 3, true)
    assert.ok(getAvailablePressureModifierIds(touredCareer()).length > 0)
  })

  it('earns and persists exactly one Legendary from a completed Finale', () => {
    // Seven completed Finales, all `regional_headliner`, and the mapped
    // Legendary is owned once: the run-scoped claim guard is what stops the
    // other six from awarding anything.
    assert.deepEqual(touredCareer().career.legendaryIds, ['safe_harbor'])
    assert.equal(touredCareer().career.legendaryClaimedRunIds.length, 1)
    // Its durable marker is the one the persistence barrier writes.
    assert.equal(
      getExpeditionLegendaryMarkerId('safe_harbor'),
      'expedition.legendary.safe_harbor'
    )
  })

  it('logs what the Tours met without granting anything for it', () => {
    const archive = touredCareer().career.archiveByCategory
    assert.deepEqual(archive.region.slice().sort(), [
      'home_turf',
      'industrial_belt'
    ])
    assert.deepEqual(archive.finale, ['regional_headliner'])
    // The log is not a capability: the Career owns exactly the sets it bought.
    assert.equal(
      touredCareer().career.unlockedSetIds.length,
      3,
      'the Archive must not have granted a set'
    )
  })
})

describe('G5 evidence — Region and Tour identity is not just numbers', () => {
  it('alters the production map, the offer count and the Rival choice', () => {
    const runIn = (regionId, tourTypeId) => ({
      ...touredCareer(),
      expedition: {
        ...touredCareer().expedition,
        status: 'active',
        loadout: loadoutFor(regionId, tourTypeId)
      }
    })

    // The map: same seed, different Region and Tour, different route.
    const seed = touredCareer().runSeed
    const home = buildExpeditionMap(seed, 'standard_tour', 'home_turf')
    const corporate = buildExpeditionMap(
      seed,
      'corporate_tour',
      'corporate_circuit'
    )
    assert.notEqual(home.mapHash, corporate.mapHash)
    assert.notEqual(home.nodeOrder.length, 0)

    // The staged Sponsor offers: a route that keeps its distance from brands
    // stages fewer than the baseline.
    const offersFor = (regionId, tourTypeId) =>
      buildPreparedExpeditionSponsorOffers(
        runIn(regionId, tourTypeId),
        regionId,
        tourTypeId
      ).length
    assert.ok(
      offersFor('underground_scene', 'underground_tour') <
        offersFor('home_turf', 'standard_tour')
    )

    // The Rival: a Tour that hunts one forces the encounter, whatever Region.
    assert.equal(
      getExpeditionRoutePressureProfile(runIn('home_turf', 'rival_hunt_tour'))
        .forcedRival,
      true
    )
    assert.equal(
      getExpeditionRoutePressureProfile(runIn('home_turf', 'standard_tour'))
        .forcedRival,
      false
    )

    // And every registered Region and Tour differs from the baseline on at
    // least one axis - a registry entry that changed nothing would be a label.
    const base = getExpeditionStaticRoutePressureProfile(
      'home_turf',
      'standard_tour'
    )
    for (const regionId of Object.keys(EXPEDITION_REGIONS)) {
      if (regionId === 'home_turf') continue
      const profile = getExpeditionStaticRoutePressureProfile(
        regionId,
        'standard_tour'
      )
      const numeric = getEffectiveExpeditionRules(
        runIn(regionId, 'standard_tour')
      ).numeric
      const baseNumeric = getEffectiveExpeditionRules(
        runIn('home_turf', 'standard_tour')
      ).numeric
      assert.ok(
        Object.keys(profile).some(key => profile[key] !== base[key]) ||
          Object.keys(numeric).some(key => numeric[key] !== baseNumeric[key]),
        `${regionId} is identical to the baseline on both axes`
      )
    }
    for (const tourTypeId of Object.keys(EXPEDITION_TOUR_TYPES)) {
      if (tourTypeId === 'standard_tour') continue
      const profile = getExpeditionStaticRoutePressureProfile(
        'home_turf',
        tourTypeId
      )
      const map = buildExpeditionMap(seed, tourTypeId, 'home_turf')
      assert.ok(
        Object.keys(profile).some(key => profile[key] !== base[key]) ||
          map.mapHash !== home.mapHash,
        `${tourTypeId} is identical to the baseline`
      )
    }
  })
})

describe('G5 evidence — Fame is access and pressure, never permanent power', () => {
  it('moves expectation, Sponsor quality and high-profile access only', () => {
    const atFame = fame => ({
      ...touredCareer(),
      player: { ...touredCareer().player, fame },
      expedition: {
        ...touredCareer().expedition,
        status: 'active',
        loadout: loadoutFor('home_turf', 'standard_tour')
      }
    })
    const unknown = atFame(0)
    const famous = atFame(12000)

    // Access and pressure move.
    assert.ok(
      getExpeditionFameProfile(famous).sponsorQualityBias >
        getExpeditionFameProfile(unknown).sponsorQualityBias
    )
    assert.ok(
      getExpeditionRoutePressureProfile(famous)
        .festivalHighProfileNodeWeightMultiplier >
        getExpeditionRoutePressureProfile(unknown)
          .festivalHighProfileNodeWeightMultiplier
    )

    // Permanent power does not. Fame buys no Region, no Tour, no set, no rank,
    // and no numeric rule.
    assert.deepEqual(
      getAvailableExpeditionRegionIds(famous),
      getAvailableExpeditionRegionIds(unknown)
    )
    assert.deepEqual(
      getAvailableExpeditionTourTypeIds(famous),
      getAvailableExpeditionTourTypeIds(unknown)
    )
    assert.deepEqual(
      getEffectiveExpeditionRules(famous).numeric,
      getEffectiveExpeditionRules(unknown).numeric
    )
    assert.equal(
      deriveExpeditionCareerRank(famous.career),
      deriveExpeditionCareerRank(unknown.career)
    )
    // And the committed route is untouched: Fame is not a route editor.
    assert.equal(
      buildExpeditionMap(famous.runSeed, 'standard_tour', 'home_turf').mapHash,
      buildExpeditionMap(unknown.runSeed, 'standard_tour', 'home_turf').mapHash
    )
  })
})

describe('G5 evidence — every facility level is worth buying', () => {
  it('gives each implemented level at least one real consumer', () => {
    // The facilities are gates on the unlock sets, so a level nothing requires
    // is a Token sink with no content behind it.
    const required = new Map()
    for (const set of Object.values(EXPEDITION_UNLOCK_SETS)) {
      const key = set.requiredFacility.id
      required.set(
        key,
        Math.max(required.get(key) ?? 0, set.requiredFacility.level)
      )
    }
    for (const facilityId of HQ_FACILITY_IDS) {
      const ceiling = HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[facilityId]
      const gated = required.get(facilityId) ?? 0
      assert.ok(gated >= 1, `${facilityId} gates no unlock set at any level`)
      assert.ok(
        gated >= ceiling,
        `${facilityId} implements level ${ceiling} but nothing requires above ${gated}`
      )
    }
  })
})

describe('G5 evidence — legacy Van and HQ items cannot bypass the meta gate', () => {
  it('blocks every catalog entry for a Career that has toured nothing', () => {
    const fresh = createInitialState()
    for (const item of getUnifiedUpgradeCatalog()) {
      assert.equal(
        isExpeditionLegacyHqPurchaseAllowed(
          fresh.career,
          'idle',
          String(item.id)
        ),
        false,
        `${item.id} is purchasable by a fresh Career`
      )
    }
    // The Career that actually toured may buy the ranked ones, which is what
    // makes the gate a gate rather than a wall.
    const openToTouring = getUnifiedUpgradeCatalog().filter(item =>
      isExpeditionLegacyHqPurchaseAllowed(
        touredCareer().career,
        'idle',
        String(item.id)
      )
    )
    assert.ok(openToTouring.length > 0)
  })
})

describe('G5 evidence — the next Tour waits for what the last one owes', () => {
  it('blocks PREPARE_NEXT until the decisions and the barrier are done', () => {
    // Reconstructed rather than reused: `runTour` answers everything, and the
    // subject here is the state in between.
    const prepId = 'integration_gate'
    let state = {
      ...touredCareer(),
      player: {
        ...touredCareer().player,
        van: { ...touredCareer().player.van, fuel: 100, condition: 40 }
      }
    }
    state = gameReducer(state, {
      type: ActionTypes.PREPARE_EXPEDITION_RUN,
      payload: { prepId, runSeed: 2222 }
    })
    state = gameReducer(state, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId,
        expectedRunSeed: state.runSeed,
        loadout: loadoutFor('home_turf', 'standard_tour')
      }
    })
    state = walkToFinale(state)
    state = {
      ...state,
      currentGig: { id: 'finale_venue' },
      lastGigStats: { score: 9000, accuracy: 85, failed: false },
      expedition: {
        ...state.expedition,
        finaleType: 'regional_headliner',
        lastGigResolvedAtRouteStep: state.expedition.routeStep
      }
    }
    state = gameReducer(state, {
      type: ActionTypes.COMPLETE_EXPEDITION,
      payload: {
        finaleResultId: 'integration_finale_gate',
        expectedRouteStep: state.expedition.routeStep
      }
    })
    const runId = state.expedition.outcome.runId
    state = gameReducer(state, {
      type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
      payload: { runId }
    })
    state = gameReducer(state, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId }
    })
    state = gameReducer(state, {
      type: ActionTypes.GENERATE_EXPEDITION_BETWEEN_TOUR_DECISIONS,
      payload: { runId }
    })
    const stored = state.career.betweenTourByRunId[runId]
    assert.ok(
      stored.decisions.length > 0,
      'a damaged van must produce at least the repair decision'
    )
    assert.equal(areBetweenTourDecisionsResolved(state, runId), false)
    assert.equal(
      gameReducer(state, {
        type: ActionTypes.PREPARE_NEXT_EXPEDITION,
        payload: { runId }
      }),
      state,
      'the next Tour must not open while a decision is open'
    )

    let answered = state
    for (const decision of stored.decisions) {
      const free =
        decision.optionIds.find(optionId =>
          [
            'accept_unavailability',
            'rest_band',
            'carry_damage',
            'cool_down',
            'walk_away',
            'cash_out'
          ].includes(optionId)
        ) ?? decision.optionIds[0]
      answered = gameReducer(answered, {
        type: ActionTypes.RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION,
        payload: { runId, decisionId: decision.id, optionId: free }
      })
    }
    assert.equal(areBetweenTourDecisionsResolved(answered, runId), true)
    assert.equal(
      gameReducer(answered, {
        type: ActionTypes.PREPARE_NEXT_EXPEDITION,
        payload: { runId }
      }).expedition.status,
      'idle'
    )
  })
})

describe('G5 evidence — Crew consequences target deterministically', () => {
  /** A settled Tour with two Crew on the road, ready for generation. */
  const settledWithCrew = careerOverrides => {
    const prepId = 'integration_crew'
    let state = {
      ...touredCareer(),
      player: {
        ...touredCareer().player,
        van: { ...touredCareer().player.van, fuel: 100, condition: 100 }
      },
      career: { ...touredCareer().career, ...careerOverrides }
    }
    state = gameReducer(state, {
      type: ActionTypes.PREPARE_EXPEDITION_RUN,
      payload: { prepId, runSeed: 3333 }
    })
    state = gameReducer(state, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId,
        expectedRunSeed: state.runSeed,
        loadout: {
          ...loadoutFor('home_turf', 'standard_tour'),
          crewIds: ['mika', 'tom']
        }
      }
    })
    assert.equal(
      state.expedition.status,
      'active',
      'the two ungated Crew must be bookable'
    )
    state = walkToFinale(state)
    state = {
      ...state,
      currentGig: { id: 'finale_venue' },
      lastGigStats: { score: 9000, accuracy: 85, failed: false },
      expedition: {
        ...state.expedition,
        finaleType: 'regional_headliner',
        lastGigResolvedAtRouteStep: state.expedition.routeStep
      }
    }
    state = gameReducer(state, {
      type: ActionTypes.COMPLETE_EXPEDITION,
      payload: {
        finaleResultId: 'integration_finale_crew',
        expectedRouteStep: state.expedition.routeStep
      }
    })
    const runId = state.expedition.outcome.runId
    state = gameReducer(state, {
      type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
      payload: { runId }
    })
    state = gameReducer(state, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId }
    })
    return { state, runId }
  }

  const generatedDecisions = (state, runId) => {
    const next = gameReducer(state, {
      type: ActionTypes.GENERATE_EXPEDITION_BETWEEN_TOUR_DECISIONS,
      payload: { runId }
    })
    return { next, decisions: next.career.betweenTourByRunId[runId].decisions }
  }

  it('picks between multiple Crew debts by run order, then id', () => {
    const debt = (crewId, createdFromRunId) => ({
      crewId,
      createdFromRunId,
      severity: 'serious',
      toursRemaining: 1
    })
    const { state, runId } = settledWithCrew({})
    // Both Crew were on the road, so neither debt is served by this Tour.
    const withDebts = {
      ...state,
      career: {
        ...state.career,
        settledCrewRunIds: ['run_older', ...state.career.settledCrewRunIds],
        crewRecoveryDebtById: Object.assign(Object.create(null), {
          tom: debt('tom', runId),
          mika: debt('mika', 'run_older')
        })
      }
    }
    const { decisions } = generatedDecisions(withDebts, runId)
    const rehab = decisions.find(entry => entry.type === 'injury_rehab')
    assert.ok(rehab)
    // The older debt, whichever way the ids sort.
    assert.deepEqual(rehab.target, { kind: 'crew', id: 'mika' })
  })

  it('picks between multiple signature candidates by loyalty, then id', () => {
    // Both Crew eligible: the set is owned, the facility is built, and both
    // have the loyalty and story progress the trait requires.
    const { state, runId } = settledWithCrew({
      unlockedSetIds: [...touredCareer().career.unlockedSetIds, 'crew_network'],
      hqFacilityLevels: Object.assign(
        Object.create(null),
        touredCareer().career.hqFacilityLevels,
        { crew_lounge: 1 }
      )
    })
    const eligible = {
      ...state,
      career: {
        ...state.career,
        crewById: Object.assign(Object.create(null), state.career.crewById, {
          mika: {
            loyalty: 80,
            storyProgress: 5,
            signatureTraitId: null,
            unavailableUntilCompletedRunCount: 0
          },
          tom: {
            loyalty: 65,
            storyProgress: 5,
            signatureTraitId: null,
            unavailableUntilCompletedRunCount: 0
          }
        })
      }
    }
    const { next, decisions } = generatedDecisions(eligible, runId)
    const debrief = decisions.find(entry => entry.type === 'crew_debrief')
    assert.ok(debrief)
    // The least loyal of the eligible Crew, and the signature option is
    // offered because this exact target can take it.
    assert.deepEqual(debrief.target, { kind: 'crew', id: 'tom' })
    assert.ok(debrief.optionIds.includes('develop_signature'))
    const developed = gameReducer(next, {
      type: ActionTypes.RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION,
      payload: { runId, decisionId: debrief.id, optionId: 'develop_signature' }
    })
    assert.ok(developed.career.crewById.tom.signatureTraitId)
    // The other candidate is untouched: one decision, one actor.
    assert.equal(developed.career.crewById.mika.signatureTraitId, null)
  })

  it('clears a serious recovery debt after one skipped Tour', () => {
    const { state, runId } = settledWithCrew({})
    // `ines` was not on the road, so this Tour is the one her debt owed.
    const withDebts = {
      ...state,
      career: {
        ...state.career,
        crewRecoveryDebtById: Object.assign(Object.create(null), {
          ines: {
            crewId: 'ines',
            createdFromRunId: 'run_older',
            severity: 'serious',
            toursRemaining: 1
          },
          mika: {
            crewId: 'mika',
            createdFromRunId: 'run_older',
            severity: 'serious',
            toursRemaining: 1
          }
        })
      }
    }
    const { next } = generatedDecisions(withDebts, runId)
    assert.equal(
      Object.hasOwn(next.career.crewRecoveryDebtById, 'ines'),
      false,
      'a Crew that skipped the Tour has served its debt'
    )
    assert.equal(
      Object.hasOwn(next.career.crewRecoveryDebtById, 'mika'),
      true,
      'a Crew that toured still owes a Tour'
    )
  })
})
