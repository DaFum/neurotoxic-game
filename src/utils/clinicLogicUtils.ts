import type {
  BandMember,
  ClinicAction,
  ClinicActionAvailability,
  ClinicActionState
} from '../types'
import type { ValidationResult } from '../types/validation'
import { CLINIC_CONFIG, CLINIC_GRAFT_COST } from '../context/gameConstants'
import { finiteNumberOr } from './finiteNumber'
import { hasTrait, NEURO_OVERCLOCK_TRAIT_ID } from './traitUtils'

/**
 * Validates whether a band member can be healed at the clinic.
 *
 * @param member - Target band member.
 * @param playerMoney - Current player money available for the heal.
 * @param healCostMoney - Money cost required by the clinic.
 * @returns Validation result with optional localized error metadata.
 */
export const validateHealMember = (
  member: BandMember | null | undefined,
  playerMoney: number,
  healCostMoney: number
): ValidationResult => {
  if (!member) return { isValid: false, silent: true }

  if (playerMoney < healCostMoney) {
    return {
      isValid: false,
      silent: false,
      errorKey: 'ui:clinic.not_enough_money',
      defaultMessage: 'Not enough money.'
    }
  }

  return { isValid: true }
}

/**
 * Validates whether a band member can receive a clinic trait enhancement.
 *
 * @param member - Target band member.
 * @param trait - Trait id to add.
 * @param playerFame - Current player fame available for the enhancement.
 * @param enhanceCostFame - Fame cost required by the clinic.
 * @returns Validation result with optional localized error metadata.
 */
export const validateEnhanceMember = (
  member: BandMember | null | undefined,
  trait: string,
  playerFame: number,
  enhanceCostFame: number
): ValidationResult => {
  if (!member) return { isValid: false, silent: true }

  // Intentional silent return: If the member already has the trait,
  // do nothing (no clinicEnhance or toast).
  if (member.traits && member.traits[trait]) {
    return { isValid: false, silent: true }
  }

  if (playerFame < enhanceCostFame) {
    return {
      isValid: false,
      silent: false,
      errorKey: 'ui:clinic.not_enough_fame',
      defaultMessage: 'Not enough fame. The void demands sacrifice.'
    }
  }

  return { isValid: true }
}

/**
 * Centralized evaluator for clinic action availability, affordability, and trait compatibility.
 *
 * @param action - The clinic action to evaluate (heal, enhance, graft, therapy).
 * @param state - Current player economic resources and computed costs.
 * @returns Availability status with localized error key and fallback message if blocked.
 */
export const getClinicActionAvailability = (
  action: ClinicAction,
  state: ClinicActionState
): ClinicActionAvailability => {
  const member = action.member
  if (!member || !member.id) {
    return {
      isAvailable: false,
      reasonKey: 'ui:clinic.invalidMember',
      defaultReason: 'Member unavailable'
    }
  }

  const spendableMoney = finiteNumberOr(
    state.spendableMoney,
    finiteNumberOr(state.player?.money, 0)
  )
  const playerFame = finiteNumberOr(
    state.fame,
    finiteNumberOr(state.player?.fame, 0)
  )

  switch (action.type) {
    case 'heal': {
      const healCost = finiteNumberOr(
        state.healCostMoney,
        CLINIC_CONFIG.HEAL_BASE_COST_MONEY
      )
      if (spendableMoney < healCost) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.notEnoughMoney',
          defaultReason: 'Not enough money'
        }
      }
      const isFullyHealed =
        member.stamina >= finiteNumberOr(member.staminaMax, 100) &&
        (CLINIC_CONFIG.HEAL_MOOD_GAIN <= 0 || member.mood >= 100)
      if (isFullyHealed) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.fullyHealed',
          defaultReason: 'Member is already fully healed'
        }
      }
      return { isAvailable: true }
    }

    case 'enhance': {
      const enhanceCost = finiteNumberOr(
        state.enhanceCostFame,
        CLINIC_CONFIG.ENHANCE_BASE_COST_FAME
      )
      if (playerFame < enhanceCost) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.notEnoughFame',
          defaultReason: 'Not enough fame'
        }
      }
      if (hasTrait(member, action.traitId)) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.alreadyEnhanced',
          defaultReason: 'Member already has this enhancement'
        }
      }
      return { isAvailable: true }
    }

    case 'graft': {
      const graftCost = finiteNumberOr(state.graftCostMoney, CLINIC_GRAFT_COST)
      if (spendableMoney < graftCost) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.notEnoughMoney',
          defaultReason: 'Not enough money'
        }
      }
      const traitId = action.traitId || NEURO_OVERCLOCK_TRAIT_ID
      if (hasTrait(member, traitId)) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.alreadyGrafted',
          defaultReason: 'Member already has this graft'
        }
      }
      return { isAvailable: true }
    }

    case 'therapy': {
      if (finiteNumberOr(member.mood, 0) >= 100) {
        return {
          isAvailable: false,
          reasonKey: 'ui:clinic.fullyRested',
          defaultReason: 'Member is already fully rested'
        }
      }
      return { isAvailable: true }
    }

    default:
      return { isAvailable: false }
  }
}

/**
 * Returns true if the specified clinic action can be performed given current state.
 */
export const canPerformClinicAction = (
  action: ClinicAction,
  state: ClinicActionState
): boolean => getClinicActionAvailability(action, state).isAvailable
