/**
 * Legacy + progression upgrade database.
 * These upgrades are active content and surfaced through the unified upgrade selector.
 */
export const UPGRADES_DB = {
  van: [
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
          value: -0.01 // Reduces 5% base to 4% (20% reduction)
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
    }
  ],
  instruments: [
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
    }
  ],
  marketing: [
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
}
