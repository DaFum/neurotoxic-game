export interface CharacterProfile {
  id: string
  name?: string
  role?: string
  traits?: string[]
  relationship?: number
  [key: string]: unknown
}

export interface CharacterTrait {
  id: string
  name: string
  desc: string
  unlockHint: string
}
