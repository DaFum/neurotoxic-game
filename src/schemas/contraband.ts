import type { Rarity } from '../types'
import { isForbiddenKey, isLooseRecord } from '../utils/objectUtils'
import { isFiniteNumber } from '../utils/finiteNumber'

const VALID_TYPES = new Set(['consumable', 'equipment', 'relic'])
const VALID_RARITIES = new Set<Rarity>(['common', 'uncommon', 'rare', 'epic'])

export interface ContrabandValidationResult {
  ok: boolean
  errors: string[]
}

const readString = (item: Record<string, unknown>, key: string): boolean =>
  typeof item[key] === 'string' && item[key].length > 0

const hasForbiddenKeys = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(entry => hasForbiddenKeys(entry))
  }
  if (!isLooseRecord(value)) return false
  for (const key of Object.keys(value)) {
    if (isForbiddenKey(key) || hasForbiddenKeys(value[key])) return true
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
    return { ok: false, errors: ['item must be an object'] }
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
  if (typeof item.stackable !== 'boolean') {
    errors.push('stackable must be a boolean')
  }
  if (
    item.maxStacks !== undefined &&
    (!isFiniteNumber(item.maxStacks) || item.maxStacks <= 0)
  ) {
    errors.push('maxStacks must be a positive finite number when present')
  }
  if (item.duration !== undefined && !isFiniteNumber(item.duration)) {
    errors.push('duration must be finite when present')
  }
  if (item.applyOnAdd !== undefined && typeof item.applyOnAdd !== 'boolean') {
    errors.push('applyOnAdd must be boolean when present')
  }

  return { ok: errors.length === 0, errors }
}
