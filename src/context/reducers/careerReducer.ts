import type {
  AcquireExpeditionCrewSignaturePayload,
  CommitExpeditionLegendaryRewardPayload,
  GenerateExpeditionBetweenTourDecisionsPayload,
  RecordExpeditionArchiveDiscoveryPayload,
  ResolveExpeditionBetweenTourDecisionPayload,
  ExpeditionUnlockPurchasePayload,
  PurchaseExpeditionHqFacilityPayload,
  SettleExpeditionCareerResultPayload,
  SettleExpeditionCrewCareerPayload,
  UnlockExpeditionAscensionPayload
} from '../../types/actions'
import type { GameState } from '../../types'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getEligibleCrewSignatureTrait } from '../../domain/expedition/career'
import {
  isExpeditionAscensionEligible,
  resolveExpeditionCareerSettlement
} from '../../domain/expedition/meta'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { getExpeditionMinimumNextStartCost } from '../../domain/expedition/loadout'
import { clampPlayerMoney } from '../../utils/gameState/clamps'
import { isForbiddenKey } from '../../utils/objectUtils'
import {
  getExpeditionHqFacilityLevelCost,
  isExpeditionHqFacilityId
} from '../../data/expedition/hqFacilities'
import { getExpeditionUnlockSet } from '../../data/expedition/unlockSets'
import { hasExpeditionCareerRank } from '../../domain/expedition/meta'
import { getCrewEventOutcomeBySourceId } from '../../domain/expedition/crewEventOutcomes'
import { resolveExpeditionLegendaryCandidate } from '../../domain/expedition/legendaries'
import {
  canRecordExpeditionArchiveDiscovery,
  sweepExpeditionArchiveObservations
} from '../../domain/expedition/archive'
import { isExpeditionArchiveCategory } from '../../data/expedition/archive'
import {
  applyBetweenTourDecisionOption,
  generateBetweenTourDecisions
} from '../../domain/expedition/betweenTour'
import { resolveCrewRecoveryDebt } from '../../domain/expedition/injuries'

/** Band consequence stages, weakest first, for keeping only the worse one. */
const BAND_CONSEQUENCE_SEVERITY = [
  'none',
  'light',
  'serious',
  'critical'
] as const

export const handleSettleExpeditionCrewCareer = (
  state: GameState,
  payload: SettleExpeditionCrewCareerPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.runId !== 'string'
  )
    return state
  const outcome = state.expedition.outcome
  if (
    !outcome ||
    outcome.runId !== payload.runId ||
    state.career.settledCrewRunIds.includes(payload.runId)
  )
    return state
  const crewIds = state.expedition.loadout?.crewIds ?? []
  const crewById = Object.assign(
    Object.create(null),
    state.career.crewById
  ) as GameState['career']['crewById']
  const crewRecoveryDebtById = Object.assign(
    Object.create(null),
    state.career.crewRecoveryDebtById
  ) as GameState['career']['crewRecoveryDebtById']
  for (const crewId of crewIds) {
    if (!Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId)) continue
    const prior = crewById[crewId] ?? {
      loyalty: 0,
      storyProgress: 0,
      signatureTraitId: null,
      unavailableUntilCompletedRunCount: 0
    }
    const crisisPenalty =
      (state.expedition.crew?.stressByCrewId[crewId] ?? 0) >= 90 ? 2 : 0
    const loyaltyDelta =
      outcome.kind === 'completed' ? 3 : outcome.kind === 'extracted' ? 2 : -2
    const hadPersonalEvent = (
      state.expedition.resolvedCrewSourceIds ?? []
    ).some(marker => {
      const [eventId, optionId] = marker.split(':')
      if (!eventId || !optionId) return false
      const eventOutcome = getCrewEventOutcomeBySourceId(
        `${eventId}:${optionId}`
      )
      return (
        eventOutcome?.stress?.crewId === crewId ||
        eventOutcome?.crewInjuryId === crewId
      )
    })
    crewById[crewId] = {
      ...prior,
      loyalty: Math.max(
        0,
        Math.min(
          100,
          finiteNumberOr(prior.loyalty, 0) + loyaltyDelta - crisisPenalty
        )
      ),
      storyProgress:
        Math.max(0, Math.floor(finiteNumberOr(prior.storyProgress, 0))) +
        1 +
        (hadPersonalEvent ? 1 : 0)
    }
    if (state.expedition.crew?.injuryByCrewId[crewId] === 'serious')
      crewRecoveryDebtById[crewId] = {
        crewId,
        createdFromRunId: payload.runId,
        severity: 'serious',
        toursRemaining: 1
      }
  }
  // The run's band injuries are run-scoped and `PREPARE_NEXT_EXPEDITION` drops
  // them, so a consequence that is meant to outlive the Tour has to be carried
  // into the Career here. Only the worse stage is kept: a light night does not
  // heal a serious one.
  const bandConsequenceByMemberId = Object.assign(
    Object.create(null),
    state.career.bandConsequenceByMemberId
  ) as GameState['career']['bandConsequenceByMemberId']
  for (const [memberId, stage] of Object.entries(
    state.expedition.bandInjuryByMemberId ?? {}
  )) {
    if (stage === 'none') continue
    const prior = bandConsequenceByMemberId[memberId] ?? 'none'
    if (
      BAND_CONSEQUENCE_SEVERITY.indexOf(stage) >
      BAND_CONSEQUENCE_SEVERITY.indexOf(prior)
    ) {
      bandConsequenceByMemberId[memberId] = stage
    }
  }

  return {
    ...state,
    career: {
      ...state.career,
      crewById,
      crewRecoveryDebtById,
      bandConsequenceByMemberId,
      settledCrewRunIds: [...state.career.settledCrewRunIds, payload.runId]
      // The run counters are deliberately not touched here. They have exactly
      // one owner - `handleSettleExpeditionCareerResult` - because the two
      // settlements carry independent replay guards, so incrementing in both
      // would advance a single finalized run twice and pull rank and
      // Crew-development gates forward at double speed.
    }
  }
}

/**
 * Settles one finalized run's Career result exactly once.
 *
 * @param state - Current game state.
 * @param payload - Names the run to settle.
 * @returns State with the Career counters, Regions and Tokens advanced.
 *
 * @remarks
 * The payload names a run; the reducer derives everything else from that run's
 * own finalized outcome. A run whose outcome is missing or does not match, and
 * a run already settled, both return the identical state — so a replayed or
 * forged dispatch cannot mint a second Token.
 */
export const handleSettleExpeditionCareerResult = (
  state: GameState,
  payload: SettleExpeditionCareerResultPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.runId !== 'string'
  )
    return state
  const settlement = resolveExpeditionCareerSettlement(state, payload.runId)
  if (!settlement) return state
  // The road fund: the Career always leaves a Tour able to book the next one.
  //
  // A Tour can end with the band holding less than the rounding-up of the tank
  // it is already sitting on - a euro or two - and `START_EXPEDITION` then
  // refuses every future Tour. That is not a difficulty curve, it is a Career
  // that ended on an accounting edge, and it accounted for 2,757 of 12,000
  // release sequences dropping out before six runs. The floor is the
  // *unavoidable* charge only: it buys no Fuel above what a build must commit,
  // no repairs, no cargo, and it is dwarfed by any real Tour income, so it
  // cannot substitute for earning. A Career that is merely poor stays poor.
  const minimumNextStart = getExpeditionMinimumNextStartCost(state)
  const money = finiteNumberOr(state.player.money, 0)
  const roadFund = Math.max(0, minimumNextStart - money)
  return {
    ...state,
    player:
      roadFund > 0
        ? { ...state.player, money: clampPlayerMoney(money + roadFund) }
        : state.player,
    career: {
      ...state.career,
      // The stored balance is a persisted addend, so it is narrowed before the
      // clamp: `Math.max` cannot recover a `NaN` or an infinity that has
      // already poisoned the sum.
      tourTokens: Math.max(
        0,
        finiteNumberOr(state.career.tourTokens, 0) +
          settlement.tourTokensAwarded
      ),
      finalizedExpeditionRuns: settlement.finalizedExpeditionRuns,
      completedExpeditionRuns: settlement.completedExpeditionRuns,
      completedExpeditionRegionIds: settlement.completedExpeditionRegionIds,
      settledExpeditionRunIds: [
        ...state.career.settledExpeditionRunIds,
        payload.runId
      ]
    }
  }
}

/**
 * Raises one HQ facility by exactly one level, debiting Tokens once.
 *
 * @param state - Current game state.
 * @param payload - Facility and the level the caller believes it is at.
 * @returns Next state, or the identical reference for an illegal purchase.
 *
 * @remarks
 * Every term is re-derived: the id must be in the registry, the stale guard
 * must match the stored level, the target must not exceed that facility's
 * implemented ceiling, and the cost comes from the registry rather than the
 * payload. A replayed dispatch fails its own stale guard, so a level is never
 * bought twice.
 */
export const handlePurchaseExpeditionHqFacility = (
  state: GameState,
  payload: PurchaseExpeditionHqFacilityPayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const { facilityId, expectedLevel } = payload
  if (!isExpeditionHqFacilityId(facilityId)) return state
  if (isForbiddenKey(facilityId)) return state
  if (expectedLevel !== 0 && expectedLevel !== 1) return state

  const stored = Math.max(
    0,
    Math.floor(
      finiteNumberOr(
        Object.hasOwn(state.career.hqFacilityLevels, facilityId)
          ? state.career.hqFacilityLevels[facilityId]
          : 0,
        0
      )
    )
  )
  if (stored !== expectedLevel) return state

  const targetLevel = stored + 1
  const cost = getExpeditionHqFacilityLevelCost(facilityId, targetLevel)
  if (cost === null) return state

  const tokens = Math.max(0, finiteNumberOr(state.career.tourTokens, 0))
  if (tokens < cost) return state

  return {
    ...state,
    career: {
      ...state.career,
      tourTokens: tokens - cost,
      hqFacilityLevels: {
        ...state.career.hqFacilityLevels,
        [facilityId]: targetLevel
      }
    }
  }
}

/**
 * Debits the Tokens and opens the unlock journal entry.
 *
 * @param state - Current game state.
 * @param payload - Names the set being bought.
 * @returns Next state, or the identical reference for an illegal purchase.
 *
 * @remarks
 * Step one of three. Rank, facility level and Token balance are all
 * re-derived here rather than trusted, and the debit happens *with* the
 * journal entry in one commit: a process that dies after this leaves a save
 * that says exactly what was taken and what it was for, which is what lets
 * the load path settle it instead of losing the balance. Only one purchase is
 * open at a time, so a second begin is refused rather than stacking debits.
 */
export const handleBeginExpeditionUnlockPurchase = (
  state: GameState,
  payload: ExpeditionUnlockPurchasePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  if (state.career.pendingUnlockPurchase !== null) return state
  const set = getExpeditionUnlockSet(payload.setId)
  if (!set) return state
  if (state.career.unlockedSetIds.includes(set.id)) return state
  if (!hasExpeditionCareerRank(state, set.requiredRank)) return state

  const facilityLevel = Math.max(
    0,
    Math.floor(
      finiteNumberOr(
        Object.hasOwn(state.career.hqFacilityLevels, set.requiredFacility.id)
          ? state.career.hqFacilityLevels[set.requiredFacility.id]
          : 0,
        0
      )
    )
  )
  if (facilityLevel < set.requiredFacility.level) return state

  const tokens = Math.max(0, finiteNumberOr(state.career.tourTokens, 0))
  if (tokens < set.cost) return state

  return {
    ...state,
    career: {
      ...state.career,
      tourTokens: tokens - set.cost,
      pendingUnlockPurchase: { setId: set.id, debitedTokens: set.cost }
    }
  }
}

/**
 * Grants the set the open journal entry paid for.
 *
 * @param state - Current game state.
 * @param payload - Names the set being completed.
 * @returns Next state, or the identical reference when it does not match.
 *
 * @remarks
 * Step three. The payload must name the set the journal is actually holding,
 * so a forged complete cannot grant a different - or more expensive - set
 * than the one that was paid for.
 */
export const handleCompleteExpeditionUnlockPurchase = (
  state: GameState,
  payload: ExpeditionUnlockPurchasePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const pending = state.career.pendingUnlockPurchase
  if (!pending || pending.setId !== payload.setId) return state
  return {
    ...state,
    career: {
      ...state.career,
      unlockedSetIds: state.career.unlockedSetIds.includes(pending.setId)
        ? state.career.unlockedSetIds
        : [...state.career.unlockedSetIds, pending.setId],
      pendingUnlockPurchase: null
    }
  }
}

/**
 * Refunds an open journal entry and grants nothing.
 *
 * @param state - Current game state.
 * @param payload - Names the set being rolled back.
 * @returns Next state, or the identical reference when it does not match.
 *
 * @remarks
 * The refund comes off the journal entry rather than the registry, so
 * re-costing a set later cannot turn an old open purchase into a profit.
 */
export const handleRollbackExpeditionUnlockPurchase = (
  state: GameState,
  payload: ExpeditionUnlockPurchasePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const pending = state.career.pendingUnlockPurchase
  if (!pending || pending.setId !== payload.setId) return state
  return {
    ...state,
    career: {
      ...state.career,
      tourTokens:
        Math.max(0, finiteNumberOr(state.career.tourTokens, 0)) +
        Math.max(0, finiteNumberOr(pending.debitedTokens, 0)),
      pendingUnlockPurchase: null
    }
  }
}

/**
 * Opens Ascension once, from the Career's own record.
 *
 * @param state - Current game state.
 * @param payload - Names the finalized run that is the evidence.
 * @returns Next state, or the identical reference when it is not earned.
 *
 * @remarks
 * The payload names a settled run and nothing else. Every eligibility term is
 * recomputed here, so a caller cannot supply the conclusion - and a run that
 * was never settled is not evidence, which is what stops a forged dispatch
 * from opening Ascension on a Career that never finished anything.
 */
export const handleUnlockExpeditionAscension = (
  state: GameState,
  payload: UnlockExpeditionAscensionPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.runId !== 'string'
  )
    return state
  if (state.career.ascensionUnlocked) return state
  if (!state.career.settledExpeditionRunIds.includes(payload.runId))
    return state
  if (!isExpeditionAscensionEligible(state)) return state
  return {
    ...state,
    career: { ...state.career, ascensionUnlocked: true }
  }
}

/**
 * Awards the Legendary a finalized Finale earned.
 *
 * @param state - Current game state.
 * @param payload - The run being claimed and the Legendary the caller expects.
 * @returns Next state, or the identical reference when nothing is owed.
 *
 * @remarks
 * Every term is recomputed: the outcome must be a *completed* run with a
 * resolved Finale result, the Career must be at `headliner`, the run must not
 * have claimed already, and the Legendary the Finale maps to must not be owned.
 * `expectedCapabilityId` is only a stale guard on top of that derivation, so a
 * caller reading an old summary claims nothing rather than the wrong award.
 *
 * The run id goes into `legendaryClaimedRunIds` even though the owned list
 * already grew: `contract_special` awards whatever is unowned, so without the
 * run-scoped guard one run could walk the whole registry by dispatching five
 * times.
 */
export const handleCommitExpeditionLegendaryReward = (
  state: GameState,
  payload: CommitExpeditionLegendaryRewardPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.runId !== 'string' ||
    typeof payload.expectedCapabilityId !== 'string'
  ) {
    return state
  }
  const candidate = resolveExpeditionLegendaryCandidate(state, payload.runId)
  if (candidate === null || candidate !== payload.expectedCapabilityId) {
    return state
  }
  return {
    ...state,
    career: {
      ...state.career,
      legendaryIds: [...state.career.legendaryIds, candidate],
      legendaryClaimedRunIds: [
        ...state.career.legendaryClaimedRunIds,
        payload.runId
      ]
    }
  }
}

/**
 * Records one Archive discovery.
 *
 * @param state - Current game state.
 * @param payload - The category, entry and proof being claimed.
 * @returns Next state, or the identical reference when nothing is recorded.
 *
 * @remarks
 * Refused unless the id is canonical for its category *and* the proof still
 * holds against this state. A duplicate is an identity no-op rather than a
 * rejection: meeting the same Rival twice is not an error, it just does not
 * grow the log.
 *
 * The Archive grants nothing. It is written here and read nowhere that decides
 * what a Career may do, which is the whole contract.
 */
export const handleRecordExpeditionArchiveDiscovery = (
  state: GameState,
  payload: RecordExpeditionArchiveDiscoveryPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'string' ||
    typeof payload.sourceId !== 'string' ||
    !isExpeditionArchiveCategory(payload.category)
  ) {
    return state
  }
  const { category, id, sourceId } = payload
  if (!canRecordExpeditionArchiveDiscovery(state, category, id, sourceId)) {
    return state
  }
  const recorded = state.career.archiveByCategory[category] ?? []
  if (recorded.includes(id)) return state
  return {
    ...state,
    career: {
      ...state.career,
      archiveByCategory: {
        ...state.career.archiveByCategory,
        [category]: [...recorded, id]
      }
    }
  }
}

/**
 * Records every discovery the current state can prove.
 *
 * @param state - Current game state.
 * @returns Next state, or the identical reference when nothing is new.
 *
 * @remarks
 * Each claim still goes through {@link handleRecordExpeditionArchiveDiscovery},
 * so the sweep only decides what to *offer* - a claim it composes wrongly is
 * refused exactly as a dispatched one would be.
 */
export const recordExpeditionArchiveObservations = (
  state: GameState
): GameState => {
  let next = state
  for (const claim of sweepExpeditionArchiveObservations(state)) {
    next = handleRecordExpeditionArchiveDiscovery(next, claim)
  }
  return next
}

export const handleAcquireExpeditionCrewSignature = (
  state: GameState,
  payload: AcquireExpeditionCrewSignaturePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  if (
    payload.sourceType !== 'career_development' ||
    payload.sourceId !==
      `crew-development:${payload.crewId}:${state.career.finalizedExpeditionRuns}`
  )
    return state
  const traitId = getEligibleCrewSignatureTrait(state, payload.crewId)
  if (!traitId || traitId !== payload.expectedTraitId) return state
  const prior = state.career.crewById[payload.crewId]
  if (!prior) return state
  return {
    ...state,
    career: {
      ...state.career,
      crewById: {
        ...state.career.crewById,
        [payload.crewId]: { ...prior, signatureTraitId: traitId }
      }
    }
  }
}

/**
 * Generates the Between-Tour decisions one finalized run leaves behind.
 *
 * @param state - Current game state.
 * @param payload - Names the run.
 * @returns Next state, or the identical reference when nothing is generated.
 *
 * @remarks
 * Runs after both settlements and refuses a run that already has a stored set,
 * so a repeated dispatch is an identity no-op rather than a second round of
 * questions about the same Tour.
 *
 * The recovery-debt expiry happens here too, and before the decisions are
 * derived: a debt whose Crew sat this Tour out has served it, so it is cleared
 * and no longer generates a rehab decision. A Crew that was *selected* keeps
 * its debt - it did not skip the Tour it owed.
 */
export const handleGenerateExpeditionBetweenTourDecisions = (
  state: GameState,
  payload: GenerateExpeditionBetweenTourDecisionsPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.runId !== 'string'
  ) {
    return state
  }
  const expired = expireServedCrewRecoveryDebts(state, payload.runId)
  const generated = generateBetweenTourDecisions(expired, payload.runId)
  if (!generated) return state
  return {
    ...expired,
    career: {
      ...expired.career,
      betweenTourByRunId: {
        ...expired.career.betweenTourByRunId,
        [payload.runId]: generated
      }
    }
  }
}

/**
 * Clears every recovery debt whose Crew sat the finalized Tour out.
 *
 * @param state - Current game state.
 * @param runId - The just-finalized run.
 * @returns Next state, or the identical reference when nothing expired.
 *
 * @remarks
 * A debt is one skipped Tour, so the Tour that just finished either was the
 * skipped one or was not. Crew the run selected keep their debt - including
 * Crew that came back injured again, whose debt the settlement has just
 * re-created. The debt created *by this very run* is excluded by the same
 * rule, since its Crew was on the road.
 */
const expireServedCrewRecoveryDebts = (
  state: GameState,
  runId: string
): GameState => {
  if (!state.career.settledCrewRunIds.includes(runId)) return state
  const selected = new Set(state.expedition?.loadout?.crewIds ?? [])
  let career = state.career
  for (const debt of Object.values(state.career.crewRecoveryDebtById)) {
    if (selected.has(debt.crewId)) continue
    career = resolveCrewRecoveryDebt(
      career,
      debt.crewId,
      'served_unavailable_tour'
    )
  }
  return career === state.career ? state : { ...state, career }
}

/**
 * Answers one stored Between-Tour decision.
 *
 * @param state - Current game state.
 * @param payload - The run, the decision and the option taken.
 * @returns Next state, or the identical reference when nothing is applied.
 *
 * @remarks
 * The stored decision is the authority on the target and the registry on the
 * cost, so the payload names an option and nothing else. A money option is
 * re-checked for affordability *here* rather than at generation: the Career may
 * have spent the Cash on an earlier decision of the same Tour, and an option
 * priced when it was offered would let both be taken.
 *
 * A second resolve of the same decision is an identity no-op - the recorded
 * answer is the guard, so a replayed dispatch cannot pay twice or treat twice.
 */
export const handleResolveExpeditionBetweenTourDecision = (
  state: GameState,
  payload: ResolveExpeditionBetweenTourDecisionPayload
): GameState => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.runId !== 'string' ||
    typeof payload.decisionId !== 'string' ||
    typeof payload.optionId !== 'string'
  ) {
    return state
  }
  const stored = Object.hasOwn(state.career.betweenTourByRunId, payload.runId)
    ? state.career.betweenTourByRunId[payload.runId]
    : undefined
  if (!stored) return state
  if (Object.hasOwn(stored.resolvedOptionByDecisionId, payload.decisionId)) {
    return state
  }
  const decision = stored.decisions.find(
    entry => entry.id === payload.decisionId
  )
  if (!decision || !decision.optionIds.includes(payload.optionId)) return state

  const applied = applyBetweenTourDecisionOption(
    state,
    decision,
    payload.optionId
  )
  // `null` means the option could not be taken after all - most often an
  // affordability check that no longer holds - and an unanswerable option must
  // leave the decision open rather than consume it.
  if (!applied) return state

  return {
    ...applied,
    career: {
      ...applied.career,
      betweenTourByRunId: {
        ...applied.career.betweenTourByRunId,
        [payload.runId]: {
          ...stored,
          resolvedOptionByDecisionId: {
            ...stored.resolvedOptionByDecisionId,
            [payload.decisionId]: payload.optionId
          }
        }
      }
    }
  }
}
