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
import { getCrewRuleContribution } from './crew'

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
 * Baseline rule flags active in any expedition before modifications.
 */
const BASE_EXPEDITION_RULE_FLAGS: Readonly<ExpeditionRuleFlags> = {
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

  const moduleIds =
    state.expedition?.loadout?.build?.selectedTourbusModuleIds ?? []
  const moduleProfile = aggregateExpeditionModuleProfiles(moduleIds)
  const crewProfile = getCrewRuleContribution(state)
  const drafts = new Set(state.expedition.runDraftTraitIds)
  const rivalRecord = state.rivalBand
    ? state.career.rivalsById[state.rivalBand.id]
    : undefined
  const hostileRivalMultiplier =
    rivalRecord?.history.relationship === 'respect' ||
    rivalRecord?.history.relationship === 'alliance'
      ? 0.65
      : 1

  // Bounded authority weighting reduction if jammer active
  const jammerReduction = moduleProfile.authorityIntelBonus > 0 ? 0.9 : 1.0

  const numeric: ExpeditionNumericRules = {
    ...BASE_EXPEDITION_NUMERIC_RULES,
    fuelConsumptionMultiplier:
      chassisProfile.fuelConsumptionMultiplier *
      moduleProfile.fuelConsumptionMultiplier *
      (crewProfile.fuelConsumptionMultiplier ?? 1),
    finaleRewardMultiplier: drafts.has('reckless_encore') ? 1.2 : 1,
    extractionRetentionMultiplier: drafts.has('reckless_encore') ? 0.85 : 1,
    rivalEventWeightMultiplier:
      (rivalRecord?.history.nemesisLevel ?? 0) >= 1
        ? 1.35 * hostileRivalMultiplier
        : hostileRivalMultiplier,
    technicalWearMultiplier: crewProfile.technicalWearMultiplier ?? 1,
    fieldRepairEfficiency:
      chassisProfile.fieldRepairEfficiency +
      (crewProfile.fieldRepairEfficiency ?? 0),
    contractRewardMultiplier: crewProfile.contractRewardMultiplier ?? 1,
    exposureGainMultiplier: crewProfile.exposureGainMultiplier ?? 1,
    heatGainMultiplier: crewProfile.heatGainMultiplier ?? 1,
    authorityEventWeightMultiplier:
      chassisProfile.authorityEventWeightMultiplier *
      jammerReduction *
      (crewProfile.authorityEventWeightMultiplier ?? 1) *
      (drafts.has('cold_trail') ? 0.5 : 1),
    roadWearMultiplier:
      chassisProfile.roadWearMultiplier *
      moduleProfile.roadWearMultiplier *
      (crewProfile.roadWearMultiplier ?? 1) *
      (drafts.has('road_warrior') ? 0.7 : 1),
    crewStressMultiplier:
      chassisProfile.crewStressMultiplier *
      (crewProfile.crewStressMultiplier ?? 1) *
      (drafts.has('crew_mediator') ? 0.7 : 1),
    nodeIntelFloor: Math.max(
      moduleProfile.authorityIntelBonus,
      drafts.has('backchannel') ? 1 : 0
    ) as 0 | 1 | 2,
    explicitExtractionRareCarrySlots: Math.max(
      1,
      Math.min(
        3,
        BASE_EXPEDITION_NUMERIC_RULES.explicitExtractionRareCarrySlots
      )
    )
  }

  const flags: ExpeditionRuleFlags = {
    ...BASE_EXPEDITION_RULE_FLAGS,
    fieldRepairNoHiddenDefect: drafts.has('field_engineer'),
    fieldRepairMinimumCondition: drafts.has('field_engineer') ? 55 : 0
  }

  const legendary: Record<string, boolean> = {}

  return {
    numeric,
    flags,
    legendary
  }
}
