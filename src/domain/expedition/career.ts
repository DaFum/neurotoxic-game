import type { CareerState } from '../../types/career'
import type { GameState } from '../../types'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { EXPEDITION_CREW_SIGNATURE_BY_ROLE } from '../../data/expedition/crewSignatureTraits'
import { isExpeditionCapabilityUnlocked } from '../../data/expedition/unlockSets'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { createEmptyExpeditionArchive } from './archive'

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
  settledExpeditionRunIds: [],
  hqFacilityLevels: Object.create(null) as CareerState['hqFacilityLevels'],
  unlockedSetIds: [],
  pendingUnlockPurchase: null,
  ascensionUnlocked: false,
  legendaryIds: [],
  legendaryClaimedRunIds: [],
  archiveByCategory: createEmptyExpeditionArchive()
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
  // The set the Career paid for is the gate, not a loyalty threshold alone.
  if (
    !isExpeditionCapabilityUnlocked(
      state.career?.unlockedSetIds,
      'crew_signature_traits'
    )
  )
    return null
  // An absent `crew_lounge` key means level 0, not "no requirement": the
  // previous `Object.hasOwn` guard let a Career that had never built the
  // facility through, which is the one case the requirement exists for.
  if (
    Math.floor(
      finiteNumberOr(
        Object.hasOwn(state.career.hqFacilityLevels, 'crew_lounge')
          ? state.career.hqFacilityLevels.crew_lounge
          : 0,
        0
      )
    ) < 1
  )
    return null
  return EXPEDITION_CREW_SIGNATURE_BY_ROLE[definition.role]
}
