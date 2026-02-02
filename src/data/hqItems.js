export const HQ_ITEMS = {
  gear: [
    {
      id: 'strings',
      name: 'Saitensatz (10er Pack)',
      cost: 20,
      currency: 'money',
      description: 'Ersatzsaiten für den Notfall.',
      effect: { type: 'inventory_set', item: 'strings', value: true }
    },
    {
      id: 'cables',
      name: 'Goldkabel',
      cost: 50,
      currency: 'money',
      description: 'Kein Wackelkontakt mehr. Signal ist sauber.',
      effect: { type: 'inventory_set', item: 'cables', value: true }
    },
    {
      id: 'drum_parts',
      name: 'Stick-Bundle & Felle',
      cost: 60,
      currency: 'money',
      description: 'Frisches Holz und neue Felle für den Drummer.',
      effect: { type: 'inventory_set', item: 'drum_parts', value: true }
    },
    {
      id: 'merch_shirts_bundle',
      name: 'Karton T-Shirts (25 Stk.)',
      cost: 150,
      currency: 'money',
      description: 'Nachschub für den Merch-Stand.',
      effect: { type: 'inventory_add', item: 'shirts', value: 25 }
    },
    {
      id: 'merch_hoodies_bundle',
      name: 'Karton Hoodies (10 Stk.)',
      cost: 200,
      currency: 'money',
      description: 'Premium Ware. Hohe Marge.',
      effect: { type: 'inventory_add', item: 'hoodies', value: 10 }
    },
    {
      id: 'merch_vinyl_bundle',
      name: 'Vinyl Pressung (20 Stk.)',
      cost: 300,
      currency: 'money',
      description: 'Für die echten Sammler.',
      effect: { type: 'inventory_add', item: 'vinyl', value: 20 }
    }
  ],
  instruments: [
    {
      id: 'guitar_custom',
      name: 'Custom 8-String Axt',
      cost: 2500,
      currency: 'money',
      description: 'Erleichtert das Treffen von Noten enorm (-15% Diff).',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: -0.15 }
    },
    {
      id: 'drum_trigger',
      name: 'Axis Longboards & Trigger',
      cost: 2200,
      currency: 'money',
      description: 'Jeder Kick sitzt. +20% Drum Score.',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: 0.2
      }
    },
    {
      id: 'bass_sansamp',
      name: 'Darkglass Preamp',
      cost: 1800,
      currency: 'money',
      description: 'Der Bass drückt so sehr, dass die Crowd länger bleibt (-10% Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.1 }
    }
  ],
  van: [
    {
      id: 'van_suspension',
      name: 'Verstärkte Aufhängung',
      cost: 500,
      currency: 'fame',
      description: 'Reduziert die Wahrscheinlichkeit von Pannen (-20%).',
      effect: { type: 'stat_modifier', target: 'van', stat: 'breakdownChance', value: -0.01 } // Assuming 0.05 is base
    },
    {
      id: 'van_sound_system',
      name: 'Mobiles Studio',
      cost: 1000,
      currency: 'fame',
      description: 'Band regeneriert Harmonie während der Fahrt.',
      effect: { type: 'unlock_upgrade', id: 'van_sound_system' }
    },
    {
      id: 'van_storage',
      name: 'Dachbox & Hänger',
      cost: 800,
      currency: 'fame',
      description: '+10 Inventar Slots für Merch.',
      effect: { type: 'stat_modifier', target: 'band', stat: 'inventorySlots', value: 10 }
    },
    {
      id: 'van_tuning',
      name: 'Motor Tuning',
      cost: 1500,
      currency: 'fame',
      description: 'Der Van verbraucht 20% weniger Sprit.',
      effect: { type: 'unlock_upgrade', id: 'van_tuning' }
    }
  ],
  hq: [
    {
      id: 'hq_coffee',
      name: 'Profi Espressomaschine',
      cost: 400,
      currency: 'money',
      description: 'Besuch im HQ stellt sofort 20 Mood bei allen her.',
      effect: { type: 'unlock_hq', id: 'hq_coffee' }
    },
    {
      id: 'hq_sofa',
      name: 'Ledercouch & Konsole',
      cost: 600,
      currency: 'money',
      description: 'Besuch im HQ stellt sofort 30 Stamina her.',
      effect: { type: 'unlock_hq', id: 'hq_sofa' }
    },
    {
      id: 'hq_marketing',
      name: 'Social Media Botnetz',
      cost: 1000,
      currency: 'fame',
      description: 'Passive Follower Generation (+10/Tag).',
      effect: { type: 'stat_modifier', target: 'player', stat: 'passiveFollowers', value: 10 }
    },
    {
      id: 'hq_label',
      name: 'Plattenvertrag (Indie)',
      cost: 5000,
      currency: 'fame',
      description: 'Startet jeden Run mit +500€ Budget.',
      effect: { type: 'unlock_hq', id: 'hq_label' }
    }
  ]
}
