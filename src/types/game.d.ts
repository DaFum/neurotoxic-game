import type { ActionTypes, ActionType } from '../context/actionTypes'
import type { RhythmSetlistEntry } from './rhythmGame'
import type { GAME_PHASES } from '../context/gameConstants'
import type { UpdateSocialPayload } from './social'
import type { PurchaseItem } from './components'
import type { AssetKind, RiskEventDescriptor } from './assets'
import type {
  ActiveQuestState,
  QuestCooldown,
  QuestScopeCompletion,
  QuestState
} from './quest'
import type {
  BloodBankDonatePayload,
  ClinicActionPayload,
  CompleteTravelMinigamePayload,
  CultIndoctrinationPayload,
  DarkWebLeakPayload,
  EventDeltaPayload,
  MerchPressPayload,
  MoveRivalBandPayload,
  PirateBroadcastPayload,
  PopPendingEventPayload,
  ResetStatePayload,
  SpawnRivalBandPayload,
  TradeVoidItemPayload,
  UpdateBandPayload,
  UpdatePlayerPayload
} from './actions'
import type { PlayerState } from './player'
import type { BandState } from './band'
import type { RivalBandState, SocialState } from './social'
import type { GameMap, Venue } from './map'
import type { GigModifiers, PostGigSummary } from './gig'
import type { GameEvent } from './events'

/**
 * Relationship delta between two band members.
 */
export type RelationshipChange = {
  member1: string
  member2: string
  change: number
  source?: string
  timestamp?: number
}

/**
 * Scene identifiers that can be stored in game state.
 */
export type GamePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES]
/**
 * Item rarity labels used by inventory and catalog data.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'

/**
 * Player-controlled settings that survive save/load and reset flows.
 */
export interface GameSettings {
  crtEnabled: boolean
  tutorialSeen: boolean
  logLevel: number
}

/**
 * Object record used at untrusted or loosely typed boundaries.
 */
export type UnknownRecord = Record<string, unknown>
/**
 * Untrusted settings payload loaded from storage.
 */
export type RawGameSettings = Partial<Record<keyof GameSettings, unknown>>

/**
 * Minimal persisted stash metadata for one contraband item type.
 */
export type StashEntry = {
  stacks?: number | null
}

/**
 * City-level modifiers that affect demand and local behavior.
 */
export interface CityTraitState {
  genreBias: string
  attentionSpan: number
  barSpendingProfile: string
}

/**
 * Identifiers for active overlay minigames.
 */
export type MinigameType =
  'TOURBUS' | 'ROADIE' | 'KABELSALAT' | 'AMP_CALIBRATION'

/**
 * Persisted state for the currently active minigame overlay.
 */
export interface MinigameState {
  type?: MinigameType | null
  isActive?: boolean
  targetNodeId?: string | null
  active?: boolean
  targetDestination?: unknown
  gigId?: string | null
  equipmentRemaining?: number
  accumulatedDamage?: number
  score?: number
  roadie?: UnknownRecord
  amp?: UnknownRecord
  travel?: UnknownRecord
  [key: string]: unknown
}

/**
 * Toast notification payload stored in game state.
 *
 * @remarks
 * `message` is a pre-baked display string. `messageKey` plus `options` defers
 * formatting through i18n; currency options should already be localized before
 * dispatch when reducers/action creators bake toast text.
 */
export interface ToastPayload {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message?: unknown
  messageKey?: string
  options?: Record<string, unknown>
  /** Display duration in ms; kept by `sanitizeLoadedToast` when finite and non-negative. */
  timeout?: number
  /** Creation timestamp; kept by `sanitizeLoadedToast` when finite. */
  createdAt?: number
}

/**
 * Top-level persisted and runtime game state.
 */
export interface GameState {
  version: number
  currentScene: GamePhase
  player: PlayerState
  band: BandState
  rivalBand: RivalBandState | null
  social: SocialState
  gameMap: GameMap | null
  currentGig: Venue | null
  setlist: RhythmSetlistEntry[]
  lastGigStats: PostGigSummary | null
  activeEvent: GameEvent | null
  pendingEvents: string[]
  isScreenshotMode: boolean
  toasts: ToastPayload[]
  activeStoryFlags: string[]
  eventCooldowns: string[]
  venueBlacklist: string[]
  activeQuests: ActiveQuestState[]
  questCooldowns: QuestCooldown[]
  completedQuestIds: string[]
  completedQuestScopes: QuestScopeCompletion[]
  reputationByRegion: Record<string, number>
  gigContextSnapshot?: {
    reputationByRegionAtStart?: Record<string, number>
  }
  settings: GameSettings
  gigModifiers: GigModifiers
  /** Cumulative raw score adjustment emitted by events during the active gig. */
  gigEventScoreDelta: number
  minigame: MinigameState
  unlocks: string[]
  pendingBandHQOpen: boolean
  pendingSupplyStopInventory: PurchaseItem[] | null
  pendingForeclosureNotices: AssetKind[]
  pendingRiskEvent: RiskEventDescriptor | null
  completedMilestones: string[]
  // Long-term asset system (see docs/superpowers/specs/2026-05-24-long-term-assets-design.md)
  assets: import('./assets').LongTermAsset[]
  liabilities: Record<string, import('./assets').Liability>
  crowdfundCampaigns: import('./assets').CrowdfundCampaign[]
  /**
   * Persisted seed for deterministic asset-tick RNG. Action creators (notably
   * `advanceDay`) read this to pre-roll a `dayRngStream` for the reducer.
   */
  rngSeed: number
  /**
   * Stable per-run seed for map generation. Generated once at run creation and
   * persisted with the save, so any reported run reproduces the same map.
   * Consumed by `useMapGeneration`; unlike `rngSeed` it never rotates.
   */
  runSeed: number
  /**
   * Run-scoped Roguelite Expedition orchestration state. Stores run identity,
   * the immutable committed build, Intel/reward/failure evidence and the
   * finalized outcome only; it deliberately carries no seed of its own so
   * `runSeed` above stays the single map/run seed owner.
   */
  expedition: import('./expedition').ExpeditionState
  career: import('./career').CareerState
}

/**
 * Untrusted game-save payload loaded from storage.
 */
export type RawLoadedGame = UnknownRecord

/**
 * Generic action envelope used by reducer action unions.
 *
 * @remarks
 * When `TPayload` is `undefined`, the action has no `payload` key. Otherwise
 * the payload key is required and carries the supplied shape. The check is
 * non-distributive, so a union payload stays one action whose payload is the
 * union rather than splitting into one action per member.
 *
 * @typeParam TType - Concrete action type discriminant.
 * @typeParam TPayload - Payload shape for actions that carry data.
 */
export type Action<TType extends ActionType, TPayload = undefined> = [
  TPayload
] extends [undefined]
  ? { type: TType }
  : { type: TType; payload: TPayload }

/**
 * Complete set of reducer actions accepted by the game-state reducer.
 */
export type GameAction =
  | Action<(typeof ActionTypes)['CHANGE_SCENE'], GamePhase>
  | Action<(typeof ActionTypes)['UPDATE_PLAYER'], UpdatePlayerPayload>
  | Action<
      (typeof ActionTypes)['TOGGLE_NEURO_DECIMATOR'],
      { isActive: boolean }
    >
  | Action<(typeof ActionTypes)['UPDATE_BAND'], UpdateBandPayload>
  | Action<(typeof ActionTypes)['SETTLE_SOLD_MERCH'], Record<string, number>>
  | Action<(typeof ActionTypes)['UPDATE_SOCIAL'], UpdateSocialPayload>
  | Action<(typeof ActionTypes)['UPDATE_SETTINGS'], UnknownRecord>
  | Action<(typeof ActionTypes)['SET_MAP'], GameMap | null>
  | Action<(typeof ActionTypes)['SET_GIG'], Venue | null>
  | Action<(typeof ActionTypes)['START_GIG'], Venue>
  | Action<(typeof ActionTypes)['SET_SETLIST'], RhythmSetlistEntry[]>
  | Action<(typeof ActionTypes)['SET_LAST_GIG_STATS'], PostGigSummary | null>
  | Action<(typeof ActionTypes)['SET_ACTIVE_EVENT'], GameEvent | null>
  | Action<(typeof ActionTypes)['SET_SCREENSHOT_MODE'], boolean>
  | Action<(typeof ActionTypes)['ADD_TOAST'], ToastPayload>
  | Action<(typeof ActionTypes)['REMOVE_TOAST'], string>
  | Action<
      (typeof ActionTypes)['SET_GIG_MODIFIERS'],
      Partial<GigModifiers> | ((prev: GigModifiers) => Partial<GigModifiers>)
    >
  | Action<(typeof ActionTypes)['LOAD_GAME'], RawLoadedGame>
  | Action<(typeof ActionTypes)['RESET_STATE'], ResetStatePayload>
  | Action<(typeof ActionTypes)['APPLY_EVENT_DELTA'], EventDeltaPayload>
  | Action<(typeof ActionTypes)['POP_PENDING_EVENT']>
  | Action<(typeof ActionTypes)['POP_PENDING_EVENT'], PopPendingEventPayload>
  | Action<(typeof ActionTypes)['CONSUME_ITEM'], string>
  | Action<
      (typeof ActionTypes)['ADVANCE_DAY'],
      { dayRngStream: number[]; nextRngSeed: number }
    >
  | Action<(typeof ActionTypes)['ADD_COOLDOWN'], string>
  | Action<
      (typeof ActionTypes)['START_TRAVEL_MINIGAME'],
      { targetNodeId: string }
    >
  | Action<
      (typeof ActionTypes)['COMPLETE_TRAVEL_MINIGAME'],
      CompleteTravelMinigamePayload
    >
  | Action<(typeof ActionTypes)['START_ROADIE_MINIGAME'], { gigId: string }>
  | Action<
      (typeof ActionTypes)['COMPLETE_ROADIE_MINIGAME'],
      {
        equipmentDamage: number
        contrabandDelivered?: number
        deliveredStashItemId?: string
      }
    >
  | Action<(typeof ActionTypes)['START_KABELSALAT_MINIGAME'], { gigId: string }>
  | Action<
      (typeof ActionTypes)['COMPLETE_KABELSALAT_MINIGAME'],
      { results: unknown }
    >
  | Action<(typeof ActionTypes)['START_AMP_CALIBRATION'], { gigId: string }>
  | Action<
      (typeof ActionTypes)['COMPLETE_AMP_CALIBRATION'],
      {
        score: number
        voidResonance: number
        purgesUsed: number
        hijacksOverridden: number
        feedbackLoopsDampened?: number
      }
    >
  | Action<(typeof ActionTypes)['SPAWN_RIVAL_BAND'], SpawnRivalBandPayload>
  | Action<(typeof ActionTypes)['MOVE_RIVAL_BAND'], MoveRivalBandPayload>
  | Action<(typeof ActionTypes)['UPDATE_RIVAL_BAND'], Partial<RivalBandState>>
  | Action<(typeof ActionTypes)['CHECK_RIVAL_ENCOUNTER']>
  | Action<
      (typeof ActionTypes)['UNLOCK_TRAIT'],
      { memberId: string; traitId: string }
    >
  | Action<
      (typeof ActionTypes)['UNBLACKLIST_VENUE'],
      { venueId: string; toastId: string }
    >
  | Action<
      (typeof ActionTypes)['CRAFT_ITEM'],
      { recipeId: string; instanceId: string; toastId: string }
    >
  | Action<(typeof ActionTypes)['ADD_QUEST'], QuestState>
  | Action<
      (typeof ActionTypes)['ADVANCE_QUEST'],
      { questId: string; amount: number; randomIdx?: number }
    >
  | Action<
      (typeof ActionTypes)['APPLY_QUEST_EVENT'],
      import('../utils/questProgress').QuestProgressEvent
    >
  | Action<(typeof ActionTypes)['ADD_UNLOCK'], string>
  | Action<
      (typeof ActionTypes)['USE_CONTRABAND'],
      { instanceId: string; contrabandId: string; memberId?: string }
    >
  | Action<(typeof ActionTypes)['CLINIC_HEAL'], ClinicActionPayload>
  | Action<(typeof ActionTypes)['CLINIC_ENHANCE'], ClinicActionPayload>
  | Action<(typeof ActionTypes)['GRAFT_NEURO_OVERCLOCK'], { memberId: string }>
  | Action<(typeof ActionTypes)['PIRATE_BROADCAST'], PirateBroadcastPayload>
  | Action<(typeof ActionTypes)['MERCH_PRESS'], MerchPressPayload>
  | Action<(typeof ActionTypes)['TRADE_VOID_ITEM'], TradeVoidItemPayload>
  | Action<(typeof ActionTypes)['BLOOD_BANK_DONATE'], BloodBankDonatePayload>
  | Action<(typeof ActionTypes)['DARK_WEB_LEAK'], DarkWebLeakPayload>
  | Action<
      (typeof ActionTypes)['CULT_INDOCTRINATION'],
      CultIndoctrinationPayload
    >
  | Action<(typeof ActionTypes)['SET_PENDING_BANDHQ_OPEN'], boolean>
  | Action<
      (typeof ActionTypes)['SET_PENDING_SUPPLY_STOP_INVENTORY'],
      PurchaseItem[] | null
    >
  | Action<
      (typeof ActionTypes)['DISMISS_FORECLOSURE_NOTICE'],
      { kind: AssetKind }
    >
  | Action<
      (typeof ActionTypes)['SET_PENDING_RISK_EVENT'],
      RiskEventDescriptor | null
    >
  // Long-term assets (Plan 1)
  | Action<
      (typeof ActionTypes)['PURCHASE_CHASSIS'],
      import('./assets').PurchaseChassisPayload
    >
  | Action<
      (typeof ActionTypes)['PURCHASE_CHASSIS_FAILED'],
      { reason: import('./assets').PurchaseFailureReason }
    >
  | Action<
      (typeof ActionTypes)['UPGRADE_CHASSIS_TIER'],
      import('./assets').UpgradeChassisTierPayload
    >
  | Action<
      (typeof ActionTypes)['UPGRADE_CHASSIS_TIER_FAILED'],
      { reason: import('./assets').UpgradeFailureReason }
    >
  | Action<(typeof ActionTypes)['SELL_CHASSIS'], { assetId: string }>
  | Action<
      (typeof ActionTypes)['SELL_CHASSIS_FAILED'],
      { assetId: string; reason: 'LIABILITY_EXCEEDS_VALUE' }
    >
  | Action<(typeof ActionTypes)['REPAIR_CHASSIS'], { assetId: string }>
  | Action<
      (typeof ActionTypes)['REPAIR_CHASSIS_FAILED'],
      { reason: import('./assets').RepairFailureReason }
    >
  | Action<
      (typeof ActionTypes)['REFINANCE_LIABILITY'],
      import('./assets').RefinanceLiabilityPayload
    >
  | Action<
      (typeof ActionTypes)['REFINANCE_LIABILITY_FAILED'],
      { reason: import('./assets').RefinanceFailureReason }
    >
  | Action<
      (typeof ActionTypes)['INSTALL_MODULE'],
      import('./assets').InstallModulePayload
    >
  | Action<
      (typeof ActionTypes)['INSTALL_MODULE_FAILED'],
      { reason: import('./assets').InstallModuleFailureReason }
    >
  | Action<
      (typeof ActionTypes)['REMOVE_MODULE'],
      { assetId: string; slotId: string }
    >
  | Action<
      (typeof ActionTypes)['START_CROWDFUND'],
      { campaign: import('./assets').CrowdfundCampaign }
    >
  | Action<
      (typeof ActionTypes)['START_CROWDFUND_FAILED'],
      { reason: import('./assets').StartCrowdfundFailureReason }
    >
  | Action<(typeof ActionTypes)['ASSET_FORECLOSED'], { assetId: string }>
  // Roguelite Expedition (G1)
  | Action<
      (typeof ActionTypes)['PREPARE_EXPEDITION_RUN'],
      import('./actions').PrepareExpeditionRunPayload
    >
  | Action<
      (typeof ActionTypes)['PREPARE_EXPEDITION_SPONSOR_OFFERS'],
      import('./actions').PrepareExpeditionSponsorOffersPayload
    >
  | Action<
      (typeof ActionTypes)['START_EXPEDITION'],
      import('./actions').StartExpeditionPayload
    >
  | Action<
      (typeof ActionTypes)['ADVANCE_EXPEDITION_ROUTE'],
      import('./actions').AdvanceExpeditionRoutePayload
    >
  | Action<
      (typeof ActionTypes)['REVEAL_EXPEDITION_NODE_INTEL'],
      import('./actions').RevealExpeditionNodeIntelPayload
    >
  | Action<
      (typeof ActionTypes)['ADD_EXPEDITION_REWARD'],
      import('./actions').AddExpeditionRewardPayload
    >
  | Action<
      (typeof ActionTypes)['EXTRACT_EXPEDITION'],
      import('./actions').ExtractExpeditionPayload
    >
  | Action<
      (typeof ActionTypes)['COMPLETE_EXPEDITION'],
      import('./actions').CompleteExpeditionPayload
    >
  | Action<
      (typeof ActionTypes)['ACCEPT_EXPEDITION_FAILURE'],
      import('./actions').AcceptExpeditionFailurePayload
    >
  | Action<
      (typeof ActionTypes)['PREPARE_NEXT_EXPEDITION'],
      import('./actions').PrepareNextExpeditionPayload
    >
  | Action<
      (typeof ActionTypes)['RESOLVE_EXPEDITION_CRISIS'],
      import('./actions').ResolveExpeditionCrisisPayload
    >
  | Action<
      (typeof ActionTypes)['EXECUTE_EXPEDITION_REPAIR'],
      import('./actions').ExecuteExpeditionRepairPayload
    >
  | Action<
      (typeof ActionTypes)['REVEAL_EXPEDITION_DEFECT'],
      import('./actions').RevealExpeditionDefectPayload
    >
  | Action<
      (typeof ActionTypes)['TRIGGER_EXPEDITION_DEFECT'],
      import('./actions').TriggerExpeditionDefectPayload
    >
  | Action<
      (typeof ActionTypes)['RESOLVE_EXPEDITION_DEFECT'],
      import('./actions').ResolveExpeditionDefectPayload
    >
  | Action<
      (typeof ActionTypes)['EXECUTE_EXPEDITION_INSPECTION'],
      import('./actions').ExecuteExpeditionInspectionPayload
    >
  | Action<
      (typeof ActionTypes)['CLAIM_EXPEDITION_INSURANCE'],
      import('./actions').ClaimExpeditionInsurancePayload
    >
  | Action<
      (typeof ActionTypes)['ACCEPT_EXPEDITION_TECHNICAL_FAILURE'],
      import('./actions').AcceptExpeditionTechnicalFailurePayload
    >
  | Action<
      (typeof ActionTypes)['APPLY_EXPEDITION_EVENT_DELTA'],
      import('./actions').ApplyExpeditionEventDeltaPayload
    >
  | Action<
      (typeof ActionTypes)['RECORD_EXPEDITION_CREW_STRESS_SOURCE'],
      import('./expedition').ExpeditionCrewStressIntent
    >
  | Action<
      (typeof ActionTypes)['RECORD_EXPEDITION_RELATIONSHIP_OUTCOME'],
      import('./expedition').ExpeditionRelationshipOutcomeIntent
    >
  | Action<
      (typeof ActionTypes)['ADVANCE_EXPEDITION_CREW_INJURY'],
      import('./actions').ExpeditionInjurySourcePayload
    >
  | Action<
      (typeof ActionTypes)['ADVANCE_EXPEDITION_BAND_INJURY'],
      import('./actions').ExpeditionInjurySourcePayload
    >
  | Action<
      (typeof ActionTypes)['SETTLE_EXPEDITION_CREW_CAREER'],
      import('./actions').SettleExpeditionCrewCareerPayload
    >
  | Action<
      (typeof ActionTypes)['SETTLE_EXPEDITION_CAREER_RESULT'],
      import('./actions').SettleExpeditionCareerResultPayload
    >
  | Action<
      (typeof ActionTypes)['PURCHASE_EXPEDITION_HQ_FACILITY'],
      import('./actions').PurchaseExpeditionHqFacilityPayload
    >
  | Action<
      (typeof ActionTypes)['BEGIN_EXPEDITION_UNLOCK_PURCHASE'],
      import('./actions').ExpeditionUnlockPurchasePayload
    >
  | Action<
      (typeof ActionTypes)['COMPLETE_EXPEDITION_UNLOCK_PURCHASE'],
      import('./actions').ExpeditionUnlockPurchasePayload
    >
  | Action<
      (typeof ActionTypes)['ROLLBACK_EXPEDITION_UNLOCK_PURCHASE'],
      import('./actions').ExpeditionUnlockPurchasePayload
    >
  | Action<
      (typeof ActionTypes)['UNLOCK_EXPEDITION_ASCENSION'],
      import('./actions').UnlockExpeditionAscensionPayload
    >
  | Action<
      (typeof ActionTypes)['COMMIT_EXPEDITION_LEGENDARY_REWARD'],
      import('./actions').CommitExpeditionLegendaryRewardPayload
    >
  | Action<
      (typeof ActionTypes)['RECORD_EXPEDITION_ARCHIVE_DISCOVERY'],
      import('./actions').RecordExpeditionArchiveDiscoveryPayload
    >
  | Action<
      (typeof ActionTypes)['GENERATE_EXPEDITION_BETWEEN_TOUR_DECISIONS'],
      import('./actions').GenerateExpeditionBetweenTourDecisionsPayload
    >
  | Action<
      (typeof ActionTypes)['RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION'],
      import('./actions').ResolveExpeditionBetweenTourDecisionPayload
    >
  | Action<
      (typeof ActionTypes)['ACQUIRE_EXPEDITION_CREW_SIGNATURE'],
      import('./actions').AcquireExpeditionCrewSignaturePayload
    >
  | Action<
      (typeof ActionTypes)['CREATE_CONTACT_INTEL_GRANT'],
      import('./actions').CreateContactIntelGrantPayload
    >
  | Action<
      (typeof ActionTypes)['RECORD_EXPEDITION_OBLIGATION_SIGNAL'],
      import('./actions').RecordExpeditionObligationSignalPayload
    >
  | Action<
      (typeof ActionTypes)['DOUBLE_DOWN_EXPEDITION_OBLIGATION'],
      import('./actions').DoubleDownExpeditionObligationPayload
    >
  | Action<
      (typeof ActionTypes)['OFFER_EXPEDITION_DRAFT'],
      import('./actions').OfferExpeditionDraftPayload
    >
  | Action<
      (typeof ActionTypes)['SELECT_EXPEDITION_DRAFT'],
      import('./actions').SelectExpeditionDraftPayload
    >
  | Action<
      (typeof ActionTypes)['RESOLVE_EXPEDITION_SOCIAL_RESULT'],
      import('./actions').ResolveExpeditionSocialResultPayload
    >
  | Action<
      (typeof ActionTypes)['CREATE_SOCIAL_INTEL_GRANT'],
      import('./actions').CreateSocialIntelGrantPayload
    >

export * from './player'
export * from './band'
export * from './quest'
export * from './events'
export * from './npc'
export * from './map'
export * from './gig'
export * from './actions'
export * from './social'
