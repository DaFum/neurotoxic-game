import type { UnknownRecord } from './game'

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'newsletter'

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

export interface BrandDealOffer {
  upfront: number
  duration: number
  perGig?: number
  revenueShare?: number
  item?: string
  [key: string]: unknown
}

export interface BrandDeal {
  id: string
  name: string
  description: string
  type: string
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

export type BrandOfferUrgency = 'low' | 'medium' | 'high'

export type BrandOfferVariantId =
  | 'standard'
  | 'summer_edition'
  | 'anniversary_push'
  | 'stealth_drop'
  | 'viral_comeback'
  | 'desperate'
  | 'probe'

export interface BrandOfferRep {
  nameKey: string
  nameDefault: string
  titleKey: string
  titleDefault: string
}

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

export interface BrandOffer extends BrandDeal {
  flavor: BrandOfferFlavor
}

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

export type BrandAlignment =
  | 'EVIL'
  | 'CORPORATE'
  | 'INDIE'
  | 'SUSTAINABLE'
  | 'GOOD'
  | 'NEUTRAL'

export interface RivalBandState {
  id: string
  name: string
  alignment: BrandAlignment
  powerLevel: number
  currentLocationId: string | null
  [key: string]: unknown
}

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
}

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

export type UpdateSocialPayload =
  | Partial<SocialState>
  | ((social: SocialState) => Partial<SocialState>)
