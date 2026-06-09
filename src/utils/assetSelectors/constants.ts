import type { AssetModifiers } from '../../types/assets'

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
    enablesBulkProduction: false,
    reducesTheftRiskTravel: false
  })
}) as AssetModifiers

export const BROKEN_THRESHOLD = 20
