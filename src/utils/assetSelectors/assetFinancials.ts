import type { GameState } from '../../types'
import type {
  AssetBoni,
  AssetKind,
  AssetModule,
  LongTermAsset
} from '../../types/assets'
import { MODULE_REGISTRY } from '../assetModuleRegistry'
import { CHASSIS_CONFIG } from '../assetConfig'
import { finiteNumberOr } from '../finiteNumber'
import { BROKEN_THRESHOLD } from './constants'

export const calculateChassisGrossSaleValue = (
  asset: LongTermAsset,
  currentDay: unknown
): number | null => {
  const configTier =
    CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[asset.chassisTier]
  if (!configTier) return null

  const daysOwned = Math.max(
    0,
    finiteNumberOr(currentDay, 0) - finiteNumberOr(asset.acquiredOnDay, 0)
  )
  const conditionFactor = finiteNumberOr(asset.condition, 0) / 100
  const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)

  let moduleRefunds = 0
  for (const slot of asset.slots) {
    if (!slot.installedModuleId) continue
    if (!Object.hasOwn(MODULE_REGISTRY, slot.installedModuleId)) continue
    const moduleInfo = MODULE_REGISTRY[slot.installedModuleId]
    if (!moduleInfo) continue
    moduleRefunds +=
      finiteNumberOr(moduleInfo.cost, 0) *
      finiteNumberOr(moduleInfo.removalRefundFraction, 0)
  }

  return configTier.price * conditionFactor * depreciation + moduleRefunds
}

/**
 * Reads the installed modules of an asset by resolving slot ids against the registry.
 *
 * @param asset - Asset whose slots should be inspected.
 * @returns Installed module definitions in slot order, excluding unknown module ids.
 */
const getInstalledModules = (asset: LongTermAsset): AssetModule[] => {
  const out: AssetModule[] = []
  for (const s of asset.slots) {
    if (s.installedModuleId === null) continue
    // Object.hasOwn guards against hostile module ids like 'hasOwnProperty'
    // or 'constructor' that would otherwise reach prototype properties.
    if (!Object.hasOwn(MODULE_REGISTRY, s.installedModuleId)) continue
    const m = MODULE_REGISTRY[s.installedModuleId]
    if (m) out.push(m)
  }
  return out
}

/** Boni summed across modules, identity 0. */
const ADDITIVE_BONI_KEYS = [
  'baseDailyRevenueDelta',
  'upkeepDelta',
  'staminaRegenBonusPerDay',
  'travelStaminaRegen',
  'merchCapacityBonus',
  'songQualityBonus',
  'avgMerchSalePriceBonus',
  'famePassivePerDay',
  'bandMoodPerDay',
  'tipBonusGigs'
] as const satisfies readonly (keyof AssetBoni)[]

/** Boni multiplied across modules, identity 1.0. */
const MULTIPLICATIVE_BONI_KEYS = [
  'fuelMultiplier',
  'merchCostMultiplier',
  'songCostMultiplier',
  'trainingCostMultiplier',
  'baseRiskChanceMultiplier',
  'diyRiskMultiplier'
] as const satisfies readonly (keyof AssetBoni)[]

/** Boolean flags OR-ed across modules, identity false. */
const FLAG_BONI_KEYS = [
  'infightingDamper',
  'enablesReRecording',
  'enablesLimitedEditions',
  'reducesTheftRiskTravel'
] as const satisfies readonly (keyof AssetBoni)[]

/**
 * Aggregates the boni from all installed modules on an asset into a single
 * AssetBoni object. Multiplier fields are multiplied (identity 1.0), additive
 * fields summed (identity 0), boolean flags OR-ed.
 *
 * Assets with condition less than 20 are treated as broken and contribute no boni —
 * this gives a clear gameplay signal that repair is needed before bonuses
 * apply again.
 *
 * @param asset - Asset whose installed modules should be aggregated.
 * @returns Combined boni contributed by active installed modules, or an empty object when the asset is broken.
 */
export const getAssetAggregateBoni = (asset: LongTermAsset): AssetBoni => {
  if (asset.condition < BROKEN_THRESHOLD) return {}
  const agg: AssetBoni = {}
  for (const m of getInstalledModules(asset)) {
    const b = m.boni
    for (const key of ADDITIVE_BONI_KEYS) {
      const value = b[key]
      if (value !== undefined) agg[key] = (agg[key] ?? 0) + value
    }
    for (const key of MULTIPLICATIVE_BONI_KEYS) {
      const value = b[key]
      if (value !== undefined) agg[key] = (agg[key] ?? 1.0) * value
    }
    for (const key of FLAG_BONI_KEYS) {
      const value = b[key]
      if (value !== undefined) agg[key] = agg[key] || value
    }
  }
  return agg
}

/**
 * Calculates daily upkeep of an asset including module-provided deltas.
 *
 * @param asset - Asset whose upkeep should be calculated.
 * @returns Daily upkeep after installed module boni are applied.
 */
export const getAssetTotalUpkeep = (asset: LongTermAsset): number =>
  asset.baseUpkeep + (getAssetAggregateBoni(asset).upkeepDelta ?? 0)

/**
 * Daily revenue scaled by condition. A broken asset (condition less than 20) returns
 * 0 — the aggregate-boni neutralization only zeroes the delta, but
 * `baseDailyRevenue` is a chassis field and would otherwise still pay out
 * `base * (condition/100)`. Explicit guard keeps broken assets fully silent
 * so the bankruptcy check sees the real obligation.
 *
 * @param asset - Asset whose revenue should be calculated.
 * @returns Daily revenue after module deltas and condition scaling.
 */
export const getAssetTotalDailyRevenue = (asset: LongTermAsset): number => {
  if (asset.condition < BROKEN_THRESHOLD) return 0
  const base = asset.baseDailyRevenue
  const delta = getAssetAggregateBoni(asset).baseDailyRevenueDelta ?? 0
  return (base + delta) * (asset.condition / 100)
}

/**
 * Checks whether an asset kind is already owned or pending through crowdfunding.
 *
 * @param state - State slice containing owned assets and active crowdfund campaigns.
 * @param kind - Asset kind to look up.
 * @returns True when the kind is already owned or has an active acquisition campaign.
 */
export const hasActiveAssetAcquisition = (
  state: Pick<GameState, 'assets' | 'crowdfundCampaigns'>,
  kind: AssetKind
): boolean => {
  const assets = Array.isArray(state.assets) ? state.assets : []
  if (assets.some(a => a?.kind === kind)) return true

  const campaigns = Array.isArray(state.crowdfundCampaigns)
    ? state.crowdfundCampaigns
    : []
  return campaigns.some(c => c?.assetSpec?.kind === kind)
}
