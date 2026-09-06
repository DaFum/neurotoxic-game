import type {
  AcquireExpeditionCrewSignaturePayload,
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
import { isForbiddenKey } from '../../utils/objectUtils'
import {
  getExpeditionHqFacilityLevelCost,
  isExpeditionHqFacilityId
} from '../../data/expedition/hqFacilities'
import { getExpeditionUnlockSet } from '../../data/expedition/unlockSets'
import { hasExpeditionCareerRank } from '../../domain/expedition/meta'
import { getCrewEventOutcomeBySourceId } from '../../domain/expedition/crewEventOutcomes'

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
  return {
    ...state,
    career: {
      ...state.career,
      crewById,
      crewRecoveryDebtById,
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
  return {
    ...state,
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
