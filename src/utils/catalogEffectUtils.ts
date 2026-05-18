import type { Effect } from '../types/components'

const EFFECT_TARGETS = new Set(['player', 'band', 'van', 'performance'])

type EffectTarget = 'player' | 'band' | 'van' | 'performance'

/**
 * Type guard for catalog effect inputs. Validates structure without
 * mutating or copying. Use `normalizeCatalogEffect` to additionally
 * obtain a sanitized clone that strips inherited / prototype-pollution
 * keys before the value enters game state.
 */
export const isCatalogEffect = (value: unknown): value is Effect => {
  if (typeof value !== 'object' || value === null) return false
  const effect = value as Record<string, unknown>
  if (!Object.hasOwn(effect, 'type') || typeof effect.type !== 'string') {
    return false
  }

  switch (effect.type) {
    case 'inventory_add':
      return (
        Object.hasOwn(effect, 'item') &&
        typeof effect.item === 'string' &&
        Object.hasOwn(effect, 'value') &&
        Number.isFinite(effect.value)
      )
    case 'inventory_set':
      return (
        Object.hasOwn(effect, 'item') &&
        typeof effect.item === 'string' &&
        (!Object.hasOwn(effect, 'value') ||
          typeof effect.value !== 'number' ||
          Number.isFinite(effect.value))
      )
    case 'stat_modifier':
      return (
        Object.hasOwn(effect, 'target') &&
        typeof effect.target === 'string' &&
        EFFECT_TARGETS.has(effect.target) &&
        Object.hasOwn(effect, 'stat') &&
        typeof effect.stat === 'string' &&
        Object.hasOwn(effect, 'value') &&
        Number.isFinite(effect.value)
      )
    case 'unlock_upgrade':
    case 'unlock_hq':
      return Object.hasOwn(effect, 'id') && typeof effect.id === 'string'
    case 'passive':
      return Object.hasOwn(effect, 'key') && typeof effect.key === 'string'
    default:
      return false
  }
}

/**
 * Validate and produce a sanitized clone of a catalog effect input.
 *
 * The returned object contains ONLY the validated fields for the matched
 * variant — inherited keys, `__proto__`, `constructor`, and any other
 * untrusted side-channel keys on the input are dropped before the value
 * enters game state. Throws on invalid input.
 */
export const normalizeCatalogEffect = (
  value: unknown,
  itemId: string | number
): Effect => {
  if (!isCatalogEffect(value)) {
    throw new Error(`Invalid catalog effect for item "${String(itemId)}"`)
  }
  const effect = value as unknown as Record<string, unknown>

  switch (effect.type) {
    case 'inventory_add':
      return {
        type: 'inventory_add',
        item: effect.item as string,
        value: effect.value as number
      }
    case 'inventory_set': {
      const out: { type: 'inventory_set'; item: string; value?: unknown } = {
        type: 'inventory_set',
        item: effect.item as string
      }
      if (Object.hasOwn(effect, 'value')) out.value = effect.value
      return out as Effect
    }
    case 'stat_modifier':
      return {
        type: 'stat_modifier',
        target: effect.target as EffectTarget,
        stat: effect.stat as string,
        value: effect.value as number
      }
    case 'unlock_upgrade':
      return { type: 'unlock_upgrade', id: effect.id as string }
    case 'unlock_hq':
      return { type: 'unlock_hq', id: effect.id as string }
    case 'passive': {
      const out: { type: 'passive'; key: string; value?: unknown } = {
        type: 'passive',
        key: effect.key as string
      }
      if (Object.hasOwn(effect, 'value')) out.value = effect.value
      return out
    }
    default:
      // Unreachable: isCatalogEffect would have returned false above.
      throw new Error(`Invalid catalog effect for item "${String(itemId)}"`)
  }
}
