import type {
  AcquireExpeditionCrewSignaturePayload,
  SettleExpeditionCareerResultPayload,
  SettleExpeditionCrewCareerPayload
} from '../../types/actions'
import type { GameState } from '../../types'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getEligibleCrewSignatureTrait } from '../../domain/expedition/career'
import { resolveExpeditionCareerSettlement } from '../../domain/expedition/meta'
import { finiteNumberOr } from '../../utils/finiteNumber'
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
