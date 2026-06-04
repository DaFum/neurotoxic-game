import type { BandMember } from '../types'
import type { ValidationResult } from '../types/validation'

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
      errorKey: 'ui:clinic.not_enough_fame',
      defaultMessage: 'Not enough fame. The void demands sacrifice.'
    }
  }

  return { isValid: true }
}
