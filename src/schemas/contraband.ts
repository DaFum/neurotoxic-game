import type { Rarity } from '../types'
import {
  hasForbiddenKeysDeep,
  isForbiddenKey,
  isLooseRecord
} from '../utils/objectUtils'
import { isFiniteNumber } from '../utils/finiteNumber'
import {
  ADDITIVE_BAND_EFFECT_FIELDS,
  EQUIPMENT_APPLY_ON_ADD_EFFECTS
} from '../utils/contrabandEffects'

const VALID_TYPES = new Set(['consumable', 'equipment', 'relic'])
const VALID_RARITIES = new Set<Rarity>(['common', 'uncommon', 'rare', 'epic'])
const VALID_EFFECT_TYPES = new Set([
  ...Object.keys(ADDITIVE_BAND_EFFECT_FIELDS),
  'stamina',
  'mood',
  'stamina_max',
  'stress',
  'guitar_difficulty'
])

type BaseContrabandItem = {
  id: string
  imagePrompt: string
  name: string
  effectType: string
  value: number
  description: string
  rarity: Rarity
  icon: string
  stackable: boolean
}

type ContrabandConsumableItem = BaseContrabandItem & {
  type: 'consumable'
  maxStacks?: number
  duration?: number
}

type ContrabandEquipmentItem = BaseContrabandItem & {
  type: 'equipment'
  applyOnAdd: boolean
}

type ContrabandRelicItem = BaseContrabandItem & {
  type: 'relic'
  duration?: number
}

export type SanitizedContrabandItem =
  ContrabandConsumableItem | ContrabandEquipmentItem | ContrabandRelicItem

interface ContrabandValidationResult {
  ok: boolean
  errors: string[]
  value: SanitizedContrabandItem | null
}

const readString = (item: Record<string, unknown>, key: string): boolean =>
  typeof item[key] === 'string' && item[key].length > 0

/**
 * Validates a contraband definition at the data-module boundary.
 * @param value - Unknown catalog entry to validate.
 * @returns Validation result with all detected schema errors.
 */
export const validateContrabandItem = (
  value: unknown
): ContrabandValidationResult => {
  const errors: string[] = []
  if (!isLooseRecord(value)) {
    return { ok: false, errors: ['item must be an object'], value: null }
  }
  // Bail out before any property is read: the traversal also rejects accessor
  // properties, so this keeps a throwing or stateful getter from running during
  // the field checks below.
  if (hasForbiddenKeysDeep(value)) {
    return {
      ok: false,
      errors: ['item contains forbidden keys'],
      value: null
    }
  }

  const item = value as Record<string, unknown>
  for (const key of [
    'id',
    'imagePrompt',
    'name',
    'effectType',
    'description',
    'icon'
  ]) {
    if (!readString(item, key)) errors.push(`${key} must be a non-empty string`)
  }
  // The acquisition path (addContrabandHelper) refuses forbidden ids, so a
  // catalog entry using one could never be acquired.
  if (typeof item.id === 'string' && isForbiddenKey(item.id)) {
    errors.push('id must not be a prototype-polluting key')
  }

  if (typeof item.type !== 'string' || !VALID_TYPES.has(item.type)) {
    errors.push('type must be a supported contraband type')
  }
  if (
    typeof item.rarity !== 'string' ||
    !VALID_RARITIES.has(item.rarity as Rarity)
  ) {
    errors.push('rarity must be a supported contraband rarity')
  }
  if (!isFiniteNumber(item.value)) errors.push('value must be finite')
  if (
    typeof item.effectType !== 'string' ||
    !VALID_EFFECT_TYPES.has(item.effectType)
  ) {
    errors.push('effectType must be supported')
  }
  if (typeof item.stackable !== 'boolean') {
    errors.push('stackable must be a boolean')
  }
  if (
    item.maxStacks !== undefined &&
    (!isFiniteNumber(item.maxStacks) ||
      !Number.isInteger(item.maxStacks) ||
      item.maxStacks <= 0)
  ) {
    errors.push('maxStacks must be a positive integer when present')
  }
  if (item.duration !== undefined && !isFiniteNumber(item.duration)) {
    errors.push('duration must be finite when present')
  }
  if (item.applyOnAdd !== undefined && typeof item.applyOnAdd !== 'boolean') {
    errors.push('applyOnAdd must be boolean when present')
  }
  if (item.type !== 'equipment' && item.applyOnAdd !== undefined) {
    if (item.applyOnAdd === true) {
      errors.push('only equipment may use applyOnAdd=true')
    } else {
      errors.push('only equipment may specify applyOnAdd')
    }
  }
  if (item.type === 'equipment') {
    if (item.stackable !== false) errors.push('equipment must not be stackable')
    if (item.applyOnAdd !== true) {
      errors.push('equipment must use applyOnAdd=true')
    }
    if (
      typeof item.effectType === 'string' &&
      !EQUIPMENT_APPLY_ON_ADD_EFFECTS.has(item.effectType)
    ) {
      errors.push('equipment effectType must support applyOnAdd')
    }
    if (item.duration !== undefined) {
      errors.push('equipment must not specify duration')
    }
    if (item.maxStacks !== undefined) {
      errors.push('equipment must not specify maxStacks')
    }
  }
  if (item.type === 'relic') {
    if (item.maxStacks !== undefined) {
      errors.push('relics must not specify maxStacks')
    }
  }

  let sanitized: SanitizedContrabandItem | null = null
  if (errors.length === 0) {
    const base: BaseContrabandItem = {
      id: item.id as string,
      imagePrompt: item.imagePrompt as string,
      name: item.name as string,
      effectType: item.effectType as string,
      value: item.value as number,
      description: item.description as string,
      rarity: item.rarity as Rarity,
      icon: item.icon as string,
      stackable: item.stackable as boolean
    }
    if (item.type === 'consumable') {
      sanitized = {
        ...base,
        type: 'consumable',
        ...(item.maxStacks !== undefined
          ? { maxStacks: item.maxStacks as number }
          : {}),
        ...(item.duration !== undefined
          ? { duration: item.duration as number }
          : {})
      }
    } else if (item.type === 'equipment') {
      sanitized = {
        ...base,
        type: 'equipment',
        applyOnAdd: item.applyOnAdd as boolean
      }
    } else if (item.type === 'relic') {
      sanitized = {
        ...base,
        type: 'relic',
        ...(item.duration !== undefined
          ? { duration: item.duration as number }
          : {})
      }
    }
  }

  return { ok: errors.length === 0, errors, value: sanitized }
}
