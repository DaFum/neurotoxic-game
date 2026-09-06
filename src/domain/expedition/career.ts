import type { CareerState } from '../../types/career'
import type { GameState } from '../../types'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { EXPEDITION_CREW_SIGNATURE_BY_ROLE } from '../../data/expedition/crewSignatureTraits'

export const createInitialCareerState = (): CareerState => ({
  crewById: Object.create(null) as CareerState['crewById'],
  expeditionRelationshipByPair: Object.create(
    null
  ) as CareerState['expeditionRelationshipByPair'],
  crewRecoveryDebtById: Object.create(
    null
  ) as CareerState['crewRecoveryDebtById'],
  settledCrewRunIds: [],
  rivalsById: Object.create(null) as CareerState['rivalsById'],
  betweenTourByRunId: Object.create(null) as CareerState['betweenTourByRunId'],
  tourTokens: 0,
  finalizedExpeditionRuns: 0,
  completedExpeditionRuns: 0,
  completedExpeditionRegionIds: [],
  hqFacilityLevels: Object.create(null) as CareerState['hqFacilityLevels'],
  ascensionUnlocked: false
})

export const createCrewDevelopmentEligibilityProof = (
  state: GameState,
  crewId: string
): string | null =>
  getEligibleCrewSignatureTrait(state, crewId)
    ? `crew-development:${crewId}:${state.career.finalizedExpeditionRuns}`
    : null

export const getEligibleCrewSignatureTrait = (
  state: GameState,
  crewId: string
): string | null => {
  const definition = EXPEDITION_CREW_BY_ID[crewId]
  const crew = state.career.crewById[crewId]
  if (
    !definition ||
    !crew ||
    crew.loyalty < 60 ||
    crew.storyProgress < 3 ||
    crew.signatureTraitId ||
    state.career.crewRecoveryDebtById[crewId]
  )
    return null
  if (
    Object.hasOwn(state.career.hqFacilityLevels, 'crew_lounge') &&
    (state.career.hqFacilityLevels.crew_lounge ?? 0) < 1
  )
    return null
  return EXPEDITION_CREW_SIGNATURE_BY_ROLE[definition.role]
}
