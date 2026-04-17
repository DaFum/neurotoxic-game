/**
 * Validates if a contraband stash item can be used based on the current selection.
 * @param {Object} item - The contraband item.
 * @param {string|null} selectedMember - The ID of the currently selected band member.
 * @returns {Object} Validation result { isValid, errorKey, defaultMessage }
 */
export const validateStashItemSelection = (item, selectedMember) => {
  if (
    (item.effectType === 'stamina' || item.effectType === 'mood') &&
    !selectedMember
  ) {
    return {
      isValid: false,
      errorKey: 'ui:stash.selectMemberFirst',
      defaultMessage: 'Select a band member first!'
    }
  }
  return { isValid: true }
}

/**
 * Generates the toast message payload for when a stash item is used.
 * @param {Object} item - The contraband item.
 * @param {Function} t - The translation function.
 * @returns {Object} Message payload { key, options }
 */
export const getStashItemUseMessage = (item, t) => {
  const translatedName = t(item.name, { defaultValue: item.name })
  const messageAction =
    item.type === 'consumable'
      ? t('ui:stash.actionUsed', { defaultValue: 'Used' })
      : t('ui:stash.actionApplied', { defaultValue: 'Applied' })

  return {
    key: 'ui:stash.itemUsed',
    options: {
      itemName: translatedName,
      action: messageAction,
      defaultValue: `${messageAction} ${translatedName}!`
    }
  }
}
