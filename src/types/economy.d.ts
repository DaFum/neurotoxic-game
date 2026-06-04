export interface FinancialBreakdownItem {
  labelKey: string
  value: number
  detailKey?: string
  detailParams?: Record<string, unknown>
}

export interface PostGigFinancials {
  income: { total: number; breakdown: FinancialBreakdownItem[] }
  expenses: { total: number; breakdown: FinancialBreakdownItem[] }
  net: number
  soldMerch?: Record<string, number>
}

import type {
  PlayerState,
  Venue,
  GigModifiers
} from '.'
import type { CityTraitState } from './game'

export type GigEconomyData = Partial<
  Pick<Venue, 'capacity' | 'diff' | 'difficulty' | 'name'>
> & {
  price?: number
  pay?: number
  [key: string]: unknown
}

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

export type GigStatsLike = {
  misses?: number
  peakHype?: number
  [key: string]: unknown
}

export type BandInventoryLike = {
  shirts?: number
  hoodies?: number
  cds?: number
  patches?: number
  vinyl?: number
  [key: string]: unknown
}

export type MapPoint = {
  x?: number
  y?: number
  venue?: {
    x?: number
    y?: number
  }
  [key: string]: unknown
}

export type GigFinancialParams = {
  gigData: GigEconomyData
  performanceScore: number
  modifiers: Partial<GigModifiers>
  bandInventory: BandInventoryLike
  playerState?: Pick<PlayerState, 'fame'> | null
  gigStats: GigStatsLike
  context?: EconomyContext
}

export type KabelsalatResults = {
  isPoweredOn?: boolean
  timeLeft?: number
  voidSurgesPurged?: number
}
