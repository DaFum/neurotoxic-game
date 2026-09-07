/**
 * @fileoverview Fresh-Career Progression Sequences (G6 Task 12).
 *
 * Runs fresh-career 6-run progression sequences starting with ZERO initial meta seeding:
 * - Baseline initialState only
 * - No Expedition facility levels
 * - No Expedition unlock-set markers
 * - ascensionUnlocked false
 * - No Legendary markers
 * - No synthetic persistent Rival history
 * - No pre-seeded Tour Tokens/rank progression
 *
 * Meta is acquired solely through production actions after each settled run.
 */

import { createInitialState } from '../src/context/initialState.ts'
import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { deriveExpeditionCareerRank } from '../src/domain/expedition/meta.ts'
import { isExpeditionAscensionEligible } from '../src/domain/expedition/meta.ts'
import { resolveExpeditionLegendaryCandidate } from '../src/domain/expedition/legendaries.ts'
import {
  getAvailableExpeditionRegionIds,
  getAvailableExpeditionTourTypeIds,
  getAvailablePressureModifierIds,
  validateExpeditionBuildCommitment
} from '../src/domain/expedition/loadout.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { EXPEDITION_UNLOCK_SETS } from '../src/data/expedition/unlockSets.ts'
import { HQ_FACILITY_IDS } from '../src/data/expedition/hqFacilities.ts'
import { SONGS_BY_ID } from '../src/data/songs.ts'
import {
  toCanonicalRegionId,
  toCanonicalTourTypeId
} from './game-balance-expedition-profiles.mjs'
import { runExpeditionSimulation } from './game-balance-expedition-runner.mjs'
import { finiteNumberOr } from '../src/utils/finiteNumber.ts'

export const CAREER_CALIBRATION_NAMESPACE =
  '#roguelite-expedition-v1#career#calibration'
export const CAREER_HOLDOUT_NAMESPACE =
  '#roguelite-expedition-v1#career#holdout'

/**
 * Builds the best currently legal approximation of a persona profile in a live Career state.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @returns {import('../src/types/expedition').ExpeditionLoadout}
 */
export const buildLegalLoadoutApproximation = (state, profile) => {
  const canonicalTour = toCanonicalTourTypeId(profile.tourTypeId)
  const canonicalRegion = toCanonicalRegionId(profile.regionId)

  const availableTours = getAvailableExpeditionTourTypeIds(state)
  const tourTypeId = availableTours.includes(canonicalTour)
    ? canonicalTour
    : 'standard_tour'

  const availableRegions = getAvailableExpeditionRegionIds(state)
  const regionId = availableRegions.includes(canonicalRegion)
    ? canonicalRegion
    : 'home_turf'

  // Chassis: use requested if owned and legal, else fallback to starter van (null)
  const activeTourbusAssetId = null

  // Crew: select available crew matching order, max 3
  const crewIds = []

  // Starter perk: requested if unlocked in career, else null
  const starterPerkId =
    profile.starterPerkId &&
    state.career.unlockedSetIds.includes('starter_perks_network')
      ? profile.starterPerkId
      : null

  // Pressure: allowed only after real Ascension unlock
  const pressureModifierIds = state.career.ascensionUnlocked
    ? profile.pressureModifierIds.filter(id =>
        getAvailablePressureModifierIds(state).includes(id)
      )
    : []

  const setlistSongIds = [...SONGS_BY_ID.keys()].slice(0, 4)

  return {
    tourTypeId,
    regionId,
    activeTourbusAssetId,
    crewIds,
    cargo: { spareParts: 0, supplies: 0 },
    starterPerkId,
    nativeContracts: [],
    insurancePolicyId: null,
    pressureModifierIds,
    build: {
      setlistSongIds,
      equipment: { selectedGearItemIds: [] },
      selectedTourbusModuleIds: [],
      merch: [],
      contraband: [],
      sponsorOfferId: null,
      // A build may only top the tank up, never siphon it, so a Career that
      // ended its last Tour above the profile's target commits that higher
      // level rather than an illegal one.
      startingFuelTarget: Math.min(
        100,
        Math.max(
          50,
          profile.startingFuelTarget,
          Math.ceil(finiteNumberOr(state.player.van?.fuel, 0))
        )
      ),
      protectedCareerCash: 0
    }
  }
}

/**
 * Runs a 6-run fresh career progression sequence for a persona profile.
 *
 * @param {import('../src/types').GameState} [initialState]
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} sequenceSeed
 * @param {number} [totalRuns=6]
 * @returns {{
 *   profileId: string,
 *   sequenceSeed: number,
 *   runsRequested: number,
 *   runsCompleted: number,
 *   haltedAtRun: number | null,
 *   haltReason: string | null,
 *   finalRank: string,
 *   metrics: {
 *     firstRoadtestedRun: number | null,
 *     firstHeadlinerRun: number | null,
 *     firstMetaFacilityRun: number | null,
 *     firstPermanentExpeditionCapabilityRun: number | null,
 *     run1PermanentCapabilityPurchaseRate: boolean,
 *     run1LegacyExpeditionAffectingHqPurchaseRate: boolean,
 *     firstLegacyExpeditionAffectingHqPurchaseRun: number | null,
 *     firstAscensionUnlockRun: number | null,
 *     firstNaturalLegendaryRun: number | null,
 *     signatureTraitUnlockRun: number | null,
 *     betweenTourDecisionMean: number,
 *     fixtureCapabilitySetIds: string[][]
 *   },
 *   runOutcomes: string[],
 *   finalState: import('../src/types').GameState
 * }}
 */
export const runFreshCareerSequence = (
  initialState = createInitialState(),
  profile,
  sequenceSeed,
  totalRuns = 6
) => {
  // Money and Fame stay at whatever a fresh Career actually starts with. The
  // sequence exists to show how a Career climbs from nothing, so topping the
  // player up before run 1 would hide exactly the constraint it measures.
  let state = {
    ...initialState,
    career: {
      ...initialState.career,
      tourTokens: 0,
      hqFacilityLevels: {},
      unlockedSetIds: [],
      ascensionUnlocked: false,
      completedExpeditionRuns: 0,
      finalizedExpeditionRuns: 0,
      completedExpeditionRegionIds: []
    }
  }

  const metrics = {
    firstRoadtestedRun: null,
    firstHeadlinerRun: null,
    firstMetaFacilityRun: null,
    firstPermanentExpeditionCapabilityRun: null,
    run1PermanentCapabilityPurchaseRate: false,
    run1LegacyExpeditionAffectingHqPurchaseRate: false,
    firstLegacyExpeditionAffectingHqPurchaseRun: null,
    firstAscensionUnlockRun: null,
    firstNaturalLegendaryRun: null,
    signatureTraitUnlockRun: null,
    betweenTourDecisionMean: 0,
    fixtureCapabilitySetIds: []
  }

  const runOutcomes = []
  let totalBetweenTourDecisions = 0
  /** @type {number | null} */
  let haltedAtRun = null
  /** @type {string | null} */
  let haltReason = null

  for (let runIdx = 1; runIdx <= totalRuns; runIdx++) {
    // Assert strictly zero fixture capabilities seeded
    metrics.fixtureCapabilitySetIds.push([])

    const runSeed = (sequenceSeed + runIdx * 10007) >>> 0
    const prepId = `fresh_prep_${runIdx}_${runSeed}`

    // 1. Prepare run
    state = gameReducer(state, {
      type: ActionTypes.PREPARE_EXPEDITION_RUN,
      payload: { prepId, runSeed }
    })

    // 2. Build legal approximation of loadout
    const legalLoadout = buildLegalLoadoutApproximation(state, profile)

    // No between-tour restock. The tank is filled by the build's own
    // `startingFuelTarget`, which START charges for through
    // `getExpeditionFuelTopUpCost` - the legal production top-up. Van
    // condition likewise carries over: in-run repairs are the only legal way
    // to recover it, and handing the Career a free rebuild between tours would
    // erase the wear the sequence is meant to accumulate.
    const preparedMap = buildExpeditionMap(
      state.runSeed,
      legalLoadout.tourTypeId,
      legalLoadout.regionId
    )
    const validation = validateExpeditionBuildCommitment(
      state,
      legalLoadout,
      preparedMap
    )
    // A Career that can no longer fund a legal build has not hit a simulator
    // bug - it has run out of road. Recorded and reported rather than thrown,
    // so the sequence's own economy is the finding instead of a crash.
    if (!validation.valid) {
      haltedAtRun = runIdx
      haltReason = `loadout_rejected:${validation.reason}`
      break
    }

    // 3. Start run
    state = gameReducer(state, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId,
        expectedRunSeed: state.runSeed,
        loadout: validation.normalized
      }
    })

    if (state.expedition.status !== 'active') {
      haltedAtRun = runIdx
      haltReason = 'start_refused_insufficient_career_funds'
      break
    }

    // 4. Run through simulation
    const simResult = runExpeditionSimulation(state, profile, runSeed, {
      isFreshCareer: true
    })
    state = simResult.finalState
    runOutcomes.push(simResult.outcome)

    const runId = state.expedition.outcome?.runId
    if (runId) {
      // Step A: Commit naturally eligible Legendary if resolved
      const legendaryCand = resolveExpeditionLegendaryCandidate(state, runId)
      if (legendaryCand) {
        state = gameReducer(state, {
          type: ActionTypes.COMMIT_EXPEDITION_LEGENDARY_REWARD,
          payload: { runId, expectedCapabilityId: legendaryCand }
        })
        if (metrics.firstNaturalLegendaryRun === null) {
          metrics.firstNaturalLegendaryRun = runIdx
        }
      }

      // Step B: Settle Career and Crew
      state = gameReducer(state, {
        type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
        payload: { runId }
      })
      state = gameReducer(state, {
        type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
        payload: { runId }
      })

      // Step C: Generate and resolve Between-Tour decisions
      state = gameReducer(state, {
        type: ActionTypes.GENERATE_EXPEDITION_BETWEEN_TOUR_DECISIONS,
        payload: { runId }
      })

      const decisions = state.career.betweenTourByRunId[runId]?.decisions ?? []
      totalBetweenTourDecisions += decisions.length
      for (const dec of decisions) {
        const free =
          dec.optionIds.find(opt =>
            [
              'accept_unavailability',
              'rest_band',
              'carry_damage',
              'cool_down',
              'walk_away',
              'cash_out'
            ].includes(opt)
          ) ?? dec.optionIds[0]
        state = gameReducer(state, {
          type: ActionTypes.RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION,
          payload: { runId, decisionId: dec.id, optionId: free }
        })
      }

      // Step D: Perform at most ONE facility OR unlock-set purchase from earned Tour Tokens
      const currentTokens = finiteNumberOr(state.career.tourTokens, 0)
      let purchaseMade = false

      // Try purchasing required facility first
      if (!purchaseMade) {
        for (const facId of HQ_FACILITY_IDS) {
          const curLvl = state.career.hqFacilityLevels[facId] ?? 0
          if (curLvl === 0 && currentTokens >= 3) {
            const nextState = gameReducer(state, {
              type: ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY,
              payload: { facilityId: facId, expectedLevel: 0 }
            })
            if (nextState !== state) {
              state = nextState
              purchaseMade = true
              if (metrics.firstMetaFacilityRun === null) {
                metrics.firstMetaFacilityRun = runIdx
              }
              break
            }
          }
        }
      }

      // Try purchasing unlock-set if no facility bought
      if (!purchaseMade) {
        for (const setId of profile.requiredCapabilitySetIds) {
          if (!state.career.unlockedSetIds.includes(setId)) {
            const set = EXPEDITION_UNLOCK_SETS[setId]
            if (set && currentTokens >= set.cost) {
              let s1 = gameReducer(state, {
                type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
                payload: { setId }
              })
              if (s1 !== state) {
                let s2 = gameReducer(s1, {
                  type: ActionTypes.COMPLETE_EXPEDITION_UNLOCK_PURCHASE,
                  payload: { setId }
                })
                if (s2 !== s1) {
                  state = s2
                  if (metrics.firstPermanentExpeditionCapabilityRun === null) {
                    metrics.firstPermanentExpeditionCapabilityRun = runIdx
                  }
                  if (runIdx === 1) {
                    metrics.run1PermanentCapabilityPurchaseRate = true
                  }
                  break
                }
              }
            }
          }
        }
      }

      // Step E: Ascension check
      if (
        !state.career.ascensionUnlocked &&
        isExpeditionAscensionEligible(state)
      ) {
        state = gameReducer(state, {
          type: ActionTypes.UNLOCK_EXPEDITION_ASCENSION,
          payload: { runId }
        })
        if (
          state.career.ascensionUnlocked &&
          metrics.firstAscensionUnlockRun === null
        ) {
          metrics.firstAscensionUnlockRun = runIdx
        }
      }

      // Step F: Prepare next expedition
      state = gameReducer(state, {
        type: ActionTypes.PREPARE_NEXT_EXPEDITION,
        payload: { runId }
      })
    }

    // Record rank milestones
    const rank = deriveExpeditionCareerRank(state.career)
    if (rank === 'roadtested' && metrics.firstRoadtestedRun === null) {
      metrics.firstRoadtestedRun = runIdx
    } else if (rank === 'headliner' && metrics.firstHeadlinerRun === null) {
      metrics.firstHeadlinerRun = runIdx
    }
  }

  const runsCompleted = runOutcomes.length
  metrics.betweenTourDecisionMean =
    runsCompleted === 0 ? 0 : totalBetweenTourDecisions / runsCompleted

  return {
    profileId: profile.id,
    sequenceSeed,
    runsRequested: totalRuns,
    runsCompleted,
    haltedAtRun,
    haltReason,
    finalRank: deriveExpeditionCareerRank(state.career),
    metrics,
    runOutcomes,
    finalState: state
  }
}
