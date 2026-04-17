import type { ActionTypes } from '../context/actionTypes'

export type ActionType = ActionTypes[keyof ActionTypes]

export type UnknownRecord = Record<string, unknown>

export interface PlayerState {
  playerId: string | null
  playerName: string
  money: number
  day: number
  time: number
  location: string
  currentNodeId: string
  lastGigNodeId: string | null
  tutorialStep: number
  score: number
  fame: number
  fameLevel: number
  eventsTriggeredToday: number
  totalTravels: number
  hqUpgrades: string[]
  clinicVisits: number
  van: {
    fuel: number
    condition: number
    upgrades: string[]
    breakdownChance: number
  }
  passiveFollowers: number
  stats: {
    totalDistance: number
    conflictsResolved: number
    stageDives: number
    consecutiveBadShows: number
    proveYourselfMode: boolean
  }
  [key: string]: unknown
}

export interface BandMember extends UnknownRecord {
  id?: string
  name?: string
  mood: number
  stamina: number
  traits: Record<string, unknown>
  relationships: Record<string, number>
}

export interface BandState {
  members: BandMember[]
  harmony: number
  harmonyRegenTravel: boolean
  inventorySlots: number
  luck: number
  stash: Record<string, unknown>
  activeContrabandEffects: unknown[]
  performance: {
    guitarDifficulty: number
    drumMultiplier: number
    crowdDecay: number
  }
  inventory: Record<string, unknown>
  [key: string]: unknown
}

export interface SocialState {
  instagram: number
  tiktok: number
  youtube: number
  newsletter: number
  viral: number
  lastGigDay: number | null
  lastGigDifficulty: number | null
  lastPirateBroadcastDay: number | null
  controversyLevel: number
  loyalty: number
  zealotry: number
  reputationCooldown: number
  egoFocus: string | null
  trend: string
  activeDeals: UnknownRecord[]
  brandReputation: Record<string, number>
  influencers: Record<string, UnknownRecord>
  [key: string]: unknown
}

export interface GigModifiers {
  promo: boolean
  soundcheck: boolean
  merch: boolean
  catering: boolean
  guestlist: boolean
  [key: string]: boolean
}

export interface ToastPayload {
  id: string
  type: string
  message?: unknown
  [key: string]: unknown
}

export type UpdatePlayerPayload =
  | Partial<PlayerState>
  | ((player: PlayerState) => Partial<PlayerState>)

export type UpdateBandPayload =
  | Partial<BandState>
  | ((band: BandState) => Partial<BandState>)

export interface CompleteTravelMinigamePayload {
  damageTaken: number
  itemsCollected: unknown[]
  rngValue?: number
  contrabandId?: string
  instanceId?: string
}

export interface ClinicActionPayload {
  memberId: string
  type: 'heal' | 'enhance'
  staminaGain?: number
  moodGain?: number
  trait?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  [key: string]: unknown
}

export interface PirateBroadcastPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  [key: string]: unknown
}

export interface BloodBankDonatePayload {
  moneyGain: number
  harmonyCost: number
  staminaCost: number
  controversyGain: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  [key: string]: unknown
}

export interface TradeVoidItemPayload {
  contrabandId: string
  fameCost: number
  instanceId?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  [key: string]: unknown
}

export interface MerchPressPayload {
  cost: number
  loyaltyGain: number
  controversyGain: number
  fameGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  [key: string]: unknown
}

export interface GameState {
  version: number
  currentScene: string
  player: PlayerState
  band: BandState
  social: SocialState
  gameMap: unknown
  currentGig: UnknownRecord | null
  setlist: unknown[]
  lastGigStats: UnknownRecord | null
  activeEvent: UnknownRecord | null
  pendingEvents: unknown[]
  isScreenshotMode: boolean
  toasts: ToastPayload[]
  activeStoryFlags: string[]
  eventCooldowns: string[]
  venueBlacklist: string[]
  activeQuests: UnknownRecord[]
  reputationByRegion: Record<string, number>
  settings: UnknownRecord
  npcs: Record<string, unknown>
  gigModifiers: GigModifiers
  minigame: UnknownRecord
  unlocks: string[]
}

export type Action<TType extends ActionType, TPayload = undefined> =
  TPayload extends undefined ? { type: TType } : { type: TType; payload: TPayload }

export type GameAction =
  | Action<ActionTypes['CHANGE_SCENE'], string>
  | Action<ActionTypes['UPDATE_PLAYER'], UpdatePlayerPayload>
  | Action<ActionTypes['UPDATE_BAND'], UpdateBandPayload>
  | Action<ActionTypes['UPDATE_SOCIAL'], Partial<SocialState>>
  | Action<ActionTypes['UPDATE_SETTINGS'], UnknownRecord>
  | Action<ActionTypes['SET_MAP'], unknown>
  | Action<ActionTypes['SET_GIG'], UnknownRecord | null>
  | Action<ActionTypes['START_GIG'], UnknownRecord>
  | Action<ActionTypes['SET_SETLIST'], unknown[]>
  | Action<ActionTypes['SET_LAST_GIG_STATS'], UnknownRecord | null>
  | Action<ActionTypes['SET_ACTIVE_EVENT'], UnknownRecord | null>
  | Action<ActionTypes['ADD_TOAST'], ToastPayload>
  | Action<ActionTypes['REMOVE_TOAST'], string>
  | Action<ActionTypes['SET_GIG_MODIFIERS'], Partial<GigModifiers> | ((prev: GigModifiers) => Partial<GigModifiers>)>
  | Action<ActionTypes['LOAD_GAME'], Partial<GameState>>
  | Action<ActionTypes['RESET_STATE'], UnknownRecord>
  | Action<ActionTypes['APPLY_EVENT_DELTA'], UnknownRecord>
  | Action<ActionTypes['POP_PENDING_EVENT']>
  | Action<ActionTypes['CONSUME_ITEM'], string>
  | Action<ActionTypes['ADVANCE_DAY']>
  | Action<ActionTypes['ADD_COOLDOWN'], string>
  | Action<ActionTypes['START_TRAVEL_MINIGAME'], { targetNodeId: string }>
  | Action<ActionTypes['COMPLETE_TRAVEL_MINIGAME'], CompleteTravelMinigamePayload>
  | Action<ActionTypes['START_ROADIE_MINIGAME'], { gigId: string }>
  | Action<ActionTypes['COMPLETE_ROADIE_MINIGAME'], { equipmentDamage: number }>
  | Action<ActionTypes['START_KABELSALAT_MINIGAME'], { gigId: string }>
  | Action<ActionTypes['COMPLETE_KABELSALAT_MINIGAME'], { results: unknown }>
  | Action<ActionTypes['START_AMP_CALIBRATION'], { gigId: string }>
  | Action<ActionTypes['COMPLETE_AMP_CALIBRATION'], { score: number }>
  | Action<ActionTypes['UNLOCK_TRAIT'], { memberId: string; traitId: string }>
  | Action<ActionTypes['ADD_VENUE_BLACKLIST'], { venueId: string; toastId: string }>
  | Action<ActionTypes['ADD_QUEST'], UnknownRecord>
  | Action<ActionTypes['ADVANCE_QUEST'], { questId: string; amount: number; randomIdx?: number }>
  | Action<ActionTypes['COMPLETE_QUEST'], { questId: string; randomIdx?: number }>
  | Action<ActionTypes['FAIL_QUESTS']>
  | Action<ActionTypes['ADD_UNLOCK'], string>
  | Action<ActionTypes['ADD_CONTRABAND'], { contrabandId: string; instanceId: string }>
  | Action<ActionTypes['USE_CONTRABAND'], { instanceId: string; contrabandId: string; memberId?: string }>
  | Action<ActionTypes['CLINIC_HEAL'], ClinicActionPayload>
  | Action<ActionTypes['CLINIC_ENHANCE'], ClinicActionPayload>
  | Action<ActionTypes['PIRATE_BROADCAST'], PirateBroadcastPayload>
  | Action<ActionTypes['MERCH_PRESS'], MerchPressPayload>
  | Action<ActionTypes['TRADE_VOID_ITEM'], TradeVoidItemPayload>
  | Action<ActionTypes['BLOOD_BANK_DONATE'], BloodBankDonatePayload>
