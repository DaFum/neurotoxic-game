export const HQ_ITEMS = {
  gear: [
    // Standard Consumables
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
    // Merch Restocks
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
      id: 'merch_patches_bundle',
      name: 'Karton Patches (50 Stk.)',
      cost: 50,
      currency: 'money',
      description: 'Für die Kutte. Schnell verkauft.',
      effect: { type: 'inventory_add', item: 'patches', value: 50 }
    },
    {
      id: 'merch_vinyl_bundle',
      name: 'Vinyl Pressung (20 Stk.)',
      cost: 300,
      currency: 'money',
      description: 'Für die echten Sammler.',
      effect: { type: 'inventory_add', item: 'vinyl', value: 20 }
    },
    {
      id: 'merch_cds_bundle',
      name: 'CD Spindel (50 Stk.)',
      cost: 100,
      currency: 'money',
      description: 'Gibt es noch CD-Player? Egal.',
      effect: { type: 'inventory_add', item: 'cds', value: 50 }
    },
    // Realistic/Gritty Gear
    {
      id: 'broken_pedal',
      name: 'Defektes Pedal (mit Klebeband)',
      cost: 10,
      currency: 'money',
      description:
        'Funktioniert irgendwie, aber wer weiß wie lange noch. Aussetzer garantiert.',
      effect: { type: 'inventory_set', item: 'broken_pedal', value: true }
    },
    {
      id: 'cheap_mics',
      name: 'Billigmikrofone (5er Pack)',
      cost: 80,
      currency: 'money',
      description:
        'Für Vocals, wenn die guten kaputt sind. Klingt wie aus der Tonne.',
      effect: { type: 'inventory_add', item: 'cheap_mics', value: 5 }
    },
    {
      id: 'diy_patch_kit',
      name: 'DIY Patch-Kit',
      cost: 15,
      currency: 'money',
      description:
        'Zum Flicken von Klamotten und Taschen. Für den authentischen Look.',
      effect: { type: 'inventory_set', item: 'diy_patch_kit', value: true }
    },
    {
      id: 'tour_food_canned',
      name: 'Dosenfutter (10er Pack)',
      cost: 30,
      currency: 'money',
      description: 'Günstig und hält. Nicht lecker, aber es füllt den Magen.',
      effect: { type: 'inventory_add', item: 'canned_food', value: 10 }
    },
    {
      id: 'tour_beer_bulk',
      name: 'Kasten Bier (30 Flaschen)',
      cost: 40,
      currency: 'money',
      description:
        'Für die Moral und die Aftershow-Party. Günstig im Großhandel.',
      effect: { type: 'inventory_add', item: 'beer_bulk', value: 30 }
    },
    // Bizarre Gear (Luck/Status Boosts via Inventory Flags or immediate stats)
    {
      id: 'lucky_rabbit_foot',
      name: 'Abgefahrene Hasenpfote',
      cost: 150,
      currency: 'money',
      description: 'Es riecht komisch, aber bringt Glück (+2 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    },
    {
      id: 'duct_tape_roll',
      name: 'Panzertape (Industrie)',
      cost: 80,
      currency: 'money',
      description: 'Repariert den Van sofort ein bisschen (+5 Condition).',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'condition',
        value: 5
      }
    },
    {
      id: 'incense_sticks',
      name: 'Räucherstäbchen "Nag Champa"',
      cost: 30,
      currency: 'money',
      description: 'Beruhigt die Nerven sofort (+5 Harmony).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 5
      }
    },
    {
      id: 'voodoo_doll',
      name: 'Nadelkissen Puppe',
      cost: 666,
      currency: 'money',
      description: 'Verflucht die Konkurrenz (+5 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 5 }
    }
  ],
  instruments: [
    // Guitars & Strings
    {
      id: 'guitar_custom',
      name: 'Custom 8-String Axt',
      cost: 2500,
      currency: 'money',
      description: 'Erleichtert das Treffen von Noten enorm (-15% Diff).',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: -0.15 }
    },
    {
      id: 'guitar_flying_v',
      name: 'Rusty Flying V',
      cost: 1200,
      currency: 'money',
      description: 'Sieht brutal aus. Crowd Decay -5%.',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.05 }
    },
    {
      id: 'bass_sansamp',
      name: 'Darkglass Preamp',
      cost: 1800,
      currency: 'money',
      description:
        'Der Bass drückt so sehr, dass die Crowd länger bleibt (-10% Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.1 }
    },
    // Drums
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
      id: 'cowbell_inferno',
      name: 'Die Heilige Cowbell',
      cost: 500,
      currency: 'money',
      description: 'Mehr Cowbell = Mehr Score (+5%).',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: 0.05
      }
    },
    // Cheap/Broken Instruments
    {
      id: 'second_guitar',
      name: 'Gebrauchte Zweitgitarre',
      cost: 500,
      currency: 'money',
      description:
        'Klingt scheiße, aber verhindert Totalausfall. (-5% Guitar Score equiv).',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: 0.05 } // Makes it slightly harder
    },
    {
      id: 'broken_drum_kit',
      name: 'Abgenutztes Drumkit',
      cost: 1000,
      currency: 'money',
      description: 'Klingt dumpf, Felle kurz vorm Reißen. (-10% Drum Score).',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: -0.1
      }
    },
    {
      id: 'bass_effect_pedal_cheap',
      name: 'Billiges Bass-Pedal',
      cost: 150,
      currency: 'money',
      description: 'Verzerrt unvorhersehbar. (+5% Crowd Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: 0.05 }
    },
    // Weird Instruments
    {
      id: 'theremin_doom',
      name: 'Theremin des Todes',
      cost: 3000,
      currency: 'money',
      description: 'Macht gruselige Geräusche. Crowd liebt es (-15% Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.15 }
    },
    {
      id: 'didgeridoo',
      name: 'Elektrisches Didgeridoo',
      cost: 900,
      currency: 'money',
      description: 'Warum? Warum nicht. (+2 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    }
  ],
  van: [
    {
      id: 'van_suspension',
      name: 'Verstärkte Aufhängung',
      cost: 500,
      currency: 'fame',
      description: 'Reduziert die Wahrscheinlichkeit von Pannen (-1%).',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.01
      }
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
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'inventorySlots',
        value: 10
      }
    },
    {
      id: 'van_tuning',
      name: 'Motor Tuning',
      cost: 1500,
      currency: 'fame',
      description: 'Der Van verbraucht 20% weniger Sprit.',
      effect: { type: 'unlock_upgrade', id: 'van_tuning' }
    },
    // Cheap/DIY Van Items
    {
      id: 'van_tyre_spare',
      name: 'Ersatzreifen (wenig Profil)',
      cost: 100,
      currency: 'fame',
      description: 'Reduziert Pannenrisiko leicht (-5%).',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.05
      }
    },
    {
      id: 'van_paint_job',
      name: 'Grauer Lack (DIY)',
      cost: 300,
      currency: 'fame',
      description: 'Rostschutz > Optik. (+5 Fame).',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 5
      }
    },
    {
      id: 'van_sleeping_bags',
      name: 'Schlafsäcke (3 Stk.)',
      cost: 150,
      currency: 'fame',
      description: 'Besser als der kalte Boden.',
      effect: { type: 'inventory_add', item: 'sleeping_bags', value: 3 }
    },
    {
      id: 'van_tape_glue',
      name: 'Klebeband & Kleber',
      cost: 20,
      currency: 'fame',
      description: 'Für schnelle Reparaturen. Hält irgendwie.',
      effect: { type: 'inventory_set', item: 'tape_glue', value: true }
    },
    // Skurrile Van Upgrades
    {
      id: 'van_mattress',
      name: 'Stinkende Matratzen',
      cost: 300,
      currency: 'fame',
      description: 'Besser als der Boden. (+5 Max Harmonie/Tag Theorie).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 5
      }
    },
    {
      id: 'van_spoiler',
      name: 'Riesiger Heckspoiler',
      cost: 200,
      currency: 'fame',
      description:
        'Bringt nichts, sieht aber schnell aus. (+1 Fame beim Kauf).',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 1
      }
    },
    {
      id: 'van_disco',
      name: 'Disco Kugel',
      cost: 600,
      currency: 'fame',
      description: 'Party im Bus! (+2 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    },
    {
      id: 'van_flamethrower',
      name: 'Auspuff-Flammenwerfer',
      cost: 2500,
      currency: 'fame',
      description: 'Einschüchternd. (+100 Fame Sofortbonus).',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 100
      }
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
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'passiveFollowers',
        value: 10
      }
    },
    {
      id: 'hq_label',
      name: 'Plattenvertrag (Indie)',
      cost: 5000,
      currency: 'fame',
      description: 'Startet jeden Run mit +500€ Budget.',
      effect: { type: 'unlock_hq', id: 'hq_label' }
    },
    // Gritty HQ Items
    {
      id: 'hq_old_couch',
      name: 'Durchgesessene Couch',
      cost: 100,
      currency: 'money',
      description: 'Ort zum Abhängen. (+10 Stamina).',
      effect: { type: 'unlock_hq', id: 'hq_old_couch' }
    },
    {
      id: 'hq_poster_wall',
      name: 'DIY Posterwand',
      cost: 50,
      currency: 'money',
      description: 'Authentizität für Fans. (+10 Fame Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_poster_wall' }
    },
    {
      id: 'hq_cheap_beer_fridge',
      name: 'Billig-Bier Kühlschrank',
      cost: 200,
      currency: 'money',
      description: 'Immer kaltes Bier. (+5 Mood Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_cheap_beer_fridge' }
    },
    {
      id: 'hq_diy_soundproofing',
      name: 'Eierkarton-Dämmung',
      cost: 100,
      currency: 'money',
      description: 'Weniger Lärmbelästigung. (+5 Harmony Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_diy_soundproofing' }
    },
    // Bizarre HQ Items
    {
      id: 'hq_cat',
      name: 'Band-Katze "Satan"',
      cost: 50,
      currency: 'money',
      description: 'Macht alles besser. (+10 Harmony, +5 Luck).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 10
      }
    },
    {
      id: 'hq_beer_pipeline',
      name: 'Direkte Bierleitung',
      cost: 2000,
      currency: 'money',
      description: 'Vom Pub nebenan. (+20 Harmony).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 20
      }
    },
    {
      id: 'hq_shrine',
      name: 'Schrein für Lemmy',
      cost: 666,
      currency: 'fame',
      description: 'Täglicher Segen des Rockgottes. (+10 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 10 }
    },
    {
      id: 'hq_skull',
      name: 'Echter Tierschädel',
      cost: 300,
      currency: 'money',
      description: 'Deko ist alles. (+5 Fame Sofort).',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 5
      }
    }
  ]
}
