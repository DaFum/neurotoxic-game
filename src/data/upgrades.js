export const UPGRADES_DB = {
  van: [
    {
      id: 'van_suspension',
      name: 'Reinforced Suspension',
      cost: 500, // Fame/XP
      currency: 'fame',
      description: 'Reduces chance of breakdowns by 20%.',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.2
      }
    },
    {
      id: 'van_sound_system',
      name: 'Mobile Studio',
      cost: 1000,
      currency: 'fame',
      description: 'Band recovers Harmony while traveling.',
      effect: { type: 'passive', effect: 'harmony_regen_travel' }
    },
    {
      id: 'van_storage',
      name: 'Extra Storage',
      cost: 800,
      currency: 'fame',
      description: 'Inventory slots +2.',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'inventorySlots',
        value: 2
      }
    }
  ],
  instruments: [
    {
      id: 'guitar_custom',
      name: 'Custom 8-String',
      cost: 1500,
      currency: 'fame',
      description: 'Guitar notes are 15% easier to hit.',
      effect: {
        type: 'stat_modifier',
        target: 'performance',
        stat: 'guitarDifficulty',
        value: -0.15
      }
    },
    {
      id: 'drum_trigger',
      name: 'Axis Pedals',
      cost: 1500,
      currency: 'fame',
      description: 'Drum blast beats score +20% more.',
      effect: {
        type: 'stat_modifier',
        target: 'performance',
        stat: 'drumMultiplier',
        value: 0.2
      }
    },
    {
      id: 'bass_sansamp',
      name: 'SansAmp Driver',
      cost: 1200,
      currency: 'fame',
      description: 'Crowd energy decays 10% slower.',
      effect: {
        type: 'stat_modifier',
        target: 'performance',
        stat: 'crowdDecay',
        value: -0.1
      }
    }
  ],
  marketing: [
    {
      id: 'social_bot',
      name: 'Bot Network',
      cost: 600,
      currency: 'fame',
      description: 'Passive +5 followers/day.',
      effect: { type: 'passive', effect: 'passive_followers', value: 5 }
    },
    {
      id: 'label_contact',
      name: 'Label Contact',
      cost: 2000,
      currency: 'fame',
      description: 'Start run with +1000 Fame.',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 1000
      }
    }
  ]
}
