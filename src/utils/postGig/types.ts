import type { GameState, PostGigSummary, Venue, PostResult } from '../../types'
import type { Platform, SocialPostOption } from '../../types/social'

/** Inputs to `calculatePostGigStateUpdates` — the selected post plus the state slices and RNG value it resolves against. */
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

/** Result of resolving a spin-story money effect: either no-op or the clamped next money + applied delta. */
export type SpinStoryMoneyUpdate =
  | { success: false }
  | { success: true; nextMoney: number; appliedDelta: number }

/** A fully-resolved social-post outcome: the base `PostResult` plus the concrete effect deltas applied this post. */
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
  /** True when the resolved post represents a failed stage dive / crowdsurf. */
  failedStageDive?: boolean
  influencerUpdate?: { id: string; scoreChange: number }
}
