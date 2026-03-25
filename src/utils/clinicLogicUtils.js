export const validateHealMember = (member, playerMoney, healCostMoney) => {
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
  member,
  trait,
  playerFame,
  enhanceCostFame
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

export const calculateHealAmounts = (member, healStaminaGain, healMoodGain) => {
  const maxStamina = Number.isFinite(member.staminaMax) ? member.staminaMax : 100
  const currentStamina = member.stamina || 0
  const healAmountApplied = Math.min(Math.max(0, healStaminaGain), Math.max(0, maxStamina - currentStamina))

  const currentMood = member.mood || 0
  const moodAmountApplied = Math.min(Math.max(0, healMoodGain), Math.max(0, 100 - currentMood))

  return {
    healAmountApplied,
    moodAmountApplied
  }
}
