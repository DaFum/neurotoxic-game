/**
 * One row in an income or expense financial breakdown.
 */
export interface FinancialBreakdownItem {
  labelKey: string
  value: number
  detailKey?: string
  detailParams?: Record<string, unknown>
}

/**
 * Complete post-gig financial summary.
 */
export interface PostGigFinancials {
  income: { total: number; breakdown: FinancialBreakdownItem[] }
  expenses: { total: number; breakdown: FinancialBreakdownItem[] }
  net: number
  soldMerch?: Record<string, number>
}

import type { PlayerState, Venue, GigModifiers } from '.'
import type { CityTraitState } from './game'

/**
 * Minimal gig venue data required by economy calculations.
 */
export type GigEconomyData = Partial<
  Pick<Venue, 'capacity' | 'diff' | 'difficulty' | 'name'>
> & {
  price?: number
  pay?: number
  [key: string]: unknown
}

/**
 * Game context inputs consumed by gig economy calculations.
 */
export type EconomyContext = {
  daysSinceLastGig?: number
  lastGigDifficulty?: number
  controversyLevel?: number
  loyalty?: number
  zealotry?: number
  regionRep?: number
  discountedTickets?: boolean
  merchPrices?: Record<string, number>
  cityTraits?: CityTraitState
  social?: {
    zealotry?: number
    activeDeals?: Array<{
      type?: unknown
      offer?: { perGig?: number }
    }>
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Performance statistics used by economy and post-gig utilities.
 */
export type GigStatsLike = {
  misses?: number
  peakHype?: number
  [key: string]: unknown
}

/**
 * Inventory shape required for merch and economy calculations.
 */
export type BandInventoryLike = {
  shirts?: number
  hoodies?: number
  cds?: number
  patches?: number
  vinyl?: number
  [key: string]: unknown
}

/**
 * Map coordinate and optional venue reference used by economy context.
 */
export type MapPoint = {
  x?: number
  y?: number
  venue?: {
    x?: number
    y?: number
  }
  [key: string]: unknown
}

/**
 * Parameters passed to gig financial calculation helpers.
 */
export type GigFinancialParams = {
  gigData: GigEconomyData
  performanceScore: number
  modifiers: Partial<GigModifiers>
  bandInventory: BandInventoryLike
  playerState?: Pick<PlayerState, 'fame'> | null
  gigStats: GigStatsLike
  context?: EconomyContext
}

/**
 * Kabelsalat minigame results that affect gig finances.
 */
export type KabelsalatResults = {
  isPoweredOn?: boolean
  timeLeft?: number
  voidSurgesPurged?: number
}
