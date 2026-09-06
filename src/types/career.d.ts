import type { ExpeditionRelationshipTier } from './expedition'

export interface CrewCareerState {
  loyalty: number
  storyProgress: number
  signatureTraitId: string | null
  unavailableUntilCompletedRunCount: number
}

export interface CrewRecoveryDebt {
  crewId: string
  createdFromRunId: string
  severity: 'serious'
  toursRemaining: 1
}
export interface CareerRivalSnapshot {
  id: string
  name: string
  style: string
  preferredRegionId: string
  signatureBehavior: 'aggressive' | 'showboat' | 'saboteur' | 'dealbreaker'
  seed: number
}
export interface CareerRivalHistory {
  relationship:
    'unknown' | 'competitive' | 'rival' | 'nemesis' | 'respect' | 'alliance'
  nemesisLevel: 0 | 1 | 2 | 3 | 4
  encounterCount: number
  lastOutcome: 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance' | null
  lastSeenRunId: string | null
  /**
   * Run in which this Rival's Nemesis level last advanced.
   *
   * @remarks
   * Distinct from {@link CareerRivalHistory.lastSeenRunId}, which START stamps
   * when it selects the Rival and therefore already equals the current run id.
   * Reusing that field as the advance guard rejects the run's first genuine
   * encounter; this one is only ever written by an advance.
   */
  lastNemesisAdvanceRunId: string | null
}
export interface CareerRivalRecord {
  snapshot: CareerRivalSnapshot
  history: CareerRivalHistory
}

export interface CareerState {
  crewById: Record<string, CrewCareerState>
  expeditionRelationshipByPair: Record<string, ExpeditionRelationshipTier>
  crewRecoveryDebtById: Record<string, CrewRecoveryDebt>
  settledCrewRunIds: string[]
  rivalsById: Record<string, CareerRivalRecord>
  betweenTourByRunId: Record<string, never>
  tourTokens: number
  finalizedExpeditionRuns: number
  completedExpeditionRuns: number
  completedExpeditionRegionIds: string[]
  hqFacilityLevels: Record<string, number>
  ascensionUnlocked: boolean
}
