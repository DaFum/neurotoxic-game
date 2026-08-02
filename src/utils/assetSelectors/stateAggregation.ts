import type { GameState } from '../../types'
import type { AssetModifiers, LongTermAsset } from '../../types/assets'
import { calculateGuaranteedDailyCost } from '../economy'
import {
  getAssetTotalUpkeep,
  getAssetAggregateBoni,
  getAssetTotalDailyRevenue
} from './assetFinancials'
import {
  NEUTRAL_ASSET_MODIFIERS,
  BROKEN_THRESHOLD,
  MULTIPLIER_MODIFIER_KEYS,
  ADDITIVE_MODIFIER_KEYS,
  FLAG_MODIFIER_KEYS
} from './constants'
import { finiteNumberOr } from '../finiteNumber'

/**
 * Combines the boni from all non-broken assets into a single aggregate
 * AssetModifiers object, applying neutral baselines for missing factors.
 *
 * @param assets - Array of assets whose boni should be aggregated.
 * @returns Combined modifier factors, with identity defaults for empty or broken pools.
 */
export const getActiveAssetModifiers = (
  assets: readonly LongTermAsset[]
): AssetModifiers => {
  const m: AssetModifiers = {
    ...NEUTRAL_ASSET_MODIFIERS,
    flags: { ...NEUTRAL_ASSET_MODIFIERS.flags }
  }
  for (const a of assets) {
    if (a.condition < BROKEN_THRESHOLD) continue
    const b = getAssetAggregateBoni(a)
    for (const key of MULTIPLIER_MODIFIER_KEYS) {
      // finiteNumberOr with an identity fallback of 1: a missing or non-finite
      // multiplier must be a no-op, while a multiplier of 0 is semantically
      // valid (e.g. a module granting "free fuel") and is preserved.
      m[key] *= finiteNumberOr(b[key], 1)
    }
    for (const key of ADDITIVE_MODIFIER_KEYS) {
      // `?? 0` would let a NaN bonus poison every downstream economy figure.
      m[key] += finiteNumberOr(b[key], 0)
    }
    for (const key of FLAG_MODIFIER_KEYS) {
      m.flags[key] ||= b[key] ?? false
    }
  }
  return m
}

/**
 * The state slices {@link getTotalDailyObligations} reads. Narrower than
 * `GameState` so callers can assemble the five slices directly instead of
 * casting a partial object.
 */
export type DailyObligationsState = Pick<
  GameState,
  'player' | 'band' | 'social' | 'assets' | 'liabilities'
>

/**
 * Sum of all daily obligations that the bankruptcy check must cover:
 *
 *   guaranteedDailyCost + assetUpkeep - assetRevenue + liabilityPayments
 *
 * Asset revenue offsets upkeep when assets are productive (rented rehearsal
 * space, studio session bookings). Liability payments are flat loan
 * installments (or zero for active crowdfund campaigns, since crowdfund
 * resolution doesn't bill daily).
 *
 * @param state - Player, band, social, asset, and liability slices.
 * @returns Guaranteed daily cost plus asset upkeep and liability payments, minus asset revenue.
 */
export const getTotalDailyObligations = (
  state: DailyObligationsState
): number => {
  const base = calculateGuaranteedDailyCost(
    state.player,
    state.band,
    state.social
  )
  let assetUpkeep = 0
  let assetRevenue = 0
  const assets = Array.isArray(state.assets) ? state.assets : []
  for (const a of assets) {
    assetUpkeep += getAssetTotalUpkeep(a)
    assetRevenue += getAssetTotalDailyRevenue(a)
  }
  let liabilityPayments = 0
  if (state.liabilities) {
    for (const key in state.liabilities) {
      if (Object.hasOwn(state.liabilities, key)) {
        const l = state.liabilities[key]
        if (l) liabilityPayments += finiteNumberOr(l.dailyPayment, 0)
      }
    }
  }
  return base + assetUpkeep - assetRevenue + liabilityPayments
}

/**
 * Sums all remaining liability principal.
 *
 * @param state - Current game state containing liabilities.
 * @returns Total outstanding debt principal.
 */
export const getTotalDebt = (state: GameState): number => {
  let sum = 0
  if (state.liabilities) {
    for (const key in state.liabilities) {
      if (Object.hasOwn(state.liabilities, key)) {
        const l = state.liabilities[key]
        if (l) sum += finiteNumberOr(l.principalRemaining, 0)
      }
    }
  }
  return sum
}
