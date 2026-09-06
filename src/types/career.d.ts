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

/**
 * The Career's derived standing, never stored and never caller supplied.
 *
 * @remarks
 * Ranks come from accomplishments — finalized and completed runs, the Regions
 * they happened in, and how far a persistent Rival feud has gone — so Fame
 * alone can never buy one.
 */
export type ExpeditionCareerRank =
  'rookie' | 'roadtested' | 'headliner' | 'cult_legend'

/**
 * An HQ facility the Career can build.
 */
export type ExpeditionHqFacilityId =
  | 'workshop'
  | 'rehearsal'
  | 'management_office'
  | 'garage'
  | 'black_market_contact'
  | 'crew_lounge'

/**
 * A purchasable facility level.
 *
 * @remarks
 * Level 0 is "not built" and is never bought, so it is not a member here.
 */
export type ExpeditionHqFacilityLevel = 1 | 2

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
  /**
   * Runs whose Career result has already been settled.
   *
   * @remarks
   * Separate from `settledCrewRunIds`: Crew settlement and Career settlement
   * are different transitions with different evidence, and sharing one list
   * would let either silently consume the other's replay guard.
   */
  settledExpeditionRunIds: string[]
  hqFacilityLevels: Record<string, number>
  ascensionUnlocked: boolean
}
