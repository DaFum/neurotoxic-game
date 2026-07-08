import type { EventDelta } from './events'

/**
 * Payload produced when the tourbus travel minigame finishes.
 */
export interface CompleteTravelMinigamePayload {
  damageTaken: number
  itemsCollected: unknown[]
  rngValue?: number
  contrabandId?: string
  instanceId?: string
}

/**
 * Payload for clinic member treatment actions.
 */
export interface ClinicActionPayload {
  memberId: string
  type: 'heal' | 'enhance'
  staminaGain?: number
  moodGain?: number
  trait?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  getSuccessToast?: (...args: number[]) => unknown
  [key: string]: unknown
}

/**
 * Tuning values for the dark-web leak action.
 */
export interface DarkWebLeakConfig {
  COST: number
  FAME_GAIN: number
  ZEALOTRY_GAIN: number
  CONTROVERSY_GAIN: number
  HARMONY_COST: number
  REQUIRED_CONTROVERSY: number
}

/**
 * Reducer payload for resolving a dark-web leak.
 */
export interface DarkWebLeakPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Reducer payload for resolving a pirate broadcast.
 */
export interface PirateBroadcastPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Reducer payload for blood-bank donation outcomes.
 */
export interface BloodBankDonatePayload {
  moneyGain: number
  harmonyCost: number
  staminaCost: number
  controversyGain: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Reducer payload for void trader purchases.
 */
export interface TradeVoidItemPayload {
  contrabandId: string
  fameCost: number
  instanceId?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Reducer payload for merch press outcomes.
 */
export interface MerchPressPayload {
  cost: number
  loyaltyGain: number
  controversyGain: number
  fameGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Player update payload or reducer-time updater.
 */
export type UpdatePlayerPayload =
  Partial<PlayerState> | ((player: PlayerState) => Partial<PlayerState>)

/**
 * Band update payload or reducer-time updater.
 */
export type UpdateBandPayload =
  Partial<BandState> | ((band: BandState) => Partial<BandState>)

/**
 * Payload used when resetting state while preserving selected settings.
 */
export interface ResetStatePayload extends UnknownRecord {
  settings?: RawGameSettings
  unlocks?: string[]
}

/**
 * Event delta payload plus active story flags and queued events.
 */
export interface EventDeltaPayload extends EventDelta {
  activeStoryFlags?: string[]
  pendingEvents?: string[]
}

/**
 * Payload for spawning a rival band.
 */
export interface SpawnRivalBandPayload {
  rivalBand: RivalBandState
}

/**
 * Payload for moving a rival band to a map node.
 */
export interface MoveRivalBandPayload {
  rivalBand: RivalBandState
}
