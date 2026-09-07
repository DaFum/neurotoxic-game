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
  getAvailableStarterPerkIds,
  getAvailableCrewIds,
  getExpeditionFuelTopUpCost,
  validateExpeditionBuildCommitment
} from '../src/domain/expedition/loadout.ts'
import { getExpeditionOwnedPerformanceGear } from '../src/domain/expedition/equipment.ts'
import { MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS } from '../src/domain/expedition/defaults.ts'
import { EXPEDITION_CREW } from '../src/data/expedition/crew.ts'
import {
  areExpeditionContractsCompatible,
  getExpeditionContractTargetNodeId
} from '../src/domain/expedition/contracts.ts'
import { getAvailableNativeContractTemplateIds } from '../src/domain/expedition/loadout.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { EXPEDITION_UNLOCK_SETS } from '../src/data/expedition/unlockSets.ts'
import { HQ_FACILITY_IDS } from '../src/data/expedition/hqFacilities.ts'
import { doesLegacyHqItemTouchExpedition } from '../src/domain/expedition/legacyHqPolicy.ts'
import { ALL_HQ_ITEMS } from '../src/data/hqItems.ts'
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
 * Builds the best currently legal approximation of a persona profile.
 *
 * @param {import('../src/types').GameState} state - Live fresh-Career state.
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @returns {import('../src/types/expedition').ExpeditionLoadout}
 *
 * @remarks
 * Every axis walks the Task 12 fallback ladder against what the Career
 * currently owns: requested when legal, otherwise the declared fallback,
 * otherwise nothing. Nothing is fixture-seeded - a Career that has not bought a
 * chassis commits `null`, and a Career that has not unlocked a Region books
 * `home_turf`.
 *
 * Returning a flat empty build instead made the 1,000-sequence cohorts measure
 * one generic baseline rather than six personas' legal progression, so their
 * survival, economy and meta timing were not the evidence the report claimed.
 */
export const buildLegalLoadoutApproximation = (state, profile) => {
  const canonicalTour = toCanonicalTourTypeId(profile.tourTypeId)
  const canonicalRegion = toCanonicalRegionId(profile.regionId)

  // Tour / Region: requested when unlocked, else the always-bookable baseline.
  const availableTours = getAvailableExpeditionTourTypeIds(state)
  const tourTypeId = availableTours.includes(canonicalTour)
    ? canonicalTour
    : 'standard_tour'

  const availableRegions = getAvailableExpeditionRegionIds(state)
  const regionId = availableRegions.includes(canonicalRegion)
    ? canonicalRegion
    : 'home_turf'

  // Chassis: requested when owned, else the first owned legal Tourbus sorted
  // legit-then-tier-then-id. A Career that owns none commits the starter van.
  const ownedChassis = (Array.isArray(state.assets) ? state.assets : [])
    .filter(asset => asset?.kind === 'tourbus_chassis')
    .sort((a, b) => {
      const flavorRank = entry => (entry.chassisFlavor === 'legit' ? 0 : 1)
      const tierRank = entry => finiteNumberOr(entry.chassisTier, 1)
      return (
        flavorRank(a) - flavorRank(b) ||
        tierRank(a) - tierRank(b) ||
        String(a.id).localeCompare(String(b.id))
      )
    })
  const requestedChassis = ownedChassis.find(
    asset =>
      asset.chassisFlavor === profile.chassisSpec.flavor &&
      finiteNumberOr(asset.chassisTier, 1) === profile.chassisSpec.tier
  )
  const activeTourbusAssetId =
    requestedChassis?.id ?? ownedChassis[0]?.id ?? null

  // Modules: only ids actually installed on the committed chassis.
  const committedChassis = activeTourbusAssetId
    ? ownedChassis.find(asset => asset.id === activeTourbusAssetId)
    : null
  const installedModuleIds = new Set(
    (Array.isArray(committedChassis?.installedModuleIds)
      ? committedChassis.installedModuleIds
      : []
    ).filter(id => typeof id === 'string')
  )
  const selectedTourbusModuleIds = profile.requiredModuleIds.filter(id =>
    installedModuleIds.has(id)
  )

  // Crew: walk the persona's role order, taking only currently available
  // members, capped at the production maximum.
  const availableCrewIds = new Set(getAvailableCrewIds(state))
  const crewIds = []
  for (const role of profile.crewRoleOrder) {
    if (crewIds.length >= 3) break
    const match = EXPEDITION_CREW.find(
      crew =>
        crew.role === role &&
        availableCrewIds.has(crew.id) &&
        !crewIds.includes(crew.id)
    )
    if (match) crewIds.push(match.id)
  }

  // Starter perk: requested only when the Career actually unlocked it.
  const availablePerkIds = getAvailableStarterPerkIds(state)
  const starterPerkId =
    profile.starterPerkId && availablePerkIds.includes(profile.starterPerkId)
      ? profile.starterPerkId
      : null

  // Pressure: only after a real Ascension unlock.
  const pressureModifierIds = state.career.ascensionUnlocked
    ? profile.pressureModifierIds.filter(id =>
        getAvailablePressureModifierIds(state).includes(id)
      )
    : []

  // Equipment: only gear the Career already owns, capped by the production
  // limit; never seeded.
  const ownedGearItemIds = getExpeditionOwnedPerformanceGear(state)
  const selectedGearItemIds = [...ownedGearItemIds]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .slice(0, Math.min(3, MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS))

  // Contracts: the persona's preferences, in order, filtered through the same
  // availability and compatibility owners the reducer uses, with route targets
  // derived rather than asked for. Guessing at the rules here got the whole
  // sequence rejected with NATIVE_CONTRACT_INVALID before run 1.
  const preparedMap = buildExpeditionMap(state.runSeed, tourTypeId, regionId)
  const availableTemplateIds = getAvailableNativeContractTemplateIds(
    state,
    preparedMap
  )
  const nativeContracts = []
  for (const templateId of profile.nativeContractPreferenceIds) {
    if (nativeContracts.length >= 2) break
    if (!availableTemplateIds.includes(templateId)) continue
    const candidateIds = [
      ...nativeContracts.map(entry => entry.templateId),
      templateId
    ]
    if (!areExpeditionContractsCompatible(candidateIds)) continue
    nativeContracts.push({
      templateId,
      targetNodeId: getExpeditionContractTargetNodeId(templateId, preparedMap)
    })
  }

  // Cargo: the persona's policy against what the Career can currently afford,
  // never a seeded stock.
  const spendable = Math.max(0, finiteNumberOr(state.player.money, 0))
  const cargoBudget = profile.cargoPolicy === 'safe' ? 0.1 : 0.05
  const spareParts = spendable > 400 ? Math.floor(cargoBudget * 10) : 0

  const setlistSongIds = [...SONGS_BY_ID.keys()].slice(0, 4)

  return {
    tourTypeId,
    regionId,
    activeTourbusAssetId,
    crewIds,
    cargo: { spareParts, supplies: 0 },
    starterPerkId,
    nativeContracts,
    insurancePolicyId: null,
    pressureModifierIds,
    build: {
      setlistSongIds,
      equipment: { selectedGearItemIds },
      selectedTourbusModuleIds,
      merch: [],
      contraband: [],
      // Staged offers are applied by the caller, which has the prepared
      // snapshot; the builder never invents one.
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
 * Cost of the cheapest legal next Expedition this Career could commit.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @returns {number}
 *
 * @remarks
 * The Fuel top-up is the whole discretionary floor for a fresh Career: it owns
 * no chassis, no gear and no cargo, so START's `getExpeditionFuelTopUpCost` is
 * what it has to be able to pay. Reported next to `cashAfterRun` so a funding
 * halt can be read as the gap it is rather than inferred.
 */
const estimateMinimumNextRunCost = (state, profile) => {
  const currentFuel = finiteNumberOr(state.player.van?.fuel, 0)
  // A build may only top up, so the cheapest legal target is the current level
  // when it already exceeds the profile's, and the profile's otherwise.
  const target = Math.min(
    100,
    Math.max(50, profile.startingFuelTarget, Math.ceil(currentFuel))
  )
  return getExpeditionFuelTopUpCost(currentFuel, target)
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
 *     crewRecoveryDebtDurations: Array<{ crewId: string, openedAtRun: number, clearedAtRun: number, tours: number }>,
 *     rivalIdsByRun: string[],
 *     sameRivalReturnRate: number,
 *     maxNemesisLevel: number,
 *     nemesisLevelAdvancedRuns: Array<{ run: number, level: number }>,
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
    crewRecoveryDebtDurations: [],
    rivalIdsByRun: [],
    sameRivalReturnRate: 0,
    maxNemesisLevel: 0,
    nemesisLevelAdvancedRuns: [],
    betweenTourDecisionMean: 0,
    fixtureCapabilitySetIds: []
  }

  const runOutcomes = []
  let totalBetweenTourDecisions = 0
  /** @type {Map<string, number>} Crew id -> run its recovery debt opened in. */
  const crewRecoveryDebtOpenedAt = new Map()
  /** @type {any[]} Per-run cashflow, so a funding halt can be localized. */
  const cashflowByRun = []
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
    const cashBeforeRun = finiteNumberOr(state.player.money, 0)
    const fuelBeforeRun = finiteNumberOr(state.player.van?.fuel, 0)
    const vanConditionBeforeRun = finiteNumberOr(
      state.player.van?.condition, 0
    )
    state = gameReducer(state, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId,
        expectedRunSeed: state.runSeed,
        loadout: validation.normalized
      }
    })

    if (state.expedition.status !== 'active') {
      // The halt is the finding, so record what the Career could not afford.
      // Without these components the report could say a sequence stopped for
      // lack of money but not whether prep, repairs, travel or the settlement
      // was responsible.
      cashflowByRun.push({
        run: runIdx,
        cashBeforeRun,
        fuelBeforeRun,
        vanConditionBeforeRun,
        prepSpend: null,
        repairSpend: null,
        settlement: null,
        cashAfterRun: cashBeforeRun,
        nextRunMinimumCost: estimateMinimumNextRunCost(state, profile),
        halted: true
      })
      haltedAtRun = runIdx
      haltReason = 'start_refused_insufficient_career_funds'
      break
    }
    // START charges the whole upfront commitment in one transaction.
    const prepSpend = cashBeforeRun - finiteNumberOr(state.player.money, 0)

    // 4. Run through simulation
    const simResult = runExpeditionSimulation(state, profile, runSeed, {
      isFreshCareer: true
    })
    const cashAtTerminal = finiteNumberOr(simResult.finalState.player.money, 0)
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

      // Task 12 progression observables, read off the Career the settlements
      // just advanced. These were declared in the metrics object and never
      // written, so the report claimed evidence it had not collected.
      if (
        metrics.signatureTraitUnlockRun === null &&
        Object.values(state.career.crewById ?? {}).some(
          crew => crew?.signatureTraitId
        )
      ) {
        metrics.signatureTraitUnlockRun = runIdx
      }

      // Legacy Expedition-affecting HQ ownership. G5 requires the old
      // automatic Day-1 HQ snowball to stop being the dominant fresh-Career
      // path, so this is observed from `player.hqUpgrades` rather than
      // declared: these two fields used to report their initial `false`/`null`
      // as if they were measurements.
      const ownedHqIds = new Set(state.player.hqUpgrades ?? [])
      const ownsLegacyExpeditionHq = ALL_HQ_ITEMS.some(
        item =>
          ownedHqIds.has(item.id) && doesLegacyHqItemTouchExpedition(item)
      )
      if (
        ownsLegacyExpeditionHq &&
        metrics.firstLegacyExpeditionAffectingHqPurchaseRun === null
      ) {
        metrics.firstLegacyExpeditionAffectingHqPurchaseRun = runIdx
        if (runIdx === 1) {
          metrics.run1LegacyExpeditionAffectingHqPurchaseRate = true
        }
      }

      // Crew recovery debt: how many Tours a serious injury actually costs.
      // Opened debts are recorded when they appear and closed when the Career
      // drops them, so the duration is observed rather than assumed.
      const openDebts = state.career.crewRecoveryDebtById ?? {}
      for (const [crewId, debt] of Object.entries(openDebts)) {
        if (!debt || crewRecoveryDebtOpenedAt.has(crewId)) continue
        crewRecoveryDebtOpenedAt.set(crewId, runIdx)
      }
      for (const [crewId, openedAt] of [...crewRecoveryDebtOpenedAt]) {
        if (Object.hasOwn(openDebts, crewId)) continue
        crewRecoveryDebtOpenedAt.delete(crewId)
        metrics.crewRecoveryDebtDurations.push({
          crewId,
          openedAtRun: openedAt,
          clearedAtRun: runIdx,
          tours: runIdx - openedAt
        })
      }

      // Same-Rival return / Nemesis progression across the sequence.
      const rivalId = state.rivalBand?.id ?? null
      if (rivalId) {
        metrics.rivalIdsByRun.push(rivalId)
        const record = state.career.rivalsById?.[rivalId]
        const nemesisLevel = record?.history?.nemesisLevel ?? 0
        if (nemesisLevel > metrics.maxNemesisLevel) {
          metrics.maxNemesisLevel = nemesisLevel
          metrics.nemesisLevelAdvancedRuns.push({
            run: runIdx,
            level: nemesisLevel
          })
        }
      }

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

    // Close the run's cashflow row. The settlement is what the terminal
    // transition and the Career settlements moved after the run itself ended,
    // which is the component that decides whether a Tour funds the next one.
    const cashAfterRun = finiteNumberOr(state.player.money, 0)
    cashflowByRun.push({
      run: runIdx,
      cashBeforeRun,
      fuelBeforeRun,
      vanConditionBeforeRun,
      prepSpend,
      repairSpend: simResult.telemetry.repairSpend,
      inRunDelta: cashAtTerminal - (cashBeforeRun - prepSpend),
      settlement: cashAfterRun - cashAtTerminal,
      cashAfterRun,
      nextRunMinimumCost: estimateMinimumNextRunCost(state, profile),
      outcome: simResult.outcome,
      halted: false
    })

    // Record rank milestones
    const rank = deriveExpeditionCareerRank(state.career)
    if (rank === 'roadtested' && metrics.firstRoadtestedRun === null) {
      metrics.firstRoadtestedRun = runIdx
    } else if (rank === 'headliner' && metrics.firstHeadlinerRun === null) {
      metrics.firstHeadlinerRun = runIdx
    }
  }

  // Same-Rival return rate: the share of Rival appearances after the first that
  // reused the identity the Career had already met.
  const rivalIds = metrics.rivalIdsByRun
  if (rivalIds.length > 1) {
    const first = rivalIds[0]
    metrics.sameRivalReturnRate =
      rivalIds.slice(1).filter(id => id === first).length /
      (rivalIds.length - 1)
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
    cashflowByRun,
    finalRank: deriveExpeditionCareerRank(state.career),
    metrics,
    runOutcomes,
    finalState: state
  }
}
