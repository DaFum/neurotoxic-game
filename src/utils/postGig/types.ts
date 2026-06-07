import type { GameState, PostGigSummary, Venue, PostResult } from '../../types'
import type { Platform, SocialPostOption } from '../../types/social'

export type CalculatePostGigStateParams = {
  option: SocialPostOption
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  lastGigStats?: PostGigSummary | null
  currentGig?: Venue | null
  perfScore?: number
  secureRandomValue?: number
}

export type SpinStoryMoneyUpdate =
  | { success: false }
  | { success: true; nextMoney: number; appliedDelta: number }

export type ResolvedPostResult = PostResult & {
  platform: Platform
  success: boolean
  followers: number
  message: string
  harmonyChange?: number
  controversyChange?: number
  loyaltyChange?: number
  zealotryChange?: number
  staminaChange?: number
  moodChange?: number
  allMembersMoodChange?: boolean
  allMembersStaminaChange?: boolean
  targetMember?: string
  reputationCooldownSet?: number
  egoClear?: boolean
  egoDrop?: string | null
  influencerUpdate?: { id: string; scoreChange: number }
}
