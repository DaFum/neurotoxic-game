/**
 * NPC profile data used by character-driven UI and events.
 */
export interface CharacterProfile {
  id: string
  name?: string
  role?: string
  traits?: string[]
  relationship?: number
  [key: string]: unknown
}

/**
 * NPC or band-character trait metadata shown in UI.
 */
export interface CharacterTrait {
  id: string
  name: string
  desc: string
  unlockHint: string
  effect?: string
  exclusiveWith?: string[]
}
