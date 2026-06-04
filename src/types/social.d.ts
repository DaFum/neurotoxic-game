import type { UnknownRecord } from './game'

/**
 * Supported social media platforms.
 */
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'newsletter'

/**
 * Requirements that gate whether a brand deal is available.
 */
export interface BrandDealRequirements {
  followers: number
  trend?: string[]
  trendSet?: Set<string>
  trait?: string
  maxZealotry?: number
  minZealotry?: number
  maxControversy?: number
  minControversy?: number
  [key: string]: unknown
}

/**
 * Payout and duration terms for a brand deal.
 */
export interface BrandDealOffer {
  upfront: number
  duration: number
  perGig?: number
  revenueShare?: number
  item?: string
  [key: string]: unknown
}

/**
 * High-level brand-deal categories.
 */
export type BrandDealType = 'SPONSORSHIP' | 'ENDORSEMENT' | 'RECORD_DEAL'

/**
 * Active or offered brand deal contract.
 */
export interface BrandDeal {
  id: string
  name: string
  description: string
  type: BrandDealType
  alignment: BrandAlignment
  requirements: BrandDealRequirements
  offer: BrandDealOffer
  penalty?: {
    controversy?: number
    loyalty?: number
    [key: string]: unknown
  }
  benefit?: Record<string, unknown>
  remainingGigs?: number
  [key: string]: unknown
}

/**
 * Urgency tier used to flavor generated brand offers.
 */
export type BrandOfferUrgency = 'low' | 'medium' | 'high'

/**
 * Variant identifiers for generated brand-offer flavor text.
 */
export type BrandOfferVariantId =
  | 'standard'
  | 'summer_edition'
  | 'anniversary_push'
  | 'stealth_drop'
  | 'viral_comeback'
  | 'desperate'
  | 'probe'

/**
 * Localized representative identity for a brand offer.
 */
export interface BrandOfferRep {
  nameKey: string
  nameDefault: string
  titleKey: string
  titleDefault: string
}

/**
 * Generated flavor metadata attached to a brand offer.
 */
export interface BrandOfferFlavor {
  campaignCodename: string
  rep: BrandOfferRep
  taglineKey: string
  taglineDefault: string
  hookKey: string
  hookDefault: string
  variant: BrandOfferVariantId
  variantLabelKey: string
  variantLabelDefault: string
  urgency: BrandOfferUrgency
  isStretched: boolean
}

/**
 * Brand deal enriched with generated flavor metadata.
 */
export interface BrandOffer extends BrandDeal {
  flavor: BrandOfferFlavor
}

/**
 * Game-state slice consumed by social option conditions.
 */
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
    scenePresence?: number
    [key: string]: unknown
  }
  currentGig?: { id?: string; [key: string]: unknown } | null
}

/**
 * Selectable social post option with condition and resolver hooks.
 */
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

/**
 * Brand alignment categories used for reputation and rival logic.
 */
export type BrandAlignment =
  | 'EVIL'
  | 'CORPORATE'
  | 'INDIE'
  | 'SUSTAINABLE'
  | 'GOOD'
  | 'NEUTRAL'

/**
 * Persisted rival band state on the overworld map.
 */
export interface RivalBandState {
  id: string
  name: string
  alignment: BrandAlignment
  powerLevel: number
  currentLocationId: string | null
  [key: string]: unknown
}

/**
 * Persisted social media, reputation, and brand-deal state.
 */
export interface SocialState extends UnknownRecord {
  instagram: number
  tiktok: number
  youtube: number
  newsletter: number
  viral: number
  lastGigDay: number | null
  lastGigDifficulty: number | null
  lastPirateBroadcastDay: number | null
  lastDarkWebLeakDay: number | null
  controversyLevel: number
  loyalty: number
  zealotry: number
  reputationCooldown: number
  egoFocus: string | null
  trend: string
  activeDeals: UnknownRecord[]
  brandReputation: Record<string, number>
  influencers: Record<string, UnknownRecord>
  scenePresence?: number
}

/**
 * Result payload from resolving a social post option.
 */
export interface PostResult {
  platform?: Platform
  success?: boolean
  followers?: number
  totalFollowers?: number
  moneyChange?: number
  message?: string
  unlockTrait?: { memberId: string; traitId: string } | null
  [key: string]: unknown
}

/**
 * Reducer payload accepted by the social update action.
 */
export type UpdateSocialPayload =
  | Partial<SocialState>
  | ((social: SocialState) => Partial<SocialState>)
