export const UPGRADES_DB = {
  van: [
    {
      id: 'van_suspension',
      name: 'Reinforced Suspension',
      cost: 500, // Fame/XP
      description: 'Reduces chance of breakdowns by 20%.',
      effect: { type: 'stat_modifier', stat: 'breakdown_chance', value: -0.2 }
    },
    {
      id: 'van_sound_system',
      name: 'Mobile Studio',
      cost: 1000,
      description: 'Band recovers Harmony while traveling.',
      effect: { type: 'passive', effect: 'harmony_regen_travel' }
    },
    {
      id: 'van_storage',
      name: 'Extra Storage',
      cost: 800,
      description: 'Inventory slots +2.',
      effect: { type: 'stat_modifier', stat: 'inventory_slots', value: 2 }
    }
  ],
  instruments: [
    {
      id: 'guitar_custom',
      name: 'Custom 8-String',
      cost: 1500,
      description: 'Guitar notes are 15% easier to hit.',
      effect: { type: 'stat_modifier', stat: 'guitar_difficulty', value: -0.15 }
    },
    {
      id: 'drum_trigger',
      name: 'Axis Pedals',
      cost: 1500,
      description: 'Drum blast beats score +20% more.',
      effect: {
        type: 'stat_modifier',
        stat: 'drum_score_multiplier',
        value: 0.2
      }
    },
    {
      id: 'bass_sansamp',
      name: 'SansAmp Driver',
      cost: 1200,
      description: 'Crowd energy decays 10% slower.',
      effect: { type: 'stat_modifier', stat: 'crowd_decay', value: -0.1 }
    }
  ],
  marketing: [
    {
      id: 'social_bot',
      name: 'Bot Network',
      cost: 600,
      description: 'Passive +5 followers/day.',
      effect: { type: 'passive', effect: 'passive_followers' }
    },
    {
      id: 'label_contact',
      name: 'Label Contact',
      cost: 2000,
      description: 'Start run with +1000 Fame.',
      effect: { type: 'start_bonus', stat: 'fame', value: 1000 }
    }
  ]
}
