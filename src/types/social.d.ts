export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'newsletter'

export interface SocialEngineGameState {
  player: {
    day?: number
    money?: number
    fame?: number
    currentNodeId?: string | null
    [key: string]: unknown
  }
  band?: Record<string, unknown>
  rivalBand?: {
    id: string
    currentLocationId: string | null
    powerLevel: number
    [key: string]: unknown
  } | null
  social?: {
    reputationCooldown?: number
    trend?: string
    instagram?: number
    tiktok?: number
    youtube?: number
    controversyLevel?: number
    zealotry?: number
    activeDeals?: unknown[]
    brandReputation?: Record<string, number>
    [key: string]: unknown
  }
  currentGig?: { id?: string; [key: string]: unknown } | null
}

export interface SocialPostOption {
  id: string
  category?: string
  badges?: string[]
  platform?: Platform
  condition: (gameState: SocialEngineGameState) => boolean
  resolve?: (
    gameState: SocialEngineGameState & { diceRoll: number }
  ) => Record<string, unknown>
  [key: string]: unknown
}
