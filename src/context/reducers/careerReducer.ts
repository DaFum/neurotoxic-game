import type {
  AcquireExpeditionCrewSignaturePayload,
  SettleExpeditionCrewCareerPayload
} from '../../types/actions'
import type { GameState } from '../../types'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getEligibleCrewSignatureTrait } from '../../domain/expedition/career'
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
      settledCrewRunIds: [...state.career.settledCrewRunIds, payload.runId],
      finalizedExpeditionRuns:
        Math.max(
          0,
          Math.floor(finiteNumberOr(state.career.finalizedExpeditionRuns, 0))
        ) + 1,
      completedExpeditionRuns:
        Math.max(
          0,
          Math.floor(finiteNumberOr(state.career.completedExpeditionRuns, 0))
        ) + (outcome.kind === 'completed' ? 1 : 0)
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
