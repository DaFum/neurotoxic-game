import type { GameState } from '../../types'
import type { AssetModifiers, LongTermAsset } from '../../types/assets'
import { calculateGuaranteedDailyCost } from '../economyEngine'
import {
  getAssetTotalUpkeep,
  getAssetAggregateBoni,
  getAssetTotalDailyRevenue
} from './assetFinancials'
import { NEUTRAL_ASSET_MODIFIERS, BROKEN_THRESHOLD } from './constants'

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
    // Use !== undefined rather than truthy checks: a multiplier of 0 is
    // semantically valid (e.g., a module granting "free fuel") and must be
    // applied. Truthy checks would silently drop it as if undefined.
    if (b.fuelMultiplier !== undefined) m.fuelMultiplier *= b.fuelMultiplier
    if (b.merchCostMultiplier !== undefined)
      m.merchCostMultiplier *= b.merchCostMultiplier
    if (b.songCostMultiplier !== undefined)
      m.songCostMultiplier *= b.songCostMultiplier
    if (b.trainingCostMultiplier !== undefined)
      m.trainingCostMultiplier *= b.trainingCostMultiplier
    if (b.baseRiskChanceMultiplier !== undefined)
      m.baseRiskChanceMultiplier *= b.baseRiskChanceMultiplier
    m.staminaRegenBonusPerDay += b.staminaRegenBonusPerDay ?? 0
    m.travelStaminaRegen += b.travelStaminaRegen ?? 0
    m.merchCapacityBonus += b.merchCapacityBonus ?? 0
    m.songQualityBonus += b.songQualityBonus ?? 0
    m.avgMerchSalePriceBonus += b.avgMerchSalePriceBonus ?? 0
    m.famePassivePerDay += b.famePassivePerDay ?? 0
    m.bandMoodPerDay += b.bandMoodPerDay ?? 0
    m.tipBonusGigs += b.tipBonusGigs ?? 0
    m.flags.infightingDamper ||= b.infightingDamper ?? false
    m.flags.enablesReRecording ||= b.enablesReRecording ?? false
    m.flags.enablesLimitedEditions ||= b.enablesLimitedEditions ?? false
    m.flags.enablesBulkProduction ||= b.enablesBulkProduction ?? false
    m.flags.reducesTheftRiskTravel ||= b.reducesTheftRiskTravel ?? false
  }
  return m
}

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
 * @param state - Current game state containing player, band, social, asset, and liability slices.
 * @returns Guaranteed daily cost plus asset upkeep and liability payments, minus asset revenue.
 */
export const getTotalDailyObligations = (state: GameState): number => {
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
        if (l) liabilityPayments += l.dailyPayment
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
        if (l) sum += l.principalRemaining
      }
    }
  }
  return sum
}
