import type { BandState } from '../types'
import type { ValidationResult } from '../types/validation'
import { CONTRABAND_BY_ID } from '../data/contraband'
import {
  applySharedBandEffect,
  EQUIPMENT_APPLY_ON_ADD_EFFECTS
} from './contrabandEffects'
import { finiteNumberOr, isFiniteNumber } from './finiteNumber'
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
 * Stash slots every band has before storage upgrades. Each distinct stash entry
 * takes one slot; extra stacks of an owned item take none.
 */
export const BASE_STASH_SLOTS = 15

/**
 * Total stash slots: the base allowance plus `band.inventorySlots` from
 * storage upgrades (`hq_van_storage`).
 *
 * @param band - Band whose storage upgrades raise the capacity.
 * @returns Whole number of distinct stash entries the band may hold.
 */
export const getStashCapacity = (
  band: Pick<BandState, 'inventorySlots'> | null | undefined
): number =>
  BASE_STASH_SLOTS +
  Math.max(0, Math.floor(finiteNumberOr(band?.inventorySlots, 0)))

/**
 * Number of stash slots in use (distinct own entries).
 *
 * @param band - Band whose stash is counted.
 * @returns Occupied slot count.
 */
export const getStashUsedSlots = (
  band: Pick<BandState, 'stash'> | null | undefined
): number => {
  const stash = band?.stash
  if (!stash) return 0
  let used = 0
  for (const key in stash) {
    if (Object.hasOwn(stash, key)) used++
  }
  return used
}

/**
 * Whether adding this item would need a new slot the band does not have.
 *
 * @param band - Band receiving the item.
 * @param contrabandId - Catalogue id to add.
 * @returns True when the item is not owned yet and every slot is taken.
 */
export const isStashFullFor = (
  band: BandState,
  contrabandId: string
): boolean =>
  !(band.stash && Object.hasOwn(band.stash, contrabandId)) &&
  getStashUsedSlots(band) >= getStashCapacity(band)

/**
 * Adds a catalogue contraband item to a band's stash, honouring stacking,
 * uniqueness and apply-on-add equipment rules.
 *
 * @param band - Band whose stash receives the item.
 * @param payload - Catalogue id to add and the instance id stamped on a new entry.
 * @returns A new band with the item added, or the identical `band` reference
 * when the id is forbidden or unknown, a non-stackable duplicate already
 * exists, the stack is full, or a new entry would exceed the stash capacity
 * ({@link getStashCapacity}).
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

  // A new entry needs a free slot; legacy saves above capacity keep what they
  // hold but cannot add more distinct items until they make room.
  if (getStashUsedSlots(band) >= getStashCapacity(band)) return band

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
