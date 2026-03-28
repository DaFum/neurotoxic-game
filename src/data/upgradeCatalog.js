import { HQ_ITEMS } from './hqItems.js'

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

const normalizeUpgradeShape = item => {
  return {
    ...item,
    effects: Array.isArray(item.effects)
      ? [...item.effects]
      : item.effect
        ? [item.effect]
        : []
  }
}

/**
 * Returns the active purchase catalog for the BandHQ upgrades tab.
 * Merges HQ_ITEMS (money-based) and legacy fame-based upgrades
 * into a single selector for UI consumption.
 *
 * @returns {Array<object>} Unified list of upgrade/shop entries.
 */
export const getUnifiedUpgradeCatalog = () =>
  [
    ...HQ_ITEMS.van,
    ...HQ_ITEMS.hq,
    ...HQ_ITEMS.gear,
    ...HQ_ITEMS.instruments,
    ...LEGACY_UPGRADES
  ].map(normalizeUpgradeShape)
