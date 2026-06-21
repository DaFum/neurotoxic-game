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
export const getInstalledModules = (asset: LongTermAsset): AssetModule[] => {
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
    if (b.baseDailyRevenueDelta !== undefined)
      agg.baseDailyRevenueDelta =
        (agg.baseDailyRevenueDelta ?? 0) + b.baseDailyRevenueDelta
    if (b.upkeepDelta !== undefined)
      agg.upkeepDelta = (agg.upkeepDelta ?? 0) + b.upkeepDelta
    if (b.fuelMultiplier !== undefined)
      agg.fuelMultiplier = (agg.fuelMultiplier ?? 1.0) * b.fuelMultiplier
    if (b.merchCostMultiplier !== undefined)
      agg.merchCostMultiplier =
        (agg.merchCostMultiplier ?? 1.0) * b.merchCostMultiplier
    if (b.songCostMultiplier !== undefined)
      agg.songCostMultiplier =
        (agg.songCostMultiplier ?? 1.0) * b.songCostMultiplier
    if (b.trainingCostMultiplier !== undefined)
      agg.trainingCostMultiplier =
        (agg.trainingCostMultiplier ?? 1.0) * b.trainingCostMultiplier
    if (b.baseRiskChanceMultiplier !== undefined)
      agg.baseRiskChanceMultiplier =
        (agg.baseRiskChanceMultiplier ?? 1.0) * b.baseRiskChanceMultiplier
    if (b.diyRiskMultiplier !== undefined)
      agg.diyRiskMultiplier =
        (agg.diyRiskMultiplier ?? 1.0) * b.diyRiskMultiplier
    if (b.staminaRegenBonusPerDay !== undefined)
      agg.staminaRegenBonusPerDay =
        (agg.staminaRegenBonusPerDay ?? 0) + b.staminaRegenBonusPerDay
    if (b.travelStaminaRegen !== undefined)
      agg.travelStaminaRegen =
        (agg.travelStaminaRegen ?? 0) + b.travelStaminaRegen
    if (b.merchCapacityBonus !== undefined)
      agg.merchCapacityBonus =
        (agg.merchCapacityBonus ?? 0) + b.merchCapacityBonus
    if (b.songQualityBonus !== undefined)
      agg.songQualityBonus = (agg.songQualityBonus ?? 0) + b.songQualityBonus
    if (b.avgMerchSalePriceBonus !== undefined)
      agg.avgMerchSalePriceBonus =
        (agg.avgMerchSalePriceBonus ?? 0) + b.avgMerchSalePriceBonus
    if (b.famePassivePerDay !== undefined)
      agg.famePassivePerDay = (agg.famePassivePerDay ?? 0) + b.famePassivePerDay
    if (b.bandMoodPerDay !== undefined)
      agg.bandMoodPerDay = (agg.bandMoodPerDay ?? 0) + b.bandMoodPerDay
    if (b.tipBonusGigs !== undefined)
      agg.tipBonusGigs = (agg.tipBonusGigs ?? 0) + b.tipBonusGigs
    if (b.infightingDamper !== undefined)
      agg.infightingDamper = agg.infightingDamper || b.infightingDamper
    if (b.enablesReRecording !== undefined)
      agg.enablesReRecording = agg.enablesReRecording || b.enablesReRecording
    if (b.enablesLimitedEditions !== undefined)
      agg.enablesLimitedEditions =
        agg.enablesLimitedEditions || b.enablesLimitedEditions
    if (b.enablesBulkProduction !== undefined)
      agg.enablesBulkProduction =
        agg.enablesBulkProduction || b.enablesBulkProduction
    if (b.reducesTheftRiskTravel !== undefined)
      agg.reducesTheftRiskTravel =
        agg.reducesTheftRiskTravel || b.reducesTheftRiskTravel
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
  // ⚡ BOLT OPTIMIZATION: Replaced Array.some() with procedural loop to avoid array iteration overhead.
  for (let i = 0; i < assets.length; i++) {
    if (assets[i]?.kind === kind) return true
  }

  const campaigns = Array.isArray(state.crowdfundCampaigns)
    ? state.crowdfundCampaigns
    : []
  // ⚡ BOLT OPTIMIZATION: Replaced Array.some() with procedural loop to avoid array iteration overhead.
  for (let i = 0; i < campaigns.length; i++) {
    if (campaigns[i]?.assetSpec?.kind === kind) return true
  }
  return false
}
