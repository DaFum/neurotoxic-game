import type {
  ExpeditionBandInjuryStage,
  ExpeditionRelationshipTier
} from './expedition'

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

/**
 * A purchasable unlock set.
 */
export type ExpeditionUnlockSetId =
  | 'mechanic_network'
  | 'industry_network'
  | 'underground_network'
  | 'festival_network'
  | 'crew_network'
  | 'chassis_network'
  | 'rival_network'

/**
 * A capability an unlock set grants.
 *
 * @remarks
 * Capabilities are the only thing a set is worth. Availability lookups ask
 * `isExpeditionCapabilityUnlocked` for one of these rather than testing which
 * set the Career owns, so a set can be re-costed or split without touching a
 * single consumer.
 */
export type ExpeditionCapabilityId =
  | 'region_industrial_belt'
  | 'region_corporate_circuit'
  | 'region_underground_scene'
  | 'region_festival_fields'
  | 'tour_survival_tour'
  | 'tour_corporate_tour'
  | 'tour_underground_tour'
  | 'tour_blitz_tour'
  | 'tour_rival_hunt_tour'
  | 'crew_manager'
  | 'crew_security'
  | 'crew_signature_traits'
  | 'perk_mechanic_kit'
  | 'perk_press_pass'
  | 'perk_underground_contact'
  | 'perk_rehearsed_set'
  | 'advanced_inspection'
  | 'premium_sponsor_pool'
  | 'performance_contract_pool'
  | 'black_market_content'
  | 'chassis_higher_tier'
  | 'rival_quest_continuation'

/**
 * The five Legendary capabilities.
 *
 * @remarks
 * Separate from {@link ExpeditionCapabilityId} on purpose: a capability is
 * bought with Tokens and is permanently on, while a Legendary is earned by a
 * Finale and changes one rule once per run. Sharing the union would let an
 * unlock set sell one.
 */
export type ExpeditionLegendaryId =
  'safe_harbor' | 'the_fixer' | 'nemesis_key' | 'ghost_route' | 'salvage_rights'

/**
 * The Between-Tour decision families, in the priority order they are chosen.
 */
export type BetweenTourDecisionType =
  | 'sponsor_advance'
  | 'injury_rehab'
  | 'crew_debrief'
  | 'rival_response'
  | 'sponsor_follow_up'
  | 'vehicle_repair'
  | 'network_contact'

/**
 * The actor one decision is about.
 *
 * @remarks
 * Stored with the decision rather than re-derived at resolve time: the state
 * the target was chosen from is gone by then - the run's outcome is cleared,
 * the injury may have been resolved by another decision - so a resolve that
 * re-derived would silently act on a different actor.
 */
export type BetweenTourTarget =
  | { kind: 'crew'; id: string }
  | { kind: 'band'; id: string }
  | { kind: 'rival'; id: string }
  | { kind: 'sponsor'; id: string }
  | { kind: 'vehicle'; id: 'active_van' }
  | { kind: 'archive'; id: string }

/** One generated decision, with the options it actually offers. */
export interface BetweenTourDecisionInstance {
  id: string
  type: BetweenTourDecisionType
  target: BetweenTourTarget
  optionIds: string[]
}

/**
 * An advance a Sponsor paid against a Career that could not fund its next Tour.
 *
 * @remarks
 * Single-slot: a Career carries at most one outstanding advance, so a run of
 * bad Tours cannot compound into an unrepayable stack. It is repaid out of the
 * next settlement that actually retains money, which is why the debt is stored
 * rather than deducted immediately - a failed run has nothing to take it from.
 */
export interface ExpeditionSponsorAdvance {
  dealId: string
  amount: number
  outstanding: number
  takenAfterRunId: string
}

/** Every Between-Tour decision one finalized run generated, and its answers. */
export interface BetweenTourRunState {
  runId: string
  decisions: BetweenTourDecisionInstance[]
  resolvedOptionByDecisionId: Record<string, string>
}

/**
 * A preference one Between-Tour decision leaves for the next Tour.
 *
 * @remarks
 * Bounded and single-slot on purpose: the decision is a lean, not a purchase,
 * so it cannot accumulate across Tours into permanent power.
 */
export interface BetweenTourNextTourPreferences {
  rival: { rivalId: string; stance: 'confront' | 'cool_down' } | null
  sponsor: { dealId: string; bias: 1 | -1 } | null
}

/**
 * The Tour Archive's categories.
 *
 * @remarks
 * A record of what the Career has met. The Archive holds no authority: it
 * never grants a capability and never gates a completion, so nothing reads it
 * to decide what a Career may do.
 */
export type ExpeditionArchiveCategory =
  | 'crew'
  | 'module'
  | 'chassis'
  | 'rival'
  | 'sponsor'
  | 'region'
  | 'finale'
  | 'special_event'
  | 'contraband'

/**
 * One unlock set: what it costs, what it needs, and what it is worth.
 */
export interface ExpeditionUnlockSetDefinition {
  id: ExpeditionUnlockSetId
  cost: number
  requiredRank: ExpeditionCareerRank
  requiredFacility: {
    id: ExpeditionHqFacilityId
    level: ExpeditionHqFacilityLevel
  }
  capabilities: readonly ExpeditionCapabilityId[]
}

/**
 * A debited-but-not-yet-granted unlock purchase.
 *
 * @remarks
 * The journal entry that makes the purchase crash-safe. Tokens are debited
 * when it is written, so a process that dies before the set is granted leaves
 * evidence of exactly what was taken and what it was for - which is what lets
 * the load path settle it rather than silently losing the balance.
 */
export interface ExpeditionPendingUnlockPurchase {
  setId: ExpeditionUnlockSetId
  debitedTokens: number
}

export interface CareerState {
  crewById: Record<string, CrewCareerState>
  expeditionRelationshipByPair: Record<string, ExpeditionRelationshipTier>
  crewRecoveryDebtById: Record<string, CrewRecoveryDebt>
  settledCrewRunIds: string[]
  rivalsById: Record<string, CareerRivalRecord>
  betweenTourByRunId: Record<string, BetweenTourRunState>
  sponsorAdvance: ExpeditionSponsorAdvance | null
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
  unlockedSetIds: string[]
  pendingUnlockPurchase: ExpeditionPendingUnlockPurchase | null
  ascensionUnlocked: boolean
  /** Legendaries the Career owns, each earned by one finalized Finale. */
  legendaryIds: ExpeditionLegendaryId[]
  /**
   * Runs that have already claimed a Legendary.
   *
   * @remarks
   * Run-scoped, like `settledExpeditionRunIds`: a run earns at most one
   * Legendary, and the claim has to be provable against the run rather than
   * against the owned list, which cannot tell a second claim from the first.
   */
  legendaryClaimedRunIds: string[]
  /**
   * Everything the Career has met, by category.
   *
   * @remarks
   * Discovery only. Every entry is canonical and carries a source proof the
   * reducer checked against what the run was actually observing, so the log
   * cannot be used to assert something the Career never encountered - but
   * nothing consults it for permission either.
   */
  archiveByCategory: Record<ExpeditionArchiveCategory, string[]>
  /**
   * Band consequences that outlive the run that caused them.
   *
   * @remarks
   * The run's own `bandInjuryByMemberId` is cleared by
   * `PREPARE_NEXT_EXPEDITION`, so a consequence a Between-Tour decision is
   * meant to treat has to be carried into the Career at settlement or there is
   * nothing left to treat.
   */
  bandConsequenceByMemberId: Record<string, ExpeditionBandInjuryStage>
  /** What the last Between-Tour decisions left for the next Tour. */
  nextTourPreferences: BetweenTourNextTourPreferences
}
