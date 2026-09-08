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
import { getExpeditionHqFacilityLevelCost } from '../src/data/expedition/hqFacilities.ts'
import {
  createBeginExpeditionUnlockPurchaseAction,
  createCompleteExpeditionUnlockPurchaseAction,
  createPurchaseExpeditionHqFacilityAction
} from '../src/context/careerActionCreators.ts'
import { prepareExpeditionSponsorOffers } from '../src/context/expeditionActionCreators.ts'
import { getExpeditionInsurancePremium } from '../src/domain/expedition/insurance.ts'
import { doesLegacyHqItemTouchExpedition } from '../src/domain/expedition/legacyHqPolicy.ts'
import { ALL_HQ_ITEMS } from '../src/data/hqItems.ts'
import { SONGS_BY_ID } from '../src/data/songs.ts'
import {
  toCanonicalRegionId,
  toCanonicalTourTypeId,
  pickSponsorOffer
} from './game-balance-expedition-profiles.mjs'
import { runExpeditionSimulation } from './game-balance-expedition-runner.mjs'
import { finiteNumberOr } from '../src/utils/finiteNumber.ts'

/** Production ceiling on a committed starting Fuel target. */
const MAX_EXPEDITION_FUEL = 100

const DEFAULT_BETWEEN_TOUR_POLICY = Object.freeze({
  sponsor_advance: ['take_advance', 'decline_advance'],
  injury_rehab: ['accept_unavailability', 'pay_rehab'],
  crew_debrief: ['rest_band', 'develop_signature'],
  rival_response: ['cool_down', 'confront'],
  sponsor_follow_up: ['walk_away', 'keep_relationship'],
  // Repair first. `carry_damage` was the default and no persona overrode it,
  // so no simulated Career ever repaired its van at any price: median van
  // condition at the start of a Tour ran 100, 22, 0, 0, 0, 0, every later run
  // bailed out at its first window on survival pressure, and the sequence then
  // halted for lack of funds it could no longer earn. A player with a wrecked
  // van and money in hand repairs it; modelling one who never does made the
  // Career economy look broken when the simulated decision was.
  vehicle_repair: ['pay_repair', 'carry_damage'],
  network_contact: ['cash_out', 'follow_lead']
})

/**
 * The persona's option preferences for one decision, most-wanted first.
 *
 * @param decision - The generated decision instance.
 * @param personaPolicy - The persona's declared meta policy.
 * @returns Every option the instance offers, in preference order.
 *
 * @remarks
 * The same order {@link selectBetweenTourOption} takes its single pick from,
 * exposed in full so a caller can fall through to the next choice when an
 * earlier one is refused at apply time.
 */
export const orderedBetweenTourOptions = (decision, personaPolicy) => {
  const preferences =
    personaPolicy?.[decision.type] ??
    DEFAULT_BETWEEN_TOUR_POLICY[decision.type] ??
    []
  const ordered = preferences.filter(id => decision.optionIds.includes(id))
  for (const id of decision.optionIds) {
    if (!ordered.includes(id)) ordered.push(id)
  }
  return ordered
}

export const selectBetweenTourOption = (decision, personaPolicy) => {
  const preferences =
    personaPolicy?.[decision.type] ??
    DEFAULT_BETWEEN_TOUR_POLICY[decision.type] ??
    []
  return (
    preferences.find(optionId => decision.optionIds.includes(optionId)) ??
    decision.optionIds[0]
  )
}

export const purchaseNextPersonaMeta = (state, profile) => {
  const setId = profile.requiredCapabilitySetIds.find(
    id => !state.career.unlockedSetIds.includes(id)
  )
  if (!setId) return { state, purchaseType: null }
  const set = EXPEDITION_UNLOCK_SETS[setId]
  if (!set) return { state, purchaseType: null }
  const currentLevel =
    state.career.hqFacilityLevels[set.requiredFacility.id] ?? 0
  if (currentLevel < set.requiredFacility.level) {
    const nextLevel = currentLevel + 1
    const cost = getExpeditionHqFacilityLevelCost(
      set.requiredFacility.id,
      nextLevel
    )
    if (cost === null || finiteNumberOr(state.career.tourTokens, 0) < cost)
      return { state, purchaseType: null }
    const nextState = gameReducer(
      state,
      createPurchaseExpeditionHqFacilityAction(
        set.requiredFacility.id,
        currentLevel
      )
    )
    return {
      state: nextState,
      purchaseType: nextState === state ? null : 'facility'
    }
  }
  if (finiteNumberOr(state.career.tourTokens, 0) < set.cost)
    return { state, purchaseType: null }
  const begun = gameReducer(
    state,
    createBeginExpeditionUnlockPurchaseAction(setId)
  )
  const completed =
    begun === state
      ? state
      : gameReducer(begun, createCompleteExpeditionUnlockPurchaseAction(setId))
  return { state: completed, purchaseType: completed === begun ? null : 'set' }
}

export const summarizeCareerCashflow = sequences => {
  const byRun = new Map()
  for (const sequence of sequences)
    for (const entry of sequence.cashflowByRun ?? []) {
      const aggregate = byRun.get(entry.run) ?? {
        run: entry.run,
        samples: 0,
        halted: 0,
        prepSpend: 0,
        sponsorIncome: 0,
        repairSpend: 0,
        inRunDelta: 0,
        settlement: 0,
        cashAfterRun: 0,
        nextRunMinimumCost: 0
      }
      aggregate.samples++
      aggregate.halted += entry.halted ? 1 : 0
      for (const key of [
        'prepSpend',
        'sponsorIncome',
        'repairSpend',
        'inRunDelta',
        'settlement',
        'cashAfterRun',
        'nextRunMinimumCost'
      ])
        aggregate[key] += finiteNumberOr(entry[key], 0)
      byRun.set(entry.run, aggregate)
    }
  return [...byRun.values()]
    .sort((a, b) => a.run - b.run)
    .map(entry => ({
      run: entry.run,
      samples: entry.samples,
      halted: entry.halted,
      meanPrepSpend: entry.prepSpend / entry.samples,
      meanSponsorIncome: entry.sponsorIncome / entry.samples,
      meanRepairSpend: entry.repairSpend / entry.samples,
      meanInRunDelta: entry.inRunDelta / entry.samples,
      meanSettlement: entry.settlement / entry.samples,
      meanCashAfterRun: entry.cashAfterRun / entry.samples,
      meanNextRunMinimumCost: entry.nextRunMinimumCost / entry.samples
    }))
}

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

  const fuelTarget = affordableFuelTarget(state, profile)

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
      // A build may only top the tank up, never siphon it, so the floor is
      // whatever the last Tour left. Above that floor the persona asks for its
      // preferred level, but only as far as the Career can actually pay for:
      // "best currently legal approximation" includes affordable. Insisting on
      // the preferred target while broke made the builder refuse Tours a real
      // player would simply book with a smaller top-up.
      startingFuelTarget: fuelTarget,
      protectedCareerCash: 0
    }
  }
}

/**
 * The highest Fuel target this Career can both legally commit and afford.
 *
 * @param state - Live Career state.
 * @param profile - Persona whose preferred target is the ceiling.
 * @returns A legal `startingFuelTarget`.
 *
 * @remarks
 * START charges `getExpeditionFuelTopUpCost(currentFuel, target)` before
 * anything else, so a target the Career cannot pay for is refused outright.
 * The floor is the current level - a build may only top up - and that floor
 * always costs nothing, so a Career is never locked out of booking entirely.
 */
const affordableFuelTarget = (state, profile) => {
  const currentFuel = finiteNumberOr(state.player.van?.fuel, 0)
  const floor = Math.min(MAX_EXPEDITION_FUEL, Math.ceil(currentFuel))
  const preferred = Math.min(
    MAX_EXPEDITION_FUEL,
    Math.max(floor, profile.startingFuelTarget)
  )
  const money = Math.max(0, finiteNumberOr(state.player.money, 0))
  for (let target = preferred; target > floor; target--) {
    if (getExpeditionFuelTopUpCost(currentFuel, target) <= money) return target
  }
  return floor
}

// A build that rings off Career Cash would make next-run solvency structural:
// `getExpeditionSpendableCash` subtracts the slice from every in-run spend and
// `settleExpedition` never confiscates it, on any terminal kind. Setting it
// here is blocked by Gate 5, which asserts `money >= protectedCareerCash` at
// every stage of an active run - stricter than production, which lets a Gig
// with a negative net reduce Career Cash without consulting the floor. With a
// reserve of 2 the gate fires reproducibly on `underground_heat` and
// `scout_intel`. The gate has never been exercised before because this builder
// always committed 0, so which of the two is wrong is a design decision rather
// than a fix: either the gate means discretionary spends only, or the
// guarantee belongs in `settleExpedition` instead of the build. Recorded here
// rather than resolved unilaterally.
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
  // Priced through `affordableFuelTarget`, the same rule the build commits by.
  // This used to floor the target at 50 and at the persona's preference, which
  // priced a build a poor Career would never commit: it reported 161
  // post-extraction shortfalls where only 19 sequences actually halted, and
  // 461 post-failure where only 29 did. A cheapest-legal cost has to be the
  // cheapest *legal* one - backing off to the tank the Tour left behind.
  return getExpeditionFuelTopUpCost(
    currentFuel,
    affordableFuelTarget(state, profile)
  )
}

/**
 * Names the guard that actually refused `START_EXPEDITION`.
 *
 * @param {import('../src/types').GameState} state - State after the refused dispatch.
 * @param {string} statusBeforeStart - Expedition status the dispatch saw.
 * @param {string | null} preparedIdBeforeStart - Prep id on state before the dispatch.
 * @param {string} prepId - Prep id the payload carried.
 * @param {object} normalized - The normalized build the payload carried.
 * @returns {string} A reason code naming the guard, not a guess at one.
 *
 * @remarks
 * This used to report `start_refused_insufficient_career_funds` for every
 * refusal, whatever the cause. That single label put 2,232 of 6,000 halts
 * down to the Career economy while the mean Career held 40x the next run's
 * minimum cost - a contradiction that stood in the artifact for as long as the
 * label was a guess. `handleStartExpedition` has four ways to refuse and only
 * the last is about money; each is checked here in the reducer's own order.
 */
const classifyStartRefusal = (
  state,
  statusBeforeStart,
  preparedIdBeforeStart,
  prepId,
  normalized
) => {
  if (statusBeforeStart !== 'prepared') {
    // The run before this one never released the slice, so PREPARE could not
    // claim it and START had nothing to begin.
    return `start_refused_status_not_prepared:${statusBeforeStart}`
  }
  if (preparedIdBeforeStart !== prepId) {
    return 'start_refused_prep_id_mismatch'
  }
  const currentFuel = finiteNumberOr(state.player.van?.fuel, 0)
  const upfrontCost =
    getExpeditionFuelTopUpCost(currentFuel, normalized.build.startingFuelTarget) +
    getExpeditionInsurancePremium(normalized.insurancePolicyId)
  const money = finiteNumberOr(state.player.money, 0)
  const protectedCash = finiteNumberOr(normalized.build.protectedCareerCash, 0)
  if (money - upfrontCost < protectedCash) {
    return 'start_refused_insufficient_career_funds'
  }
  // Every guard the reducer states was satisfied and it still refused, so the
  // cause is somewhere this classifier does not model. Say so rather than
  // reaching for the nearest plausible label.
  return 'start_refused_unclassified'
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
 *     normalTerminals: number,
 *     solventAfterNormalTerminal: number,
 *     nextRunSolvencyRate: number | null,
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
    sponsorAdvancesTaken: 0,
    sponsorOffersStaged: 0,
    sponsorOffersSelected: 0,
    sponsorOffersAccepted: 0,
    normalTerminals: 0,
    solventAfterNormalTerminal: 0,
    insolventAfterNormalTerminalRuns: [],
    nextRunSolvencyRate: null,
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
    let legalLoadout = buildLegalLoadoutApproximation(state, profile)
    state = gameReducer(
      state,
      prepareExpeditionSponsorOffers(
        state,
        legalLoadout.regionId,
        legalLoadout.tourTypeId,
        legalLoadout.starterPerkId
      )
    )
    metrics.sponsorOffersStaged += state.expedition.preparedSponsorOffers.length
    const sponsor =
      profile.sponsorPolicy === 'none'
        ? null
        : pickSponsorOffer(
            state.expedition.preparedSponsorOffers,
            profile.sponsorPolicy,
            state.rivalBand?.alignment ?? null
          )
    if (sponsor) {
      metrics.sponsorOffersSelected += 1
      legalLoadout = {
        ...legalLoadout,
        build: { ...legalLoadout.build, sponsorOfferId: sponsor.offerId }
      }
    }

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
    const statusBeforeStart = state.expedition.status
    const preparedIdBeforeStart = state.expedition.prep?.prepId ?? null
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
        sponsorIncome: null,
        cashBeforeSimulation: null,
        repairSpend: null,
        settlement: null,
        cashAfterRun: cashBeforeRun,
        nextRunMinimumCost: estimateMinimumNextRunCost(state, profile),
        halted: true
      })
      haltedAtRun = runIdx
      haltReason = classifyStartRefusal(
        state,
        statusBeforeStart,
        preparedIdBeforeStart,
        prepId,
        validation.normalized
      )
      break
    }
    const prepSpend =
      getExpeditionFuelTopUpCost(
        fuelBeforeRun,
        validation.normalized.build.startingFuelTarget
      ) + getExpeditionInsurancePremium(validation.normalized.insurancePolicyId)
    const cashBeforeSimulation = finiteNumberOr(state.player.money, 0)
    const sponsorIncome = cashBeforeSimulation - (cashBeforeRun - prepSpend)
    if (
      sponsor &&
      state.expedition.activeObligations.some(
        obligation =>
          obligation.sourceType === 'brandDeal' &&
          obligation.sourceId === sponsor.dealId
      )
    ) {
      metrics.sponsorOffersAccepted += 1
    }

    // 4. Run through simulation
    const simResult = runExpeditionSimulation(state, profile, runSeed, {
      isFreshCareer: true
    })
    const cashAtTerminal = finiteNumberOr(simResult.finalState.player.money, 0)
    state = simResult.finalState
    runOutcomes.push(simResult.outcome)

    const runId = state.expedition.outcome?.runId
    if (!runId) {
      // No terminal `runId` means the run never reached a terminal transition,
      // so Legendary commitment, both Career settlements, meta progression and
      // `PREPARE_NEXT_EXPEDITION` are all skipped. Left unrecorded, the *next*
      // iteration refuses to start and the sequence reports
      // `start_refused_insufficient_career_funds` - blaming the economy for a
      // run that simply never settled. Halt here and name the real cause.
      haltedAtRun = runIdx
      haltReason = `no_terminal_run_id:${simResult.outcome}`
      break
    }
    {
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
        // Resolve every generated family through the persona's declared meta
        // preferences. The generated instance remains authoritative: a policy
        // can only choose an option that Production actually offered.
        //
        // Down the preference order until one is actually accepted. A preferred
        // option can be legal to offer and still be refused at apply time -
        // `pay_repair` with less than one point's worth of cash, `take_advance`
        // once an earlier decision in the same set made the Career solvent -
        // and a refused resolve leaves the decision unanswered. That is not a
        // cosmetic miss: `PREPARE_NEXT_EXPEDITION` requires every decision to
        // be answered, so one stranded question keeps the slice out of `idle`
        // and every later Tour is refused at START. The sequence then reports
        // a funding halt for a Career that was never asked for money.
        const beforeAdvance = state.career.sponsorAdvance
        for (const optionId of orderedBetweenTourOptions(
          dec,
          profile.betweenTourMetaPolicy
        )) {
          const next = gameReducer(state, {
            type: ActionTypes.RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION,
            payload: { runId, decisionId: dec.id, optionId }
          })
          if (next !== state) {
            state = next
            break
          }
        }
        if (beforeAdvance === null && state.career.sponsorAdvance !== null) {
          metrics.sponsorAdvancesTaken += 1
        }
      }

      // Step D: Perform at most ONE facility OR unlock-set purchase from earned Tour Tokens
      const purchase = purchaseNextPersonaMeta(state, profile)
      state = purchase.state
      if (
        purchase.purchaseType === 'facility' &&
        metrics.firstMetaFacilityRun === null
      )
        metrics.firstMetaFacilityRun = runIdx
      if (purchase.purchaseType === 'set') {
        if (metrics.firstPermanentExpeditionCapabilityRun === null)
          metrics.firstPermanentExpeditionCapabilityRun = runIdx
        if (runIdx === 1) metrics.run1PermanentCapabilityPurchaseRate = true
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

    // Phase A solvency invariant: after a *normal* terminal - a Completion or
    // a voluntary Extraction - the Career must be able to fund the cheapest
    // legal next Expedition. Failure is allowed to break the guarantee; that
    // is what makes it a failure. Measured rather than assumed, so the gate
    // reports how often the loop actually stays playable.
    const normalTerminal =
      simResult.outcome === 'completed' || simResult.outcome === 'extracted'
    const nextCost = estimateMinimumNextRunCost(state, profile)
    if (normalTerminal) {
      metrics.normalTerminals += 1
      if (finiteNumberOr(state.player.money, 0) >= nextCost) {
        metrics.solventAfterNormalTerminal += 1
      } else {
        metrics.insolventAfterNormalTerminalRuns.push({
          run: runIdx,
          outcome: simResult.outcome,
          cash: finiteNumberOr(state.player.money, 0),
          nextRunMinimumCost: nextCost
        })
      }
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
      sponsorIncome,
      cashBeforeSimulation,
      repairSpend: simResult.telemetry.repairSpend,
      // The two halves of `inRunDelta`, which on its own cannot say whether a
      // Tour lost money because the Gigs paid badly or because the road was
      // expensive. `gigNet` is the production `deriveFinancials` net summed
      // over the run's Gigs; `roadSpend` is everything else the run moved.
      gigNet: simResult.telemetry.gigNetTotal,
      roadSpend:
        cashAtTerminal -
        cashBeforeSimulation -
        finiteNumberOr(simResult.telemetry.gigNetTotal, 0),
      inRunDelta: cashAtTerminal - cashBeforeSimulation,
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

  metrics.nextRunSolvencyRate =
    metrics.normalTerminals === 0
      ? null
      : metrics.solventAfterNormalTerminal / metrics.normalTerminals

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
