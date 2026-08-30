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
 * Costs and gains shared by every once-per-day zealotry social action.
 */
export interface ZealotryActionConfig {
  COST: number
  FAME_GAIN: number
  ZEALOTRY_GAIN: number
  CONTROVERSY_GAIN: number
  HARMONY_COST: number
  REQUIRED_CONTROVERSY?: number
  REQUIRED_ZEALOTRY?: number
}

/**
 * Tuning values for the dark-web leak action.
 */
export interface DarkWebLeakConfig extends ZealotryActionConfig {
  REQUIRED_CONTROVERSY: number
}

/**
 * Tuning values for the cult indoctrination action.
 */
export interface CultIndoctrinationConfig extends ZealotryActionConfig {
  REQUIRED_ZEALOTRY: number
}

/**
 * Reducer payload shared by the zealotry social actions.
 *
 * @remarks
 * `applyZealotryAction` consumes this shape for the pirate broadcast, dark-web
 * leak, and cult indoctrination alike.
 */
export interface ZealotryActionPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/** Reducer payload for resolving a cult indoctrination. */
export type CultIndoctrinationPayload = ZealotryActionPayload

/** Reducer payload for resolving a dark-web leak. */
export type DarkWebLeakPayload = ZealotryActionPayload

/** Reducer payload for resolving a pirate broadcast. */
export type PirateBroadcastPayload = ZealotryActionPayload

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
 * Payload for removing one queued event id.
 *
 * @remarks
 * Omitting `eventId` pops the queue head, which is what draining an
 * unplayable head needs. Passing the id of the event that was actually played
 * removes that entry wherever it sits, so a head the engine skipped over does
 * not leave the played entry queued for a replay.
 */
export interface PopPendingEventPayload {
  eventId?: string
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
