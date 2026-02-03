export const HQ_ITEMS = {
  gear: [
    // Standard Consumables
    {
      id: 'hq_gear_strings',
      name: 'Saitensatz (10er Pack)',
      cost: 20, // Low cost consumable
      currency: 'money',
      img: 'ITEM_STRINGS',
      description: 'Ersatzsaiten für den Notfall.',
      effect: { type: 'inventory_set', item: 'strings', value: true }
    },
    {
      id: 'hq_gear_cables',
      name: 'Goldkabel',
      cost: 50, // Mid-range cable cost
      currency: 'money',
      img: 'ITEM_CABLES',
      description: 'Kein Wackelkontakt mehr. Signal ist sauber.',
      effect: { type: 'inventory_set', item: 'cables', value: true }
    },
    {
      id: 'hq_gear_drum_parts',
      name: 'Stick-Bundle & Felle',
      cost: 60, // Standard drum maintenance
      currency: 'money',
      img: 'ITEM_DRUM_PARTS',
      description: 'Frisches Holz und neue Felle für den Drummer.',
      effect: { type: 'inventory_set', item: 'drum_parts', value: true }
    },
    // Merch Restocks
    {
      id: 'hq_merch_shirts_bundle',
      name: 'Karton T-Shirts (25 Stk.)',
      cost: 150, // 6€/Shirt production cost
      currency: 'money',
      img: 'ITEM_MERCH_SHIRTS',
      description: 'Nachschub für den Merch-Stand.',
      effect: { type: 'inventory_add', item: 'shirts', value: 25 }
    },
    {
      id: 'hq_merch_hoodies_bundle',
      name: 'Karton Hoodies (10 Stk.)',
      cost: 200, // 20€/Hoodie production cost
      currency: 'money',
      img: 'ITEM_MERCH_HOODIES',
      description: 'Premium Ware. Hohe Marge.',
      effect: { type: 'inventory_add', item: 'hoodies', value: 10 }
    },
    {
      id: 'hq_merch_patches_bundle',
      name: 'Karton Patches (50 Stk.)',
      cost: 50, // 1€/Patch production cost
      currency: 'money',
      img: 'ITEM_MERCH_PATCHES',
      description: 'Für die Kutte. Schnell verkauft.',
      effect: { type: 'inventory_add', item: 'patches', value: 50 }
    },
    {
      id: 'hq_merch_vinyl_bundle',
      name: 'Vinyl Pressung (20 Stk.)',
      cost: 300, // 15€/LP production cost
      currency: 'money',
      img: 'ITEM_MERCH_VINYL',
      description: 'Für die echten Sammler.',
      effect: { type: 'inventory_add', item: 'vinyl', value: 20 }
    },
    {
      id: 'hq_merch_cds_bundle',
      name: 'CD Spindel (50 Stk.)',
      cost: 100, // 2€/CD production cost
      currency: 'money',
      img: 'ITEM_MERCH_CDS',
      description: 'Gibt es noch CD-Player? Egal.',
      effect: { type: 'inventory_add', item: 'cds', value: 50 }
    },
    // Realistic/Gritty Gear
    {
      id: 'hq_gear_broken_pedal',
      name: 'Defektes Pedal (mit Klebeband)',
      cost: 10, // Scrap value
      currency: 'money',
      img: 'ITEM_BROKEN_PEDAL',
      description:
        'Funktioniert irgendwie, aber wer weiß wie lange noch. Aussetzer garantiert.',
      effect: { type: 'inventory_set', item: 'broken_pedal', value: true }
    },
    {
      id: 'hq_gear_cheap_mics',
      name: 'Billigmikrofone (5er Pack)',
      cost: 80, // Very cheap for 5 mics
      currency: 'money',
      img: 'ITEM_CHEAP_MICS',
      description:
        'Für Vocals, wenn die guten kaputt sind. Klingt wie aus der Tonne.',
      effect: { type: 'inventory_add', item: 'cheap_mics', value: 5 }
    },
    {
      id: 'hq_gear_diy_patch_kit',
      name: 'DIY Patch-Kit',
      cost: 20, // Cheap sewing kit
      currency: 'money',
      img: 'ITEM_DIY_PATCH_KIT',
      description:
        'Zum Flicken von Klamotten und Taschen. Für den authentischen Look.',
      effect: { type: 'inventory_set', item: 'diy_patch_kit', value: true }
    },
    {
      id: 'hq_gear_tour_food_canned',
      name: 'Dosenfutter (10er Pack)',
      cost: 30, // 3€/Can
      currency: 'money',
      img: 'ITEM_CANNED_FOOD',
      description: 'Günstig und hält. Nicht lecker, aber es füllt den Magen.',
      effect: { type: 'inventory_add', item: 'canned_food', value: 10 }
    },
    {
      id: 'hq_gear_tour_beer_bulk',
      name: 'Kasten Bier (30 Flaschen)',
      cost: 40, // Bulk discount beer
      currency: 'money',
      img: 'ITEM_BEER_CRATE',
      description:
        'Für die Moral und die Aftershow-Party. Günstig im Großhandel.',
      effect: { type: 'inventory_add', item: 'beer_bulk', value: 30 }
    },
    // Bizarre Gear (Luck/Status Boosts via Inventory Flags or immediate stats)
    {
      id: 'hq_gear_lucky_rabbit_foot',
      name: 'Abgefahrene Hasenpfote',
      cost: 150, // Magic item cost
      currency: 'money',
      img: 'ITEM_RABBIT_FOOT',
      description: 'Es riecht komisch, aber bringt Glück (+2 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    },
    {
      id: 'hq_gear_duct_tape_roll',
      name: 'Panzertape (Industrie)',
      cost: 80, // High quality tape
      currency: 'money',
      img: 'ITEM_DUCT_TAPE',
      description: 'Repariert den Van sofort ein bisschen (+5 Condition).',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'condition',
        value: 5
      }
    },
    {
      id: 'hq_gear_incense_sticks',
      name: 'Räucherstäbchen "Nag Champa"',
      cost: 30, // Mood items
      currency: 'money',
      img: 'ITEM_INCENSE',
      description: 'Beruhigt die Nerven sofort (+5 Harmony).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 5
      }
    },
    {
      id: 'hq_gear_voodoo_doll',
      name: 'Nadelkissen Puppe',
      cost: 660, // Occult item cost (Adjusted to multiple of 10)
      currency: 'money',
      img: 'ITEM_VOODOO_DOLL',
      description: 'Verflucht die Konkurrenz (+5 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 5 }
    }
  ],
  instruments: [
    // Guitars & Strings
    {
      id: 'hq_inst_guitar_custom',
      name: 'Custom 8-String Axt',
      cost: 2500, // High-end instrument
      currency: 'money',
      img: 'ITEM_GUITAR_CUSTOM',
      description: 'Erleichtert das Treffen von Noten enorm (-15% Diff).',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: -0.15 }
    },
    {
      id: 'hq_inst_guitar_flying_v',
      name: 'Rusty Flying V',
      cost: 1200, // Mid-range vintage
      currency: 'money',
      img: 'ITEM_GUITAR_V',
      description: 'Sieht brutal aus. Crowd Decay -5%.',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.05 }
    },
    {
      id: 'hq_inst_bass_sansamp',
      name: 'Darkglass Preamp',
      cost: 1800, // Pro gear
      currency: 'money',
      img: 'ITEM_BASS_PREAMP',
      description:
        'Der Bass drückt so sehr, dass die Crowd länger bleibt (-10% Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.1 }
    },
    // Drums
    {
      id: 'hq_inst_drum_trigger',
      name: 'Axis Longboards & Trigger',
      cost: 2200, // Pro drum gear
      currency: 'money',
      img: 'ITEM_DRUM_TRIGGER',
      description: 'Jeder Kick sitzt. +20% Drum Score.',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: 0.2
      }
    },
    {
      id: 'hq_inst_cowbell_inferno',
      name: 'Die Heilige Cowbell',
      cost: 500, // Meme instrument
      currency: 'money',
      img: 'ITEM_COWBELL',
      description: 'Mehr Cowbell = Mehr Score (+5%).',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: 0.05
      }
    },
    // Cheap/Broken Instruments
    {
      id: 'hq_inst_second_guitar',
      name: 'Gebrauchte Zweitgitarre',
      cost: 500, // Backup gear
      currency: 'money',
      img: 'ITEM_GUITAR_CHEAP',
      description:
        'Klingt scheiße, aber verhindert Totalausfall. (-5% Guitar Score equiv).',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: 0.05 } // Makes it slightly harder
    },
    {
      id: 'hq_inst_broken_drum_kit',
      name: 'Abgenutztes Drumkit',
      cost: 1000, // Beater kit
      currency: 'money',
      img: 'ITEM_DRUM_BROKEN',
      description: 'Klingt dumpf, Felle kurz vorm Reißen. (-10% Drum Score).',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: -0.1
      }
    },
    {
      id: 'hq_inst_bass_effect_pedal_cheap',
      name: 'Billiges Bass-Pedal',
      cost: 150, // Cheap FX
      currency: 'money',
      img: 'ITEM_PEDAL_CHEAP',
      description: 'Verzerrt unvorhersehbar. (+5% Crowd Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: 0.05 }
    },
    // Weird Instruments
    {
      id: 'hq_inst_theremin_doom',
      name: 'Theremin des Todes',
      cost: 3000, // Boutique obscure instrument
      currency: 'money',
      img: 'ITEM_THEREMIN',
      description: 'Macht gruselige Geräusche. Crowd liebt es (-15% Decay).',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.15 }
    },
    {
      id: 'hq_inst_didgeridoo',
      name: 'Elektrisches Didgeridoo',
      cost: 900, // Niche instrument
      currency: 'money',
      img: 'ITEM_DIDGERIDOO',
      description: 'Warum? Warum nicht. (+2 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    }
  ],
  van: [
    {
      id: 'hq_van_suspension',
      name: 'Verstärkte Aufhängung',
      cost: 500, // Moderate upgrade
      currency: 'fame',
      img: 'ITEM_VAN_SUSPENSION',
      description: 'Reduziert die Wahrscheinlichkeit von Pannen (-1%).',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.01
      }
    },
    {
      id: 'hq_van_sound_system',
      name: 'Mobiles Studio',
      cost: 1000, // Major upgrade
      currency: 'fame',
      img: 'ITEM_VAN_STUDIO',
      description: 'Band regeneriert Harmonie während der Fahrt.',
      effect: { type: 'unlock_upgrade', id: 'van_sound_system' }
    },
    {
      id: 'hq_van_storage',
      name: 'Dachbox & Hänger',
      cost: 800, // Utility upgrade
      currency: 'fame',
      img: 'ITEM_VAN_STORAGE',
      description: '+10 Inventar Slots für Merch.',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'inventorySlots',
        value: 10
      }
    },
    {
      id: 'hq_van_tuning',
      name: 'Motor Tuning',
      cost: 1500, // Performance upgrade
      currency: 'fame',
      img: 'ITEM_VAN_TUNING',
      description: 'Der Van verbraucht 20% weniger Sprit.',
      effect: { type: 'unlock_upgrade', id: 'van_tuning' }
    },
    // Cheap/DIY Van Items
    {
      id: 'hq_van_tyre_spare',
      name: 'Ersatzreifen (wenig Profil)',
      cost: 100, // Cheap fix
      currency: 'fame',
      img: 'ITEM_VAN_TIRE',
      description: 'Reduziert Pannenrisiko leicht (-5%).',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.05
      }
    },
    {
      id: 'hq_van_paint_job',
      name: 'Grauer Lack (DIY)',
      cost: 300, // Cosmetic/Reputation
      currency: 'fame',
      img: 'ITEM_VAN_PAINT',
      description: 'Rostschutz > Optik. (+5 Fame).',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 5
      }
    },
    {
      id: 'hq_van_sleeping_bags',
      name: 'Schlafsäcke (3 Stk.)',
      cost: 150, // Survival gear
      currency: 'fame',
      img: 'ITEM_SLEEPING_BAGS',
      description: 'Besser als der kalte Boden.',
      effect: { type: 'inventory_add', item: 'sleeping_bags', value: 3 }
    },
    {
      id: 'hq_van_tape_glue',
      name: 'Klebeband & Kleber',
      cost: 20, // Consumable fix
      currency: 'fame',
      img: 'ITEM_GLUE_TAPE',
      description: 'Für schnelle Reparaturen. Hält irgendwie.',
      effect: { type: 'inventory_set', item: 'tape_glue', value: true }
    },
    // Skurrile Van Upgrades
    {
      id: 'hq_van_mattress',
      name: 'Stinkende Matratzen',
      cost: 300, // QoL upgrade
      currency: 'fame',
      img: 'ITEM_MATTRESS',
      description: 'Besser als der Boden. (+5 Max Harmonie/Tag Theorie).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 5
      }
    },
    {
      id: 'hq_van_spoiler',
      name: 'Riesiger Heckspoiler',
      cost: 200, // Cosmetic
      currency: 'fame',
      img: 'ITEM_SPOILER',
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
      id: 'hq_van_disco',
      name: 'Disco Kugel',
      cost: 600, // Vibe upgrade
      currency: 'fame',
      img: 'ITEM_DISCO_BALL',
      description: 'Party im Bus! (+2 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    },
    {
      id: 'hq_van_flamethrower',
      name: 'Auspuff-Flammenwerfer',
      cost: 2500, // Extreme upgrade
      currency: 'fame',
      img: 'ITEM_FLAMETHROWER',
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
      id: 'hq_room_coffee',
      name: 'Profi Espressomaschine',
      cost: 400, // Appliance cost
      currency: 'money',
      img: 'ITEM_HQ_COFFEE',
      description: 'Besuch im HQ stellt sofort 20 Mood bei allen her. (Sofort)',
      effect: { type: 'unlock_hq', id: 'hq_coffee' }
    },
    {
      id: 'hq_room_sofa',
      name: 'Ledercouch & Konsole',
      cost: 600, // Furniture cost
      currency: 'money',
      img: 'ITEM_HQ_SOFA',
      description: 'Besuch im HQ stellt sofort 30 Stamina her. (Sofort)',
      effect: { type: 'unlock_hq', id: 'hq_sofa' }
    },
    {
      id: 'hq_room_marketing',
      name: 'Social Media Botnetz',
      cost: 1000, // Service cost
      currency: 'fame',
      img: 'ITEM_HQ_BOTNET',
      description: 'Passive Follower Generation (+10/Tag).',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'passiveFollowers',
        value: 10
      }
    },
    {
      id: 'hq_room_label',
      name: 'Plattenvertrag (Indie)',
      cost: 5000, // Major milestone cost
      currency: 'fame',
      img: 'ITEM_HQ_LABEL',
      description: 'Sofort +500€ Bonus.',
      effect: { type: 'unlock_hq', id: 'hq_label' }
    },
    // Gritty HQ Items
    {
      id: 'hq_room_old_couch',
      name: 'Durchgesessene Couch',
      cost: 100, // Cheap furniture
      currency: 'money',
      img: 'ITEM_HQ_OLD_COUCH',
      description: 'Ort zum Abhängen. (+10 Stamina Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_old_couch' }
    },
    {
      id: 'hq_room_poster_wall',
      name: 'DIY Posterwand',
      cost: 50, // Decoration cost
      currency: 'money',
      img: 'ITEM_HQ_POSTERS',
      description: 'Authentizität für Fans. (+10 Fame Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_poster_wall' }
    },
    {
      id: 'hq_room_cheap_beer_fridge',
      name: 'Billig-Bier Kühlschrank',
      cost: 200, // Appliance cost
      currency: 'money',
      img: 'ITEM_HQ_FRIDGE',
      description: 'Immer kaltes Bier. (+5 Mood Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_cheap_beer_fridge' }
    },
    {
      id: 'hq_room_diy_soundproofing',
      name: 'Eierkarton-Dämmung',
      cost: 100, // Material cost
      currency: 'money',
      img: 'ITEM_HQ_EGGS',
      description: 'Weniger Lärmbelästigung. (+5 Harmony Sofort).',
      effect: { type: 'unlock_hq', id: 'hq_diy_soundproofing' }
    },
    // Bizarre HQ Items
    {
      id: 'hq_room_cat',
      name: 'Band-Katze "Satan"',
      cost: 50, // Adoption fee
      currency: 'money',
      img: 'ITEM_HQ_CAT',
      description: 'Macht alles besser. (+10 Harmony).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 10
      }
    },
    {
      id: 'hq_room_beer_pipeline',
      name: 'Direkte Bierleitung',
      cost: 2000, // Luxury installation
      currency: 'money',
      img: 'ITEM_HQ_PIPELINE',
      description: 'Vom Pub nebenan. (+20 Harmony).',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 20
      }
    },
    {
      id: 'hq_room_shrine',
      name: 'Schrein für Lemmy',
      cost: 660, // Occult cost (Adjusted to multiple of 10)
      currency: 'fame',
      img: 'ITEM_HQ_SHRINE',
      description: 'Täglicher Segen des Rockgottes. (+10 Luck).',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 10 }
    },
    {
      id: 'hq_room_skull',
      name: 'Echter Tierschädel',
      cost: 300, // Decor cost
      currency: 'money',
      img: 'ITEM_HQ_SKULL',
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
