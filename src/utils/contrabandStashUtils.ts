import type { BandState } from '../types'
import type { ValidationResult } from '../types/validation'
import { CONTRABAND_BY_ID } from '../data/contraband'
import {
  applySharedBandEffect,
  readClampedBandVital,
  EQUIPMENT_APPLY_ON_ADD_EFFECTS
} from './contrabandEffects'
import { finiteNumberOr, isFiniteNumber } from './finiteNumber'
import { clampBandHarmony, clampBandStress } from './gameState/clamps'
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
 * Owned stack count of one stash entry.
 *
 * @param stash - `band.stash` dictionary (keyed by contraband id); untrusted.
 * @param id - Contraband id to count.
 * @returns `0` when the entry is missing or malformed; `1` for an owned entry
 * whose `stacks` is `null` or absent (a non-stackable item); the finite
 * `stacks` value rounded down and floored at `0` otherwise; `0` for a non-finite `stacks`.
 *
 * @remarks
 * The single stash-count reader shared by Career (crafting, drops, Void
 * Trader) and Expedition (loadout validation, Tour Prep) code, so a
 * non-stackable item counts as one owned unit everywhere.
 */
export const getStashStackCount = (stash: unknown, id: string): number => {
  if (!stash || typeof stash !== 'object' || !Object.hasOwn(stash, id)) {
    return 0
  }
  const entry: unknown = (stash as Record<string, unknown>)[id]
  if (!entry || typeof entry !== 'object') return 0
  const stacks = Object.hasOwn(entry, 'stacks')
    ? (entry as Record<string, unknown>).stacks
    : undefined
  if (stacks === null || stacks === undefined) return 1
  return isFiniteNumber(stacks) ? Math.max(0, Math.floor(stacks)) : 0
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
 * Re-clamps the band stat an apply-on-add / revert just moved.
 *
 * @param band - Band the effect was applied to; mutated in place.
 * @param effectType - Effect type that was applied or reverted.
 *
 * @remarks
 * `applySharedBandEffect` stays an exact additive inverse, so it writes
 * `harmony` and `stress` unclamped. A caller that applies or reverts an
 * equipment effect outside the expiry tick has to bring those two back into
 * range itself, or a later clamp plus the inverse revert drifts past 0-100.
 */
export const clampSharedBandEffectResult = (
  band: BandState,
  effectType: unknown
): void => {
  if (effectType === 'harmony') {
    band.harmony = clampBandHarmony(finiteNumberOr(band.harmony, 1))
  } else if (effectType === 'stress') {
    band.stress = clampBandStress(finiteNumberOr(band.stress, 0))
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
    const currentStacks = getStashStackCount(currentStash, item.id)
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
    const before = readClampedBandVital(newBand, item.effectType)
    applySharedBandEffect(
      newBand,
      item.effectType,
      item.value as number,
      EQUIPMENT_APPLY_ON_ADD_EFFECTS
    )
    clampSharedBandEffectResult(newBand, item.effectType)
    const after = readClampedBandVital(newBand, item.effectType)
    // Remembered so the revert undoes what was applied, not the catalog value.
    if (before !== null && after !== null) {
      ;(newBand.stash as Record<string, unknown>)[item.id] = {
        ...newInstance,
        appliedValue: after - before
      }
    }
  }

  return newBand
}
