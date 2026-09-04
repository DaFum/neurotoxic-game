import type { MapNode } from './map'

/**
 * Lifecycle phase of the Expedition run.
 *
 * @remarks
 * `idle` is the only status a fresh PREPARE is accepted from, and the terminal
 * statuses (`extracted`, `completed`, `failed`) are only reachable through the
 * reducer-authoritative terminal actions.
 */
export type ExpeditionStatus =
  'idle' | 'prepared' | 'active' | 'extracted' | 'completed' | 'failed'

/**
 * Identity of the prepared-but-not-started run.
 *
 * @remarks
 * The prepared `prepId` becomes the run's `runId` at START, so reward-ledger
 * entries and Career settlements stay keyed by one stable id across the run.
 */
export interface ExpeditionPrepState {
  prepId: string
}

/**
 * Fog-of-war detail level for one Expedition map node.
 *
 * `0` shows only the always-visible route facts, `1` adds the exact numeric
 * cost/payout band, `2` adds the hidden event/rival/authority identity.
 */
export type NodeIntelLevel = 0 | 1 | 2

/**
 * Source that entitles one node-intel reveal.
 *
 * @remarks
 * `social_grant`/`contact_grant` require a matching {@link ExpeditionIntelGrant}
 * produced by a canonical just-resolved Social/Contact result (G3/G4). The
 * remaining sources are entitled by run state alone.
 */
export type ExpeditionIntelSource =
  | 'scout_passive'
  | 'scout_recon'
  | 'perk_floor'
  | 'social_grant'
  | 'contact_grant'

/**
 * One consumable entitlement to raise a node's intel level.
 *
 * @remarks
 * `sourceProofId` is the id of the canonical just-resolved Social/Contact
 * result that produced the grant; the reducer rejects a grant whose proof is
 * missing so intel cannot be minted by a forged dispatch.
 */
export interface ExpeditionIntelGrant {
  id: string
  source: 'social' | 'contact'
  sourceProofId: string
  nodeId: string
  targetLevel: 1 | 2
  consumed: boolean
}

/**
 * Run-only activation selection over already-owned catalog performance gear.
 *
 * @remarks
 * Selecting an item never mutates persistent HQ ownership; it only decides
 * which owned items contribute Expedition gig modifiers and consume technical
 * cargo capacity.
 */
export interface ExpeditionEquipmentCommitment {
  selectedGearItemIds: string[]
}

/**
 * One committed merch stack drawn from owned `band.inventory` quantities.
 */
export interface ExpeditionMerchSelection {
  inventoryKey: string
  quantity: number
}

/**
 * One committed contraband stack drawn from the owned `band.stash`.
 */
export interface ExpeditionContrabandSelection {
  stashKey: string
  instanceId: string | null
  stacks: number
}

/**
 * One committed native Contract, optionally bound to a prepared-map target.
 */
export interface ExpeditionNativeContractCommitment {
  templateId: string
  targetNodeId: string | null
}

/**
 * The constrained full build the player commits before the tour starts.
 */
export interface ExpeditionBuildCommitment {
  setlistSongIds: string[]
  equipment: ExpeditionEquipmentCommitment
  selectedTourbusModuleIds: string[]
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  sponsorOfferId: string | null
  startingFuelTarget: number
  protectedCareerCash: number
}

/**
 * Immutable run commitment stored for the whole Expedition.
 */
export interface ExpeditionLoadout {
  tourTypeId: string
  regionId: string
  activeTourbusAssetId: string | null
  crewIds: string[]
  cargo: { spareParts: number; supplies: number }
  starterPerkId: string | null
  nativeContracts: ExpeditionNativeContractCommitment[]
  insurancePolicyId: string | null
  pressureModifierIds: string[]
  build: ExpeditionBuildCommitment
}

/**
 * Reason a build candidate was rejected by the canonical validator.
 */
export type ExpeditionBuildRejectionReason =
  | 'MALFORMED_CANDIDATE'
  | 'SETLIST_EMPTY'
  | 'SETLIST_DUPLICATE'
  | 'SETLIST_UNKNOWN_SONG'
  | 'EQUIPMENT_TOO_MANY_ITEMS'
  | 'EQUIPMENT_DUPLICATE'
  | 'EQUIPMENT_UNKNOWN_ITEM'
  | 'EQUIPMENT_NOT_OWNED'
  | 'MODULES_DRIFT'
  | 'MERCH_NOT_OWNED'
  | 'CONTRABAND_NOT_OWNED'
  | 'SPONSOR_OFFER_UNKNOWN'
  | 'NATIVE_CONTRACT_INVALID'
  | 'FUEL_TARGET_OUT_OF_RANGE'
  | 'PROTECTED_CASH_OUT_OF_RANGE'
  | 'TOUR_OR_REGION_UNKNOWN'
  | 'CREW_DUPLICATE'
  | 'CARGO_OUT_OF_RANGE'
  | 'PRESSURE_MODIFIERS_INVALID'

/**
 * Result of validating a candidate {@link ExpeditionLoadout}.
 *
 * @remarks
 * The normalized loadout is what the reducer stores, so a caller cannot smuggle
 * extra keys or unsorted selections into committed run identity.
 */
export type ExpeditionBuildValidation =
  | { valid: true; normalized: ExpeditionLoadout }
  | { valid: false; reason: ExpeditionBuildRejectionReason }

/**
 * Coarse route class of one Expedition map node.
 */
export type ExpeditionNodeClass =
  | 'START'
  | 'CLUB_GIG'
  | 'FESTIVAL'
  | 'SUPPLY_STOP'
  | 'REST_STOP'
  | 'SPECIAL'
  | 'FINALE'

/**
 * Sub-classification for `SPECIAL` nodes.
 */
export type ExpeditionSpecialNodeSubtype =
  'RIVAL_ENCOUNTER' | 'UNDERGROUND_MARKET' | 'BLACK_MARKET'

/**
 * Always-visible coarse danger/reward band for one node.
 */
export type ExpeditionTier = 'low' | 'moderate' | 'high'

/**
 * Route-shaping inputs supplied by the Region/Tour profile.
 *
 * @remarks
 * G1 baseline passes neutral weights; G5 owns the typed Region/Tour profile
 * that replaces them without changing this contract.
 */
export interface ExpeditionRouteProfile {
  meaningfulNodeCount: number
  specialWeight: number
  festivalWeight: number
  restWeight: number
  supplyWeight: number
  undergroundAllowed: boolean
  rivalAllowed: boolean
}

/**
 * Intel-gated detail for one Expedition node.
 *
 * @remarks
 * These fields are deterministic from the root run seed but are only surfaced
 * to the player once the node's intel level is high enough, which is what makes
 * information a build resource rather than a free readout.
 */
export interface ExpeditionNodeHiddenDetail {
  exactPayout: number
  exactWearCost: number
  eventId: string | null
  rivalId: string | null
  authorityRisk: number
  hiddenOpportunityId: string | null
  /**
   * Rare reward this node yields on arrival, or `null`.
   *
   * @remarks
   * Deterministic from the run seed and intel-gated like every other hidden
   * field, so scouting a node tells the player whether the greed is worth it.
   */
  rareRewardId: string | null
}

/**
 * Always-visible plus intel-gated metadata for one Expedition node.
 */
export interface ExpeditionNodeMeta {
  nodeId: string
  routeStep: number
  nodeClass: ExpeditionNodeClass
  specialSubtype: ExpeditionSpecialNodeSubtype | null
  dangerTier: ExpeditionTier
  rewardTier: ExpeditionTier
  isMeaningful: boolean
  isExtractionWindow: boolean
  hidden: ExpeditionNodeHiddenDetail
}

/**
 * The one deterministic Expedition route, shared by Tour Prep preview and play.
 */
export interface ExpeditionMap {
  /** Stable structural identity used by the START transaction's parity check. */
  mapHash: string
  tourTypeId: string
  regionId: string
  runSeed: number
  startNodeId: string
  finaleNodeId: string
  nodes: Record<string, MapNode>
  connections: Array<{ from: string; to: string }>
  meta: Record<string, ExpeditionNodeMeta>
  nodeOrder: string[]
}

/**
 * Canonical source families that may produce a rare Expedition reward.
 */
export type ExpeditionRewardSourceType =
  | 'route_rare'
  | 'event_rare'
  | 'contract'
  | 'crew_contact'
  | 'finale_nonlegendary'

/**
 * Owner that materializes a reward after terminal settlement succeeds.
 */
export type ExpeditionRewardMaterializationOwner =
  'unlock' | 'career' | 'inventory'

/**
 * Registry definition for one real v1 Expedition reward.
 */
export interface ExpeditionRewardDefinition {
  id: string
  sourceType: ExpeditionRewardSourceType
  owner: ExpeditionRewardMaterializationOwner
  /** Target the owner materializes: unlock id, career marker, or inventory key. */
  target: string
  /** Quantity applied for `inventory`/`career` owners. */
  amount: number
  /** Only meaningful for `finale_nonlegendary`, whose security is definition-owned. */
  securedOnEarn: boolean
}

/**
 * One earned rare reward, pending or settled.
 */
export interface ExpeditionRewardLedgerEntry {
  id: string
  rewardDefinitionId: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  secured: boolean
  earnedAtRouteStep: number
  materialized: boolean
}

/**
 * Failure families that can terminate an Expedition run.
 *
 * @remarks
 * G1A owns `bankruptcy` and `fuel_stranded`; G2/G3/G4 export the remaining
 * signals into this same single terminal owner.
 */
export type ExpeditionFailureReason =
  | 'bankruptcy'
  | 'fuel_stranded'
  | 'technical_shutdown'
  | 'crew_collapse'
  | 'authority_crisis'
  | 'critical_contract_breach'

/**
 * Legal responses a failure crisis may expose.
 */
export type ExpeditionFailureChoiceId =
  'refuel' | 'tow' | 'extract' | 'accept_failure'

/**
 * A raised, not-yet-terminal failure crisis with its legal recovery choices.
 *
 * @remarks
 * The design forbids a single opaque roll ending a run, so a crisis always
 * carries at least one legal choice and is derived from visible run state.
 */
export interface PendingExpeditionFailure {
  id: string
  reason: ExpeditionFailureReason
  sourceId: string
  raisedAtRouteStep: number
  choices: ExpeditionFailureChoiceId[]
}

/**
 * Signal shape later gates export into the one G1-owned failure composer.
 */
export interface ExpeditionFailureSignal {
  reason: ExpeditionFailureReason
  sourceId: string
  choices: ExpeditionFailureChoiceId[]
}

/**
 * Finalized economic outcome of one terminal Expedition transition.
 */
export interface ExpeditionSettlement {
  retentionRate: number
  moneyEarned: number
  moneyRetained: number
  moneyForfeited: number
  fameEarned: number
  fameRetained: number
  fameForfeited: number
  retainedRewardEntryIds: string[]
  abandonedRewardEntryIds: string[]
}

/**
 * Finalized terminal record for one run.
 */
export interface ExpeditionOutcome {
  runId: string
  kind: 'extracted' | 'completed' | 'failed'
  reason: ExpeditionFailureReason | null
  finalizedAtRouteStep: number
  settlement: ExpeditionSettlement
  finaleResultId: string | null
}

/**
 * Run-scoped Expedition orchestration state.
 *
 * @remarks
 * This slice stores orchestration, immutable run commitments, Intel/reward and
 * failure evidence, and the finalized outcome only. `player`, `band`, assets,
 * Social and the root `GameState.runSeed` remain the canonical owners of
 * everything else.
 */
export interface ExpeditionState {
  status: ExpeditionStatus
  prep: ExpeditionPrepState | null
  runId: string | null
  routeStep: number
  visitedNodeIds: string[]
  intelByNodeId: Record<string, NodeIntelLevel>
  intelGrants: ExpeditionIntelGrant[]
  scoutReconUsedRouteSteps: number[]
  loadout: ExpeditionLoadout | null
  startingMoney: number
  startingFame: number
  protectedCareerCash: number
  rewardLedger: ExpeditionRewardLedgerEntry[]
  extractionWindowsSeen: number[]
  pendingFailure: PendingExpeditionFailure | null
  outcome: ExpeditionOutcome | null
  cargo?: ExpeditionCargoState | null
  technicalCondition?: ExpeditionTechnicalCondition | null
}

/**
 * Physical equipment groups tracked by Expedition technical condition.
 */
export type ConditionGroup = 'pa' | 'instruments' | 'stageGear'

/**
 * Lifecycle status of a hidden technical defect.
 */
export type HiddenDefectStatus =
  'hidden' | 'revealed' | 'triggered' | 'resolved'

/**
 * Triggers that can activate a hidden technical defect during tour progression.
 */
export type HiddenDefectTrigger = 'post_travel' | 'pre_gig' | 'post_gig'

/**
 * State representing an undiscovered or revealed defect on tour equipment.
 */
export interface HiddenDefectState {
  id: string
  group: ConditionGroup
  severity: 1 | 2 | 3
  status: HiddenDefectStatus
  source: 'field_repair' | 'improvise' | 'critical_wear'
  createdAtRouteStep: number
  triggerAt: HiddenDefectTrigger
  triggerRouteStep: number
}

/**
 * Technical condition of the band's equipment during an Expedition.
 */
export interface ExpeditionTechnicalCondition {
  pa: number
  instruments: number
  stageGear: number
  defects: HiddenDefectState[]
}

/**
 * Canonical performance profile modifiers derived from technical condition.
 */
export interface ExpeditionConditionPerformanceProfile {
  audioHazardLevel: number
  timingMultiplier: number
  missStaminaMultiplier: number
  comboRecoveryMultiplier: number
  disabledGroups: ConditionGroup[]
}

/**
 * Manifest representing the real physical items carried in the vehicle cargo.
 */
export interface ExpeditionCargoState {
  spareParts: number
  supplies: number
  technicalGearItemIds: string[]
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
}

/**
 * Breakdown of visible and hidden cargo capacities and slot usage.
 */
export interface ExpeditionCargoCapacity {
  visibleCapacity: number
  hiddenCapacity: number
  visibleSlotsUsed: number
  hiddenSlotsUsed: number
  availableVisibleSlots: number
  availableHiddenSlots: number
}

/**
 * Unified view of active cargo state combined with capacity breakdown.
 */
export interface ExpeditionCargoView
  extends ExpeditionCargoState, ExpeditionCargoCapacity {}

/**
 * Chassis archetypes for Expedition runs.
 */
export type ExpeditionChassisArchetype =
  'compact' | 'diy' | 'coach' | 'armored_hauler'

/**
 * Profile defining mechanical adjustments for a chassis archetype.
 */
export interface ExpeditionChassisProfile {
  archetype: ExpeditionChassisArchetype
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  cargoCapacityBonus: number
  fieldRepairEfficiency: number
  crewStressMultiplier: number
  authorityEventWeightMultiplier: number
  hiddenContrabandCapacity: number
}

/**
 * Profile defining mechanical adjustments provided by an installed vehicle module.
 */
export interface ExpeditionVehicleModuleProfile {
  cargoCapacityBonus: number
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  inspectionLevel: 0 | 1 | 2
  authorityIntelBonus: 0 | 1
  hiddenContrabandCapacity: number
  restStressRecoveryBonus: number
}

/**
 * Numeric tuning rules resolved for the current Expedition.
 */
export interface ExpeditionNumericRules {
  startingSpareParts: number
  startingHeat: number
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  technicalWearMultiplier: number
  repairCostMultiplier: number
  fieldRepairEfficiency: number
  gigRewardMultiplier: number
  contractRewardMultiplier: number
  contractPenaltyMultiplier: number
  pressureRewardMultiplier: number
  heatGainMultiplier: number
  exposureGainMultiplier: number
  crewStressMultiplier: number
  extractionRetentionMultiplier: number
  rareRewardMultiplier: number
  completionMultiplier: number
  rivalEventWeightMultiplier: number
  authorityEventWeightMultiplier: number
  rivalRewardMultiplier: number
  finaleRewardMultiplier: number
  nodeIntelFloor: 0 | 1 | 2
  explicitExtractionRareCarrySlots: number
}

/**
 * Discrete rule flags resolved for the current Expedition.
 */
export interface ExpeditionRuleFlags {
  fieldRepairNoHiddenDefect: boolean
  fieldRepairMinimumCondition: number
  severeReliefBypass: boolean
}

/**
 * Complete composable effective rules governing the active Expedition.
 */
export interface EffectiveExpeditionRules {
  numeric: ExpeditionNumericRules
  flags: ExpeditionRuleFlags
  legendary: Record<string, boolean>
}
