import type { ActionTypes, ActionType } from '../context/actionTypes'
import type { RhythmSetlistEntry } from './rhythmGame'
import type { GAME_PHASES } from '../context/gameConstants'
import type { UpdateSocialPayload } from './social'

export type RelationshipChange = {
  member1: string
  member2: string
  change: number
  source?: string
  timestamp?: number
}

export type GamePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES]
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'

export interface GameSettings {
  crtEnabled: boolean
  tutorialSeen: boolean
  logLevel: number
}

export type UnknownRecord = Record<string, unknown>
export type RawGameSettings = Partial<Record<keyof GameSettings, unknown>>

export type StashEntry = {
  stacks?: number | null
}

export type MapNodeType =
  | 'START'
  | 'GIG'
  | 'SPECIAL'
  | 'REST_STOP'
  | 'FESTIVAL'
  | 'FINALE'
  | 'CITY'
  | 'REST'
  | 'supplyStop'

export interface CityTraitState {
  genreBias: string
  attentionSpan: number
  barSpendingProfile: string
}

export type MinigameType =
  | 'TOURBUS'
  | 'ROADIE'
  | 'KABELSALAT'
  | 'AMP_CALIBRATION'

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

export interface ToastPayload {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message?: unknown
  messageKey?: string
  options?: Record<string, unknown>
  [key: string]: unknown
}

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
  activeQuests: QuestState[]
  reputationByRegion: Record<string, number>
  settings: GameSettings
  npcs: Record<string, CharacterProfile>
  gigModifiers: GigModifiers
  minigame: MinigameState
  unlocks: string[]
  pendingBandHQOpen: boolean
  completedMilestones: string[]
}

export type RawLoadedGame = UnknownRecord

export type Action<
  TType extends ActionType,
  TPayload = undefined
> = TPayload extends undefined
  ? { type: TType }
  : { type: TType; payload: TPayload }

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
  | Action<ActionTypes['ADVANCE_DAY']>
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
  | Action<ActionTypes['SPAWN_RIVAL_BAND']>
  | Action<ActionTypes['MOVE_RIVAL_BAND']>
  | Action<ActionTypes['UPDATE_RIVAL_BAND'], Partial<RivalBandState>>
  | Action<ActionTypes['CHECK_RIVAL_ENCOUNTER']>
  | Action<ActionTypes['UNLOCK_TRAIT'], { memberId: string; traitId: string }>
  | Action<
      ActionTypes['ADD_VENUE_BLACKLIST'],
      { venueId: string; toastId: string }
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

export * from './player'
export * from './band'
export * from './quest'
export * from './events'
export * from './npc'
export * from './map'
export * from './gig'
export * from './actions'
export * from './social'
