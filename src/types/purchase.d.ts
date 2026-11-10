import type { PlayerState, BandState } from './game'

/**
 * Partial player update shape that supports nested van updates.
 */
export type PlayerPatch = Omit<Partial<PlayerState>, 'van'> & {
  van?: Partial<PlayerState['van']>
  fameLevel?: number
}

/**
 * Partial band update shape accepted by purchase effects.
 */
export type BandPatch = Partial<BandState> | null

/**
 * Discriminated status reflecting why a catalog item is or isn't purchasable.
 */
export type PurchaseStatus =
  | 'available'
  | 'owned'
  | 'insufficient_funds'
  | 'reputation_blocked'
  | 'missing_effect'

/**
 * Resolved purchase state parameters for a given catalog item.
 */
export interface PurchaseDecision {
  cost: number
  status?: PurchaseStatus
  canAfford: boolean
  isOwned: boolean
  isConsumable: boolean
  canPurchase: boolean
}
