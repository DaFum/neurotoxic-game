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
