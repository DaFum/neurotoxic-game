/**
 * Per-item merch demand profiles. Source of truth for prices and demand
 * curves consumed by economyEngine.calculateMerchIncome.
 */

export type CityGenre =
  | 'punk'
  | 'metal'
  | 'goth'
  | 'indie'
  | 'synth'
  | 'noise'
  | 'hardcore'

/**
 * City spending profile used to scale merch demand.
 */
export type SpendingProfile =
  | 'stingy'
  | 'average'
  | 'generous'
  | 'drunkards'
  | 'merch-hungry'

/**
 * Demand and pricing configuration for one merch item.
 */
export interface MerchItemProfile {
  /** Slug used as inventory key, price key, and i18n suffix. */
  key: string
  /** Default unit price in EUR. */
  defaultPrice: number
  /** Relative share of audience attention before all multipliers (0..1). */
  baseAppeal: number
  /** Price-elasticity strength. Greater than 1 punishes overpricing more steeply. */
  priceElasticity: number
  /** Multiplicative boosts by city genreBias. Missing genres default to 1.0. */
  genreAffinity: Partial<Record<CityGenre, number>>
  /** How much (peakHype/100 - 0.5) lifts demand. 0..1. */
  performanceSensitivity: number
  /** How much (misses/100) suppresses demand. 0..1. */
  missSensitivity: number
}

/**
 * Canonical merch item profiles keyed by inventory and price key.
 */
export const MERCH_PROFILES = {
  patches: {
    key: 'patches',
    defaultPrice: 5,
    baseAppeal: 0.4,
    priceElasticity: 0.8,
    genreAffinity: { punk: 1.6, hardcore: 1.5, metal: 1.3 },
    performanceSensitivity: 0.2,
    missSensitivity: 0.1
  },
  shirts: {
    key: 'shirts',
    defaultPrice: 20,
    baseAppeal: 0.35,
    priceElasticity: 1.0,
    genreAffinity: {},
    performanceSensitivity: 0.4,
    missSensitivity: 0.3
  },
  hoodies: {
    key: 'hoodies',
    defaultPrice: 45,
    baseAppeal: 0.15,
    priceElasticity: 1.4,
    genreAffinity: { goth: 1.5, metal: 1.4, noise: 1.3 },
    performanceSensitivity: 0.6,
    missSensitivity: 0.4
  },
  vinyl: {
    key: 'vinyl',
    defaultPrice: 35,
    baseAppeal: 0.1,
    priceElasticity: 1.5,
    genreAffinity: { indie: 1.7, synth: 1.5, goth: 1.3 },
    performanceSensitivity: 0.8,
    missSensitivity: 0.5
  },
  cds: {
    key: 'cds',
    defaultPrice: 15,
    baseAppeal: 0.05,
    priceElasticity: 0.9,
    genreAffinity: {},
    performanceSensitivity: 0.2,
    missSensitivity: 0.2
  },
  neuro_cutting_board: {
    key: 'neuro_cutting_board',
    defaultPrice: 25,
    baseAppeal: 0.08,
    priceElasticity: 1.2,
    genreAffinity: { noise: 1.8, synth: 1.5, hardcore: 1.2 },
    performanceSensitivity: 0.5,
    missSensitivity: 0.3
  },
  neuro_lunchbox: {
    key: 'neuro_lunchbox',
    defaultPrice: 30,
    baseAppeal: 0.07,
    priceElasticity: 1.3,
    genreAffinity: { noise: 1.8, synth: 1.5, punk: 1.2 },
    performanceSensitivity: 0.6,
    missSensitivity: 0.3
  },
  neuro_mug: {
    key: 'neuro_mug',
    defaultPrice: 20,
    baseAppeal: 0.12,
    priceElasticity: 1.1,
    genreAffinity: { noise: 1.7, synth: 1.4, goth: 1.3 },
    performanceSensitivity: 0.4,
    missSensitivity: 0.2
  },
  neuro_bowl: {
    key: 'neuro_bowl',
    defaultPrice: 22,
    baseAppeal: 0.09,
    priceElasticity: 1.2,
    genreAffinity: { noise: 1.7, synth: 1.4, hardcore: 1.1 },
    performanceSensitivity: 0.5,
    missSensitivity: 0.2
  }
} as const satisfies Record<string, MerchItemProfile>

/**
 * Merch demand multiplier by city spending profile.
 */
export const SPENDING_PROFILE_MERCH_MULTIPLIER = {
  stingy: 0.7,
  average: 1.0,
  generous: 1.2,
  drunkards: 0.9,
  'merch-hungry': 1.5
} as const satisfies Record<SpendingProfile, number>

/**
 * Backwards-compatible derived map. Re-exported by economyEngine.ts so
 * existing imports of DEFAULT_MERCH_PRICES keep working unchanged.
 */
export const DEFAULT_MERCH_PRICES: Record<string, number> = Object.fromEntries(
  Object.values(MERCH_PROFILES).map(p => [p.key, p.defaultPrice])
)
