/**
 * NPC or band-character trait metadata shown in UI.
 */
export interface CharacterTrait {
  id: string
  name: string
  desc: string
  unlockHint: string
  effect?: string
  effects?: {
    rhythmMultiplier?: number
    stressPerGig?: number
    staminaPerGig?: number
    [key: string]: unknown
  }
  exclusiveWith?: string[]
}
