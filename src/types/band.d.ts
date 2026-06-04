/**
 * Persisted band-member stats, traits, relationships, and equipment.
 */
export interface BandMember extends UnknownRecord {
  id?: string
  name?: string
  mood: number
  stamina: number
  staminaMax?: number
  traits: Record<string, unknown>
  relationships: Record<string, number>
  baseStats?: Record<string, number>
  skill?: number
  charisma?: number
  technical?: number
  improv?: number
  composition?: number
  role?: string
  equipment?: Record<string, unknown>
}

/**
 * Persisted stack count and legacy metadata for one contraband stash item.
 */
export interface StashItem {
  stacks: number
  [key: string]: unknown
}

/**
 * Loose contraband item selected from the stash UI.
 */
export type ContrabandStashItem = {
  id?: string
  name?: string
  effectType?: string
  type?: string
  instanceId?: string
  [key: string]: unknown
}

/**
 * Persisted band roster, harmony, inventory, and performance state.
 */
export interface BandState {
  members: BandMember[]
  harmony: number
  harmonyRegenTravel: boolean
  inventorySlots: number
  luck: number
  stash: Record<string, StashItem>
  activeContrabandEffects: unknown[]
  performance: {
    guitarDifficulty: number
    drumMultiplier: number
    crowdDecay: number
  }
  inventory: Record<string, unknown>
  merchPrices?: Record<string, number>
  neuroDecimatorActive: boolean
  banterEvents?: Array<{
    member1: string
    member2: string
    delta: number
    timestamp: number
  }>
  [key: string]: unknown
}
