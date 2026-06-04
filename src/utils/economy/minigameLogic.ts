import { clamp0to100, finiteNumberOr } from '../gameStateUtils'
import { bandHasTrait } from '../traitUtils'
import type { BandState } from '../../types'

export const calculateTravelMinigameResult = (
  damageTaken: unknown,
  itemsCollected: unknown
) => {
  // 50% damage scaling: 100 damage -> 50 condition loss
  const safeDamageTaken = Number.isFinite(Number(damageTaken))
    ? Number(damageTaken)
    : 0
  const conditionLoss = Math.floor(Math.max(0, safeDamageTaken) / 2)

  // Fuel bonus re-enabled: each fuel item grants 0.5 liters of fuel bonus
  let fuelItems = 0
  let voidHazardHits = 0
  if (Array.isArray(itemsCollected)) {
    for (const item of itemsCollected) {
      if (item === 'FUEL') fuelItems++
      if (item === 'VOID_HAZARD') voidHazardHits++
    }
  }
  const fuelBonus = fuelItems * 0.5

  return { conditionLoss, fuelBonus, voidHazardHits }
}

/**
 * Calculates effects of Roadie Minigame results.
 * @param {number} equipmentDamage - Total equipment damage.
 * @param {object} bandState - Current band traits/state used by bandHasTrait.
 * @returns {object} { stress, repairCost }
 */
export const calculateRoadieMinigameResult = (
  equipmentDamage: unknown,
  bandState: Pick<BandState, 'members'> | null | undefined,
  contrabandDelivered: number = 0
) => {
  const safeEquipmentDamage = Number.isFinite(Number(equipmentDamage))
    ? Number(equipmentDamage)
    : 0
  const safeDamage = Math.max(0, safeEquipmentDamage)
  const stress = Math.floor(safeDamage / 5)
  let repairCost = Math.floor(safeDamage * 2)

  // Gear Nerd Trait: 20% discount on repairs
  if (bandHasTrait(bandState, 'gear_nerd')) {
    repairCost = Math.floor(repairCost * 0.8)
  }

  // Brutalist neurotoxic payout
  const safeContraband = Math.max(0, finiteNumberOr(contrabandDelivered, 0))
  const contrabandBonus = safeContraband * 50

  return { stress, repairCost, contrabandBonus }
}

/**
 * Calculates outcome for Amp Calibration minigame
 * @param {number} score - 0 to 100
 * @param {Object} bandState
 * @returns {Object} { stress, reward }
 */
export const calculateAmpCalibrationResult = (
  score: unknown,
  bandState: Pick<BandState, 'members'> | null | undefined,
  voidResonance: number = 0,
  purgesUsed: number = 0,
  hijacksOverridden: number = 0
) => {
  let numScore = Number(score)
  if (!Number.isFinite(numScore)) {
    numScore = 0
  }
  let numResonance = Number(voidResonance)
  if (!Number.isFinite(numResonance)) {
    numResonance = 0
  }
  const safeScore = clamp0to100(numScore)
  const safeResonance = clamp0to100(numResonance)
  let stress = 0
  let reward = 0

  if (safeScore < 50) {
    // Failure or poor performance
    stress = Math.floor((50 - safeScore) / 2)
  } else {
    // Success
    reward = Math.floor(safeScore)

    // Tech Wizard trait increases rewards
    if (bandHasTrait(bandState, 'tech_wizard')) {
      reward = Math.floor(reward * 1.5)
    }

    // Void Resonance converts to pure money at a 2x rate only on success
    reward += Math.floor(safeResonance * 2)
  }

  // Stress penalty for relying on neurotoxic purges
  const safePurgesUsed = Math.max(0, finiteNumberOr(purgesUsed, 0))
  stress += Math.floor(safePurgesUsed * 5)

  // Kranker Schrank Hijack bonuses/mitigations
  const safeHijacksOverridden = Math.max(
    0,
    finiteNumberOr(hijacksOverridden, 0)
  )
  reward += safeHijacksOverridden * 10
  stress = Math.max(0, stress - safeHijacksOverridden * 2)

  return { stress, reward }
}

/**
 * Calculates outcome for Kabelsalat minigame
 * @param {Object} results - { isPoweredOn: boolean, timeLeft: number }
 * @param {Object} bandState
 * @returns {Object} { stress, reward }
 */
export const calculateKabelsalatMinigameResult = (
  results: unknown,
  bandState: Pick<BandState, 'members'> | null | undefined
) => {
  // Treat results as untrusted input: read only own properties and validate
  // types so inherited props or getter side-effects cannot leak through.
  const source =
    results && typeof results === 'object'
      ? (results as Record<string, unknown>)
      : {}
  const isPoweredOn =
    Object.hasOwn(source, 'isPoweredOn') && source.isPoweredOn === true
  const rawTimeLeft = Object.hasOwn(source, 'timeLeft')
    ? source.timeLeft
    : undefined
  const timeLeft =
    typeof rawTimeLeft === 'number' && Number.isFinite(rawTimeLeft)
      ? rawTimeLeft
      : 0
  let stress = 0
  let reward = 0

  if (!isPoweredOn) {
    // Failure! Stress for everyone.
    stress = 15
  } else {
    // Success! Reward based on time remaining
    const timeBonus = Math.max(0, Math.floor(timeLeft / 5))
    reward = Math.max(0, 60 + timeBonus * 15) // Base 60, scaling better for quick completion

    // Tech Wizard trait increases rewards
    if (bandHasTrait(bandState, 'tech_wizard')) {
      reward = Math.floor(reward * 1.5)
    }
  }

  // Stress penalty for relying on neurotoxic purges
  const rawPurged = Object.hasOwn(source, 'voidSurgesPurged')
    ? source.voidSurgesPurged
    : undefined
  let safePurgesUsed = Number(rawPurged)
  if (!Number.isFinite(safePurgesUsed) || safePurgesUsed < 0) {
    safePurgesUsed = 0
  }
  // Clamp to prevent overflow when multiplying by 5
  safePurgesUsed = Math.min(
    Math.floor(safePurgesUsed),
    Math.floor(Number.MAX_SAFE_INTEGER / 5)
  )
  stress += safePurgesUsed * 5

  return { stress, reward }
}
