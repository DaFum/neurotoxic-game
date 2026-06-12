import type { ActionTypes, ActionType } from '../context/actionTypes'
import type { RhythmSetlistEntry } from './rhythmGame'
import type { GAME_PHASES } from '../context/gameConstants'
import type { UpdateSocialPayload } from './social'
import type { PurchaseItem } from './components'
import type { AssetKind, RiskEventDescriptor } from './assets'
import type { ActiveQuestState } from './quest'

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
 * Supported overworld map node categories.
 */
export type MapNodeType =
  | 'START'
  | 'GIG'
  | 'SPECIAL'
  | 'REST_STOP'
  | 'FESTIVAL'
  | 'FINALE'
  | 'CITY'
  | 'REST'
  | 'SUPPLY_STOP'

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
  | 'TOURBUS'
  | 'ROADIE'
  | 'KABELSALAT'
  | 'AMP_CALIBRATION'

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
  [key: string]: unknown
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
  reputationByVenue: Record<string, number>
  settings: GameSettings
  npcs: Record<string, CharacterProfile>
  gigModifiers: GigModifiers
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
 * the payload key is required and carries the supplied shape.
 *
 * @typeParam TType - Concrete action type discriminant.
 * @typeParam TPayload - Payload shape for actions that carry data.
 */
export type Action<
  TType extends ActionType,
  TPayload = undefined
> = TPayload extends undefined
  ? { type: TType }
  : { type: TType; payload: TPayload }

/**
 * Complete set of reducer actions accepted by the game-state reducer.
 */
export type GameAction =
  | Action<ActionTypes['CHANGE_SCENE'], GamePhase>
  | Action<ActionTypes['UPDATE_PLAYER'], UpdatePlayerPayload>
  | Action<ActionTypes['TOGGLE_NEURO_DECIMATOR'], { isActive: boolean }>
  | Action<ActionTypes['UPDATE_BAND'], UpdateBandPayload>
  | Action<ActionTypes['UPDATE_SOCIAL'], UpdateSocialPayload>
  | Action<ActionTypes['UPDATE_SETTINGS'], UnknownRecord>
  | Action<ActionTypes['SET_MAP'], GameMap | null>
  | Action<ActionTypes['SET_GIG'], Venue | null>
  | Action<ActionTypes['START_GIG'], Venue>
  | Action<ActionTypes['SET_SETLIST'], RhythmSetlistEntry[]>
  | Action<ActionTypes['SET_LAST_GIG_STATS'], PostGigSummary | null>
  | Action<ActionTypes['SET_ACTIVE_EVENT'], GameEvent | null>
  | Action<ActionTypes['ADD_TOAST'], ToastPayload>
  | Action<ActionTypes['REMOVE_TOAST'], string>
  | Action<
      ActionTypes['SET_GIG_MODIFIERS'],
      Partial<GigModifiers> | ((prev: GigModifiers) => Partial<GigModifiers>)
    >
  | Action<ActionTypes['LOAD_GAME'], RawLoadedGame>
  | Action<ActionTypes['RESET_STATE'], ResetStatePayload>
  | Action<ActionTypes['APPLY_EVENT_DELTA'], EventDeltaPayload>
  | Action<ActionTypes['POP_PENDING_EVENT']>
  | Action<ActionTypes['CONSUME_ITEM'], string>
  | Action<
      ActionTypes['ADVANCE_DAY'],
      { dayRngStream: number[]; nextRngSeed: number }
    >
  | Action<ActionTypes['ADD_COOLDOWN'], string>
  | Action<ActionTypes['START_TRAVEL_MINIGAME'], { targetNodeId: string }>
  | Action<
      ActionTypes['COMPLETE_TRAVEL_MINIGAME'],
      CompleteTravelMinigamePayload
    >
  | Action<ActionTypes['START_ROADIE_MINIGAME'], { gigId: string }>
  | Action<
      ActionTypes['COMPLETE_ROADIE_MINIGAME'],
      { equipmentDamage: number; contrabandDelivered?: number }
    >
  | Action<ActionTypes['START_KABELSALAT_MINIGAME'], { gigId: string }>
  | Action<ActionTypes['COMPLETE_KABELSALAT_MINIGAME'], { results: unknown }>
  | Action<ActionTypes['START_AMP_CALIBRATION'], { gigId: string }>
  | Action<
      ActionTypes['COMPLETE_AMP_CALIBRATION'],
      {
        score: number
        voidResonance: number
        purgesUsed: number
        hijacksOverridden: number
      }
    >
  | Action<ActionTypes['SPAWN_RIVAL_BAND'], SpawnRivalBandPayload>
  | Action<ActionTypes['MOVE_RIVAL_BAND'], MoveRivalBandPayload>
  | Action<ActionTypes['UPDATE_RIVAL_BAND'], Partial<RivalBandState>>
  | Action<ActionTypes['CHECK_RIVAL_ENCOUNTER']>
  | Action<ActionTypes['UNLOCK_TRAIT'], { memberId: string; traitId: string }>
  | Action<
      ActionTypes['UNBLACKLIST_VENUE'],
      { venueId: string; toastId: string }
    >
  | Action<
      ActionTypes['CRAFT_ITEM'],
      { recipeId: string; instanceId: string; toastId: string }
    >
  | Action<ActionTypes['ADD_QUEST'], QuestState>
  | Action<
      ActionTypes['ADVANCE_QUEST'],
      { questId: string; amount: number; randomIdx?: number }
    >
  | Action<ActionTypes['ADD_UNLOCK'], string>
  | Action<
      ActionTypes['USE_CONTRABAND'],
      { instanceId: string; contrabandId: string; memberId?: string }
    >
  | Action<ActionTypes['CLINIC_HEAL'], ClinicActionPayload>
  | Action<ActionTypes['CLINIC_ENHANCE'], ClinicActionPayload>
  | Action<ActionTypes['PIRATE_BROADCAST'], PirateBroadcastPayload>
  | Action<ActionTypes['MERCH_PRESS'], MerchPressPayload>
  | Action<ActionTypes['TRADE_VOID_ITEM'], TradeVoidItemPayload>
  | Action<ActionTypes['BLOOD_BANK_DONATE'], BloodBankDonatePayload>
  | Action<ActionTypes['DARK_WEB_LEAK'], DarkWebLeakPayload>
  | Action<ActionTypes['SET_PENDING_BANDHQ_OPEN'], boolean>
  | Action<
      ActionTypes['SET_PENDING_SUPPLY_STOP_INVENTORY'],
      PurchaseItem[] | null
    >
  | Action<ActionTypes['DISMISS_FORECLOSURE_NOTICE'], { kind: AssetKind }>
  | Action<ActionTypes['SET_PENDING_RISK_EVENT'], RiskEventDescriptor | null>
  // Long-term assets (Plan 1)
  | Action<
      ActionTypes['PURCHASE_CHASSIS'],
      import('./assets').PurchaseChassisPayload
    >
  | Action<
      ActionTypes['PURCHASE_CHASSIS_FAILED'],
      { reason: import('./assets').PurchaseFailureReason }
    >
  | Action<
      ActionTypes['UPGRADE_CHASSIS_TIER'],
      import('./assets').UpgradeChassisTierPayload
    >
  | Action<ActionTypes['SELL_CHASSIS'], { assetId: string }>
  | Action<
      ActionTypes['SELL_CHASSIS_FAILED'],
      { assetId: string; reason: 'LIABILITY_EXCEEDS_VALUE' }
    >
  | Action<ActionTypes['REPAIR_CHASSIS'], { assetId: string }>
  | Action<
      ActionTypes['REFINANCE_LIABILITY'],
      import('./assets').RefinanceLiabilityPayload
    >
  | Action<
      ActionTypes['REFINANCE_LIABILITY_FAILED'],
      { reason: import('./assets').RefinanceFailureReason }
    >
  | Action<
      ActionTypes['INSTALL_MODULE'],
      import('./assets').InstallModulePayload
    >
  | Action<
      ActionTypes['INSTALL_MODULE_FAILED'],
      { reason: import('./assets').InstallModuleFailureReason }
    >
  | Action<ActionTypes['REMOVE_MODULE'], { assetId: string; slotId: string }>
  | Action<
      ActionTypes['START_CROWDFUND'],
      { campaign: import('./assets').CrowdfundCampaign }
    >
  | Action<ActionTypes['ASSET_FORECLOSED'], { assetId: string }>

export * from './player'
export * from './band'
export * from './quest'
export * from './events'
export * from './npc'
export * from './map'
export * from './gig'
export * from './actions'
export * from './social'
