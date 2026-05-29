import type { EventDelta } from './events'

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
  getSuccessToast?: (...args: number[]) => unknown
  [key: string]: unknown
}

export interface DarkWebLeakConfig {
  COST: number
  FAME_GAIN: number
  ZEALOTRY_GAIN: number
  CONTROVERSY_GAIN: number
  HARMONY_COST: number
  REQUIRED_CONTROVERSY: number
}

export interface DarkWebLeakPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

export interface PirateBroadcastPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

export interface BloodBankDonatePayload {
  moneyGain: number
  harmonyCost: number
  staminaCost: number
  controversyGain: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

export interface TradeVoidItemPayload {
  contrabandId: string
  fameCost: number
  instanceId?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

export interface MerchPressPayload {
  cost: number
  loyaltyGain: number
  controversyGain: number
  fameGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

export type UpdatePlayerPayload =
  | Partial<PlayerState>
  | ((player: PlayerState) => Partial<PlayerState>)

export type UpdateBandPayload =
  | Partial<BandState>
  | ((band: BandState) => Partial<BandState>)

export interface ResetStatePayload extends UnknownRecord {
  settings?: RawGameSettings
  unlocks?: string[]
}

export interface EventDeltaPayload extends EventDelta {
  activeStoryFlags?: string[]
  pendingEvents?: string[]
}

export interface SpawnRivalBandPayload {
  rivalBand: RivalBandState
}

export interface MoveRivalBandPayload {
  rivalBand: RivalBandState
}
