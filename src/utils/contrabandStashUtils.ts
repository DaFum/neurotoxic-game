import type { BandState } from '../types'
import type { ValidationResult } from '../types/validation'
import { CONTRABAND_BY_ID } from '../data/contraband'
import {
  applySharedBandEffect,
  EQUIPMENT_APPLY_ON_ADD_EFFECTS
} from './contrabandEffects'
import { isFiniteNumber } from './finiteNumber'
import { isForbiddenKey } from './objectUtils'
type StashItemLike = {
  id?: string
  name?: string
  effectType?: string
  type?: string
}

/**
 * Validates if a contraband stash item can be used based on the current selection.
 * @param item - The contraband item.
 * @param selectedMember - The ID of the currently selected band member.
 * @returns Valid result, or a localized error when a member-scoped item has no selected member.
 */
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
      silent: false,
      errorKey: 'ui:stash.selectMemberFirst',
      defaultMessage: 'Select a band member first!'
    }
  }
  return { isValid: true }
}

/**
 * Generates the toast message payload for when a stash item is used.
 * @param item - The contraband item.
 * @param t - The translation function.
 * @returns Toast translation key and options for the used/applied item.
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
      defaultValue: '{{action}} {{itemName}}!'
    }
  }
}

/**
 * Adds a catalogue contraband item to a band's stash, honouring stacking,
 * uniqueness and apply-on-add equipment rules.
 *
 * @param band - Band whose stash receives the item.
 * @param payload - Catalogue id to add and the instance id stamped on a new entry.
 * @returns A new band with the item added, or the identical `band` reference
 * when the id is forbidden or unknown, a non-stackable duplicate already
 * exists, or the stack is full.
 *
 * @remarks
 * The single stash-add implementation: the `addContrabandHelper` reducer
 * helper (drops, trades, crafting) and the event-delta `stashAdd` path
 * (events that hand out contraband) both call it, so an event-granted item
 * is indistinguishable from a dropped one.
 */
export const addContrabandToBand = (
  band: BandState,
  payload: { contrabandId: string; instanceId?: string }
): BandState => {
  const { contrabandId, instanceId } = payload
  if (isForbiddenKey(contrabandId)) return band
  const item = CONTRABAND_BY_ID.get(contrabandId)
  if (!item) return band

  const newBand = { ...band }
  const currentStash = newBand.stash || {}

  // Handle stackable logic and uniqueness
  const existingItem = Object.hasOwn(currentStash, item.id)
    ? (currentStash[item.id] as Record<string, unknown>)
    : undefined
  if (existingItem) {
    if (!item.stackable) {
      return band // Don't add duplicate non-stackable items
    }
    const currentStacks = (existingItem.stacks as number | undefined) ?? 1
    const max = (item.maxStacks as number) || Infinity
    if (currentStacks >= max) return band // Reached max stacks
    newBand.stash = Object.assign(Object.create(null), currentStash, {
      [item.id]: {
        ...existingItem,
        stacks: currentStacks + 1
      }
    })
    return newBand
  }

  const newInstance = {
    ...item,
    instanceId,
    remainingDuration: isFiniteNumber(item.duration)
      ? (item.duration as number)
      : null,
    applied: !!item.applyOnAdd,
    stacks: item.stackable ? 1 : null
  }

  newBand.stash = Object.assign(Object.create(null), currentStash, {
    [item.id]: newInstance
  })

  if (item.applyOnAdd && item.type === 'equipment') {
    applySharedBandEffect(
      newBand,
      item.effectType,
      item.value as number,
      EQUIPMENT_APPLY_ON_ADD_EFFECTS
    )
  }

  return newBand
}
