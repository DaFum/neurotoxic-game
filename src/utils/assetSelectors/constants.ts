import type { AssetModifiers } from '../../types/assets'

/**
 * The baseline immutable modifiers representing a neutral asset state.
 *
 * @remarks
 * This object is used as a foundation for accumulating net asset effects. It prevents undefined lookups during calculations by initializing all fields to 1.0 (for multipliers) or 0 (for flat bonuses), and sets all boolean flags to false.
 */
export const NEUTRAL_ASSET_MODIFIERS: AssetModifiers = Object.freeze({
  fuelMultiplier: 1.0,
  merchCostMultiplier: 1.0,
  songCostMultiplier: 1.0,
  trainingCostMultiplier: 1.0,
  baseRiskChanceMultiplier: 1.0,
  staminaRegenBonusPerDay: 0,
  travelStaminaRegen: 0,
  merchCapacityBonus: 0,
  songQualityBonus: 0,
  avgMerchSalePriceBonus: 0,
  famePassivePerDay: 0,
  bandMoodPerDay: 0,
  tipBonusGigs: 0,
  flags: Object.freeze({
    infightingDamper: false,
    enablesReRecording: false,
    enablesLimitedEditions: false,
    reducesTheftRiskTravel: false
  })
}) as AssetModifiers

/**
 * The numerical durability threshold below which an asset module is considered non-functional.
 *
 * @remarks
 * If an asset's condition falls below this value, its modifiers and bonuses are entirely negated in state calculations.
 */
export const BROKEN_THRESHOLD = 20
