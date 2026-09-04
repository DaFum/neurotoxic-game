/**
 * Single effective-rules entrypoint for Roguelite Expedition.
 *
 * @remarks
 * All composable Expedition numeric and boolean rules flow through
 * {@link getEffectiveExpeditionRules}. G2 composes Base -\> Chassis -\> installed
 * modules. G3/G4/G5 extend this same pure resolver with Crew, Run Draft,
 * Region, Tour, Pressure, Nemesis, and Legendary inputs.
 */

import type { GameState } from '../../types'
import type { LongTermAsset } from '../../types/assets'
import type {
  EffectiveExpeditionRules,
  ExpeditionNumericRules,
  ExpeditionRuleFlags
} from '../../types/expedition'
import { getExpeditionChassisProfile } from './chassis'
import { aggregateExpeditionModuleProfiles } from './modules'

/**
 * Baseline numeric rules before chassis, module, crew, or tour modifiers.
 */
export const BASE_EXPEDITION_NUMERIC_RULES: Readonly<ExpeditionNumericRules> = {
  startingSpareParts: 0,
  startingHeat: 0,
  fuelConsumptionMultiplier: 1.0,
  roadWearMultiplier: 1.0,
  technicalWearMultiplier: 1.0,
  repairCostMultiplier: 1.0,
  fieldRepairEfficiency: 0.0,
  gigRewardMultiplier: 1.0,
  contractRewardMultiplier: 1.0,
  contractPenaltyMultiplier: 1.0,
  pressureRewardMultiplier: 1.0,
  heatGainMultiplier: 1.0,
  exposureGainMultiplier: 1.0,
  crewStressMultiplier: 1.0,
  extractionRetentionMultiplier: 1.0,
  rareRewardMultiplier: 1.0,
  completionMultiplier: 1.0,
  rivalEventWeightMultiplier: 1.0,
  authorityEventWeightMultiplier: 1.0,
  rivalRewardMultiplier: 1.0,
  finaleRewardMultiplier: 1.0,
  nodeIntelFloor: 0,
  explicitExtractionRareCarrySlots: 1
}

/**
 * Baseline rule flags before modifiers.
 */
export const BASE_EXPEDITION_RULE_FLAGS: Readonly<ExpeditionRuleFlags> = {
  fieldRepairNoHiddenDefect: false,
  fieldRepairMinimumCondition: 0,
  severeReliefBypass: false
}

/**
 * Resolves the committed tourbus asset, if any.
 */
const resolveCommittedTourbus = (state: GameState): LongTermAsset | null => {
  const assetId = state.expedition?.loadout?.activeTourbusAssetId
  if (!assetId || !Array.isArray(state.assets)) return null
  return (
    state.assets.find(a => a.id === assetId && a.kind === 'tourbus_chassis') ??
    null
  )
}

/**
 * Evaluates the full composite rules for the current Expedition state.
 *
 * @param state - Current game state.
 * @returns Frozen effective rules structure.
 */
export const getEffectiveExpeditionRules = (
  state: GameState
): EffectiveExpeditionRules => {
  const chassisAsset = resolveCommittedTourbus(state)
  const chassisProfile = getExpeditionChassisProfile(chassisAsset)

  const moduleIds = state.expedition?.loadout?.selectedTourbusModuleIds ?? []
  const moduleProfile = aggregateExpeditionModuleProfiles(moduleIds)

  // Bounded authority weighting reduction if jammer active
  const jammerReduction = moduleProfile.authorityIntelBonus > 0 ? 0.9 : 1.0

  const numeric: ExpeditionNumericRules = {
    ...BASE_EXPEDITION_NUMERIC_RULES,
    fuelConsumptionMultiplier:
      chassisProfile.fuelConsumptionMultiplier *
      moduleProfile.fuelConsumptionMultiplier,
    roadWearMultiplier:
      chassisProfile.roadWearMultiplier * moduleProfile.roadWearMultiplier,
    fieldRepairEfficiency: chassisProfile.fieldRepairEfficiency,
    crewStressMultiplier: chassisProfile.crewStressMultiplier,
    authorityEventWeightMultiplier:
      chassisProfile.authorityEventWeightMultiplier * jammerReduction,
    nodeIntelFloor: moduleProfile.authorityIntelBonus as 0 | 1 | 2,
    explicitExtractionRareCarrySlots: Math.max(
      1,
      Math.min(
        3,
        BASE_EXPEDITION_NUMERIC_RULES.explicitExtractionRareCarrySlots
      )
    )
  }

  const flags: ExpeditionRuleFlags = {
    ...BASE_EXPEDITION_RULE_FLAGS
  }

  const legendary: Record<string, boolean> = {}

  return {
    numeric,
    flags,
    legendary
  }
}
