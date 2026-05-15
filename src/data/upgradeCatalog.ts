import { HQ_ITEMS } from './hqItems'
import type { CatalogInputItem, CatalogItem, Effect } from '../types'

/**
 * Legacy fame-based upgrades, previously in upgrades.js.
 * Kept inline here as part of the unified catalog. These provide
 * a fame-currency path alongside the money-based HQ_ITEMS for the
 * same capabilities (dual-currency design).
 */
const LEGACY_UPGRADES = [
  {
    id: 'van_suspension',
    name: 'Reinforced Suspension',
    category: 'VAN',
    cost: 500,
    currency: 'fame',
    description: 'Reduces chance of breakdowns by 20%.',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.01
      }
    ],
    oneTime: true
  },
  {
    id: 'van_sound_system',
    name: 'Mobile Studio',
    category: 'VAN',
    cost: 1000,
    currency: 'fame',
    description: 'Band recovers Harmony while traveling.',
    requirements: {},
    effects: [{ type: 'passive', key: 'harmony_regen_travel' }],
    oneTime: true
  },
  {
    id: 'van_storage',
    name: 'Extra Storage',
    category: 'VAN',
    cost: 800,
    currency: 'fame',
    description: 'Inventory slots +2.',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'band',
        stat: 'inventorySlots',
        value: 2
      }
    ],
    oneTime: true
  },
  {
    id: 'guitar_custom',
    name: 'Custom 8-String',
    category: 'GEAR',
    cost: 1500,
    currency: 'fame',
    description: 'Guitar notes are 15% easier to hit.',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'performance',
        stat: 'guitarDifficulty',
        value: -0.15
      }
    ],
    oneTime: true
  },
  {
    id: 'drum_trigger',
    name: 'Axis Pedals',
    category: 'GEAR',
    cost: 1500,
    currency: 'fame',
    description: 'Drum blast beats score +20% more.',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'performance',
        stat: 'drumMultiplier',
        value: 0.2
      }
    ],
    oneTime: true
  },
  {
    id: 'bass_sansamp',
    name: 'SansAmp Driver',
    category: 'GEAR',
    cost: 1200,
    currency: 'fame',
    description: 'Crowd energy decays 10% slower.',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'performance',
        stat: 'crowdDecay',
        value: -0.1
      }
    ],
    oneTime: true
  },
  {
    id: 'social_bot',
    name: 'Bot Network',
    category: 'PROMO',
    cost: 600,
    currency: 'fame',
    description: 'Passive +5 followers/day.',
    requirements: {},
    effects: [{ type: 'passive', key: 'passive_followers', value: 5 }],
    oneTime: true
  },
  {
    id: 'label_contact',
    name: 'Label Contact',
    category: 'PROMO',
    cost: 2000,
    currency: 'fame',
    description: 'Gain +1000 Fame immediately.',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 1000
      }
    ],
    oneTime: true
  }
]

const isEffect = (value: unknown): value is Effect => {
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
        (effect.target === 'player' ||
          effect.target === 'band' ||
          effect.target === 'van' ||
          effect.target === 'performance') &&
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

const normalizeEffect = (value: unknown, itemId: string | number): Effect => {
  if (isEffect(value)) return value
  throw new Error(`Invalid catalog effect for item "${String(itemId)}"`)
}

const normalizeUpgradeShape = (item: CatalogInputItem): CatalogItem => {
  const { effect, effects: rawEffects, ...rest } = item
  const normalizedEffect =
    effect != null ? normalizeEffect(effect, item.id) : undefined
  const effects = Array.isArray(rawEffects)
    ? rawEffects.map(rawEffect => normalizeEffect(rawEffect, item.id))
    : rawEffects != null
      ? [normalizeEffect(rawEffects, item.id)]
      : normalizedEffect != null
        ? [normalizedEffect]
        : []

  return {
    ...rest,
    ...(normalizedEffect != null ? { effect: normalizedEffect } : {}),
    effects
  }
}

/**
 * Returns the active purchase catalog for the BandHQ upgrades tab.
 * Merges HQ_ITEMS (money-based) and legacy fame-based upgrades
 * into a single selector for UI consumption.
 *
 * @returns {Array<object>} Unified list of upgrade/shop entries.
 */
export const getUnifiedUpgradeCatalog = (): CatalogItem[] =>
  [
    ...HQ_ITEMS.van,
    ...HQ_ITEMS.hq,
    ...HQ_ITEMS.gear,
    ...HQ_ITEMS.instruments,
    ...LEGACY_UPGRADES
  ].map(normalizeUpgradeShape)
