/**
 * Validates if a contraband stash item can be used based on the current selection.
 * @param {Object} item - The contraband item.
 * @param {string|null} selectedMember - The ID of the currently selected band member.
 * @returns {Object} Validation result { isValid, errorKey, defaultMessage }
 */
import type { ValidationResult } from '../types/validation'

type StashItemLike = {
  id?: string
  name?: string
  effectType?: string
  type?: string
}

export const validateStashItemSelection = (
  item: StashItemLike,
  selectedMember: string | null | undefined
): ValidationResult => {
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
export const getStashItemUseMessage = (
  item: StashItemLike,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  const itemName = item.name ?? item.id ?? 'ui:item.unknown'
  const i18nKey = item.id
    ? `items:contraband.${item.id}.name`
    : 'ui:item.unknown'
  const translatedName = t(i18nKey, { defaultValue: item.name ?? itemName })
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
