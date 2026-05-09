import type { BandMember } from '../types/game'

export const validateHealMember = (
  member: BandMember | null | undefined,
  playerMoney: number,
  healCostMoney: number
) => {
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

export const validateEnhanceMember = (
  member: BandMember | null | undefined,
  trait: string,
  playerFame: number,
  enhanceCostFame: number
) => {
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
