import { HQ_ITEMS } from './hqItems'
import { normalizeCatalogEffect } from '../utils/catalogEffectUtils'
import type { CatalogInputItem, CatalogItem } from '../types/components'

/**
 * Legacy fame-based upgrades, previously in upgrades.js.
 * Definitions stay available for compatibility, but aliases already represented
 * by canonical HQ items are excluded from the active upgrades tab below.
 */
const LEGACY_UPGRADES = [
  {
    id: 'van_suspension',
    name: 'Reinforced Suspension',
    category: 'VAN',
    cost: 270,
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
    cost: 540,
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
    cost: 440,
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
    cost: 810,
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
    cost: 810,
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
    cost: 650,
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
    name: 'items:social_bot.name',
    category: 'PROMO',
    cost: 330,
    currency: 'fame',
    description: 'items:social_bot.description',
    requirements: {},
    effects: [{ type: 'passive', key: 'passive_followers', value: 5 }],
    oneTime: true
  },
  {
    id: 'label_contact',
    name: 'items:label_contact.name',
    category: 'PROMO',
    // Deliberately excluded from the catalogue-wide price rescale: this entry is
    // priced against its own +1000 Fame grant, not against earned Fame. Scaling
    // the cost without scaling the grant left it costing 1100 for 1000 back,
    // i.e. very nearly free.
    cost: 2000,
    currency: 'fame',
    description: 'items:label_contact.description',
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

const HQ_DUPLICATE_LEGACY_IDS = new Set([
  'van_suspension',
  'van_sound_system',
  'van_storage',
  'guitar_custom',
  'drum_trigger',
  'bass_sansamp'
])

const normalizeUpgradeShape = (item: CatalogInputItem): CatalogItem => {
  const { effect, effects: rawEffects, ...rest } = item
  const normalizedEffect =
    effect != null ? normalizeCatalogEffect(effect, item.id) : undefined
  const effects = Array.isArray(rawEffects)
    ? rawEffects.map(rawEffect => normalizeCatalogEffect(rawEffect, item.id))
    : rawEffects != null
      ? [normalizeCatalogEffect(rawEffects, item.id)]
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
 * Shop-only gear and instruments remain in the SHOP tab; this selector merges
 * canonical van/HQ upgrades with the remaining unique legacy upgrades.
 *
 * @returns Unified list of upgrade/shop entries.
 */
export const getUnifiedUpgradeCatalog = (): CatalogItem[] =>
  [
    ...HQ_ITEMS.van,
    ...HQ_ITEMS.hq,
    ...LEGACY_UPGRADES.filter(item => !HQ_DUPLICATE_LEGACY_IDS.has(item.id))
  ].map(normalizeUpgradeShape)
