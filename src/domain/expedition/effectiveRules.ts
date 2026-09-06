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
import { getExpeditionRegion } from '../../data/expedition/regions'
import { getExpeditionTourType } from '../../data/expedition/tourTypes'
import { finiteNumberOr } from '../../utils/finiteNumber'

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
 * Reads one numeric field's contribution from a Region or Tour profile.
 *
 * @param profile - The partial numeric profile, if the id resolved.
 * @param key - Field being composed.
 * @param identity - Value that leaves the field unchanged (1 for a
 * multiplier, 0 for an additive starting value).
 * @returns The contribution, or the identity when the profile does not set it.
 *
 * @remarks
 * Region and Tour profiles are deliberately partial: a Region states only what
 * it changes. Reading through this helper is what keeps that from becoming an
 * id-specific branch here.
 */
const profileValue = (
  profile: Partial<ExpeditionNumericRules> | undefined,
  key: keyof ExpeditionNumericRules,
  identity: number
): number => finiteNumberOr(profile?.[key], identity)

/**
 * Evaluates the full composite rules for the current Expedition state.
 *
 * @param state - Current game state.
 * @returns Frozen effective rules structure.
 *
 * @remarks
 * The one composition path, in the order the design reads it:
 *
 * ```text
 * Base -> Region -> Tour Type -> Chassis -> installed modules -> Crew
 *      -> Starter Perk -> Run Draft traits -> Tour Pressure -> Nemesis
 *      -> Legendary flags
 * ```
 *
 * Every stage contributes through a profile it owns. No consumer anywhere
 * branches on a Region, Tour, chassis or trait id to reach a number — if a
 * rule is not composed here, it does not exist.
 */
export const getEffectiveExpeditionRules = (
  state: GameState
): EffectiveExpeditionRules => {
  const loadout = state.expedition?.loadout ?? null
  const regionNumeric = getExpeditionRegion(loadout?.regionId)?.numeric
  const tourNumeric = getExpeditionTourType(loadout?.tourTypeId)?.numeric
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
    // Additive rather than multiplied: a Tour that starts the run hot adds
    // Heat, it does not scale a zero.
    startingHeat:
      BASE_EXPEDITION_NUMERIC_RULES.startingHeat +
      profileValue(regionNumeric, 'startingHeat', 0) +
      profileValue(tourNumeric, 'startingHeat', 0),
    startingSpareParts:
      BASE_EXPEDITION_NUMERIC_RULES.startingSpareParts +
      profileValue(regionNumeric, 'startingSpareParts', 0) +
      profileValue(tourNumeric, 'startingSpareParts', 0),
    fuelConsumptionMultiplier:
      profileValue(regionNumeric, 'fuelConsumptionMultiplier', 1) *
      profileValue(tourNumeric, 'fuelConsumptionMultiplier', 1) *
      chassisProfile.fuelConsumptionMultiplier *
      moduleProfile.fuelConsumptionMultiplier *
      (crewProfile.fuelConsumptionMultiplier ?? 1),
    finaleRewardMultiplier:
      profileValue(regionNumeric, 'finaleRewardMultiplier', 1) *
      profileValue(tourNumeric, 'finaleRewardMultiplier', 1) *
      (drafts.has('reckless_encore') ? 1.2 : 1),
    extractionRetentionMultiplier:
      profileValue(regionNumeric, 'extractionRetentionMultiplier', 1) *
      profileValue(tourNumeric, 'extractionRetentionMultiplier', 1) *
      (drafts.has('reckless_encore') ? 0.85 : 1),
    completionMultiplier:
      profileValue(regionNumeric, 'completionMultiplier', 1) *
      profileValue(tourNumeric, 'completionMultiplier', 1),
    rareRewardMultiplier:
      profileValue(regionNumeric, 'rareRewardMultiplier', 1) *
      profileValue(tourNumeric, 'rareRewardMultiplier', 1),
    repairCostMultiplier:
      profileValue(regionNumeric, 'repairCostMultiplier', 1) *
      profileValue(tourNumeric, 'repairCostMultiplier', 1),
    rivalEventWeightMultiplier:
      profileValue(regionNumeric, 'rivalEventWeightMultiplier', 1) *
      profileValue(tourNumeric, 'rivalEventWeightMultiplier', 1) *
      ((rivalRecord?.history.nemesisLevel ?? 0) >= 1
        ? 1.35 * hostileRivalMultiplier
        : hostileRivalMultiplier),
    technicalWearMultiplier:
      profileValue(regionNumeric, 'technicalWearMultiplier', 1) *
      profileValue(tourNumeric, 'technicalWearMultiplier', 1) *
      (crewProfile.technicalWearMultiplier ?? 1),
    fieldRepairEfficiency:
      chassisProfile.fieldRepairEfficiency +
      (crewProfile.fieldRepairEfficiency ?? 0),
    contractRewardMultiplier:
      profileValue(regionNumeric, 'contractRewardMultiplier', 1) *
      profileValue(tourNumeric, 'contractRewardMultiplier', 1) *
      (crewProfile.contractRewardMultiplier ?? 1),
    exposureGainMultiplier:
      profileValue(regionNumeric, 'exposureGainMultiplier', 1) *
      profileValue(tourNumeric, 'exposureGainMultiplier', 1) *
      (crewProfile.exposureGainMultiplier ?? 1),
    heatGainMultiplier:
      profileValue(regionNumeric, 'heatGainMultiplier', 1) *
      profileValue(tourNumeric, 'heatGainMultiplier', 1) *
      (crewProfile.heatGainMultiplier ?? 1),
    authorityEventWeightMultiplier:
      profileValue(regionNumeric, 'authorityEventWeightMultiplier', 1) *
      profileValue(tourNumeric, 'authorityEventWeightMultiplier', 1) *
      chassisProfile.authorityEventWeightMultiplier *
      jammerReduction *
      (crewProfile.authorityEventWeightMultiplier ?? 1) *
      (drafts.has('cold_trail') ? 0.5 : 1),
    roadWearMultiplier:
      profileValue(regionNumeric, 'roadWearMultiplier', 1) *
      profileValue(tourNumeric, 'roadWearMultiplier', 1) *
      chassisProfile.roadWearMultiplier *
      moduleProfile.roadWearMultiplier *
      (crewProfile.roadWearMultiplier ?? 1) *
      (drafts.has('road_warrior') ? 0.7 : 1),
    crewStressMultiplier:
      profileValue(regionNumeric, 'crewStressMultiplier', 1) *
      profileValue(tourNumeric, 'crewStressMultiplier', 1) *
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
