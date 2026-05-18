import type { Effect } from '../types/components'

const EFFECT_TARGETS = new Set(['player', 'band', 'van', 'performance'])

export const isCatalogEffect = (value: unknown): value is Effect => {
  if (typeof value !== 'object' || value === null) return false
  const effect = value as Record<string, unknown>
  if (typeof effect.type !== 'string') return false

  switch (effect.type) {
    case 'inventory_add':
      return typeof effect.item === 'string' && typeof effect.value === 'number'
    case 'inventory_set':
      return typeof effect.item === 'string'
    case 'stat_modifier':
      return (
        typeof effect.target === 'string' &&
        EFFECT_TARGETS.has(effect.target) &&
        typeof effect.stat === 'string' &&
        typeof effect.value === 'number'
      )
    case 'unlock_upgrade':
    case 'unlock_hq':
      return typeof effect.id === 'string'
    case 'passive':
      return typeof effect.key === 'string'
    default:
      return false
  }
}

export const normalizeCatalogEffect = (
  value: unknown,
  itemId: string | number
): Effect => {
  if (isCatalogEffect(value)) return value
  throw new Error(`Invalid catalog effect for item "${String(itemId)}"`)
}
