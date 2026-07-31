import type { Rarity } from '../types'
import { isForbiddenKey, isLooseRecord } from '../utils/objectUtils'
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

export type SanitizedContrabandItem = {
  id: string
  imagePrompt: string
  name: string
  type: string
  effectType: string
  value: number
  description: string
  rarity: Rarity
  icon: string
  stackable: boolean
  maxStacks?: number
  duration?: number
  applyOnAdd?: boolean
}

export interface ContrabandValidationResult {
  ok: boolean
  errors: string[]
  value: SanitizedContrabandItem | null
}

const readString = (item: Record<string, unknown>, key: string): boolean =>
  typeof item[key] === 'string' && item[key].length > 0

const hasForbiddenKeys = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): boolean => {
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return true
    seen.add(value)
  }
  if (Array.isArray(value)) {
    return value.some(entry => hasForbiddenKeys(entry, seen))
  }
  if (!isLooseRecord(value)) return false
  for (const key of Object.keys(value)) {
    if (isForbiddenKey(key) || hasForbiddenKeys(value[key], seen)) return true
  }
  return false
}

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
  if (hasForbiddenKeys(value)) errors.push('item contains forbidden keys')

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
  if (item.type !== 'equipment' && item.applyOnAdd === true) {
    errors.push('only equipment may use applyOnAdd=true')
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
  }

  const sanitized: SanitizedContrabandItem | null =
    errors.length === 0
      ? {
          id: item.id as string,
          imagePrompt: item.imagePrompt as string,
          name: item.name as string,
          type: item.type as string,
          effectType: item.effectType as string,
          value: item.value as number,
          description: item.description as string,
          rarity: item.rarity as Rarity,
          icon: item.icon as string,
          stackable: item.stackable as boolean,
          ...(item.maxStacks !== undefined
            ? { maxStacks: item.maxStacks as number }
            : {}),
          ...(item.duration !== undefined
            ? { duration: item.duration as number }
            : {}),
          ...(item.applyOnAdd !== undefined
            ? { applyOnAdd: item.applyOnAdd as boolean }
            : {})
        }
      : null

  return { ok: errors.length === 0, errors, value: sanitized }
}
