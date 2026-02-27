export const HQ_ITEMS = {
  gear: [
    // Standard Consumables
    {
      id: 'hq_gear_strings',
      name: 'items:hq_gear_strings.name',
      category: 'GEAR',
      cost: 20, // Low cost consumable
      currency: 'money',
      img: 'ITEM_STRINGS',
      description: 'items:hq_gear_strings.description',
      effect: { type: 'inventory_set', item: 'strings', value: true }
    },
    {
      id: 'hq_gear_cables',
      name: 'items:hq_gear_cables.name',
      category: 'GEAR',
      cost: 50, // Mid-range cable cost
      currency: 'money',
      img: 'ITEM_CABLES',
      description: 'items:hq_gear_cables.description',
      effect: { type: 'inventory_set', item: 'cables', value: true }
    },
    {
      id: 'hq_gear_drum_parts',
      name: 'items:hq_gear_drum_parts.name',
      category: 'GEAR',
      cost: 60, // Standard drum maintenance
      currency: 'money',
      img: 'ITEM_DRUM_PARTS',
      description: 'items:hq_gear_drum_parts.description',
      effect: { type: 'inventory_set', item: 'drum_parts', value: true }
    },
    // Merch Restocks
    {
      id: 'hq_merch_shirts_bundle',
      name: 'items:hq_merch_shirts_bundle.name',
      category: 'MERCH',
      cost: 150, // 6€/Shirt production cost
      currency: 'money',
      img: 'ITEM_MERCH_SHIRTS',
      description: 'items:hq_merch_shirts_bundle.description',
      effect: { type: 'inventory_add', item: 'shirts', value: 25 }
    },
    {
      id: 'hq_merch_hoodies_bundle',
      name: 'items:hq_merch_hoodies_bundle.name',
      category: 'MERCH',
      cost: 200, // 20€/Hoodie production cost
      currency: 'money',
      img: 'ITEM_MERCH_HOODIES',
      description: 'items:hq_merch_hoodies_bundle.description',
      effect: { type: 'inventory_add', item: 'hoodies', value: 10 }
    },
    {
      id: 'hq_merch_patches_bundle',
      name: 'items:hq_merch_patches_bundle.name',
      category: 'MERCH',
      cost: 50, // 1€/Patch production cost
      currency: 'money',
      img: 'ITEM_MERCH_PATCHES',
      description: 'items:hq_merch_patches_bundle.description',
      effect: { type: 'inventory_add', item: 'patches', value: 50 }
    },
    {
      id: 'hq_merch_vinyl_bundle',
      name: 'items:hq_merch_vinyl_bundle.name',
      category: 'MERCH',
      cost: 300, // 15€/LP production cost
      currency: 'money',
      img: 'ITEM_MERCH_VINYL',
      description: 'items:hq_merch_vinyl_bundle.description',
      effect: { type: 'inventory_add', item: 'vinyl', value: 20 }
    },
    {
      id: 'hq_merch_cds_bundle',
      name: 'items:hq_merch_cds_bundle.name',
      category: 'MERCH',
      cost: 100, // 2€/CD production cost
      currency: 'money',
      img: 'ITEM_MERCH_CDS',
      description: 'items:hq_merch_cds_bundle.description',
      effect: { type: 'inventory_add', item: 'cds', value: 50 }
    },
    // Realistic/Gritty Gear
    {
      id: 'hq_gear_broken_pedal',
      name: 'items:hq_gear_broken_pedal.name',
      category: 'GEAR',
      cost: 10, // Scrap value
      currency: 'money',
      img: 'ITEM_BROKEN_PEDAL',
      description: 'items:hq_gear_broken_pedal.description',
      effect: { type: 'inventory_set', item: 'broken_pedal', value: true }
    },
    {
      id: 'hq_gear_cheap_mics',
      name: 'items:hq_gear_cheap_mics.name',
      category: 'GEAR',
      cost: 80, // Very cheap for 5 mics
      currency: 'money',
      img: 'ITEM_CHEAP_MICS',
      description: 'items:hq_gear_cheap_mics.description',
      effect: { type: 'inventory_add', item: 'cheap_mics', value: 5 }
    },
    {
      id: 'hq_gear_diy_patch_kit',
      name: 'items:hq_gear_diy_patch_kit.name',
      category: 'GEAR',
      cost: 20, // Cheap sewing kit
      currency: 'money',
      img: 'ITEM_DIY_PATCH_KIT',
      description: 'items:hq_gear_diy_patch_kit.description',
      effect: { type: 'inventory_set', item: 'diy_patch_kit', value: true }
    },
    {
      id: 'hq_gear_tour_food_canned',
      name: 'items:hq_gear_tour_food_canned.name',
      category: 'CONSUMABLE',
      cost: 30, // 3€/Can
      currency: 'money',
      img: 'ITEM_CANNED_FOOD',
      description: 'items:hq_gear_tour_food_canned.description',
      effect: { type: 'inventory_add', item: 'canned_food', value: 10 }
    },
    {
      id: 'hq_gear_tour_beer_bulk',
      name: 'items:hq_gear_tour_beer_bulk.name',
      category: 'CONSUMABLE',
      cost: 40, // Bulk discount beer
      currency: 'money',
      img: 'ITEM_BEER_CRATE',
      description: 'items:hq_gear_tour_beer_bulk.description',
      effect: { type: 'inventory_add', item: 'beer_bulk', value: 30 }
    },
    // Bizarre Gear (Luck/Status Boosts via Inventory Flags or immediate stats)
    {
      id: 'hq_gear_lucky_rabbit_foot',
      name: 'items:hq_gear_lucky_rabbit_foot.name',
      category: 'GEAR',
      cost: 150, // Magic item cost
      currency: 'money',
      img: 'ITEM_RABBIT_FOOT',
      description: 'items:hq_gear_lucky_rabbit_foot.description',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    },
    {
      id: 'hq_gear_duct_tape_roll',
      name: 'items:hq_gear_duct_tape_roll.name',
      category: 'GEAR',
      cost: 80, // High quality tape
      currency: 'money',
      img: 'ITEM_DUCT_TAPE',
      description: 'items:hq_gear_duct_tape_roll.description',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'condition',
        value: 5
      }
    },
    {
      id: 'hq_gear_incense_sticks',
      name: 'items:hq_gear_incense_sticks.name',
      category: 'GEAR',
      cost: 30, // Mood items
      currency: 'money',
      img: 'ITEM_INCENSE',
      description: 'items:hq_gear_incense_sticks.description',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 5
      }
    },
    {
      id: 'hq_gear_voodoo_doll',
      name: 'items:hq_gear_voodoo_doll.name',
      category: 'GEAR',
      cost: 660, // Occult item cost (Adjusted to multiple of 10)
      currency: 'money',
      img: 'ITEM_VOODOO_DOLL',
      description: 'items:hq_gear_voodoo_doll.description',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 5 }
    }
  ],
  instruments: [
    // Guitars & Strings
    {
      id: 'hq_inst_guitar_custom',
      name: 'items:hq_inst_guitar_custom.name',
      category: 'INSTRUMENT',
      cost: 2500, // High-end instrument
      currency: 'money',
      img: 'ITEM_GUITAR_CUSTOM',
      description: 'items:hq_inst_guitar_custom.description',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: -0.15 }
    },
    {
      id: 'hq_inst_guitar_flying_v',
      name: 'items:hq_inst_guitar_flying_v.name',
      category: 'INSTRUMENT',
      cost: 1200, // Mid-range vintage
      currency: 'money',
      img: 'ITEM_GUITAR_V',
      description: 'items:hq_inst_guitar_flying_v.description',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.05 }
    },
    {
      id: 'hq_inst_bass_sansamp',
      name: 'items:hq_inst_bass_sansamp.name',
      category: 'INSTRUMENT',
      cost: 1800, // Pro gear
      currency: 'money',
      img: 'ITEM_BASS_PREAMP',
      description: 'items:hq_inst_bass_sansamp.description',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.1 }
    },
    // Drums
    {
      id: 'hq_inst_drum_trigger',
      name: 'items:hq_inst_drum_trigger.name',
      category: 'INSTRUMENT',
      cost: 2200, // Pro drum gear
      currency: 'money',
      img: 'ITEM_DRUM_TRIGGER',
      description: 'items:hq_inst_drum_trigger.description',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: 0.2
      }
    },
    {
      id: 'hq_inst_cowbell_inferno',
      name: 'items:hq_inst_cowbell_inferno.name',
      category: 'INSTRUMENT',
      cost: 500, // Meme instrument
      currency: 'money',
      img: 'ITEM_COWBELL',
      description: 'items:hq_inst_cowbell_inferno.description',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: 0.05
      }
    },
    // Cheap/Broken Instruments
    {
      id: 'hq_inst_second_guitar',
      name: 'items:hq_inst_second_guitar.name',
      category: 'INSTRUMENT',
      cost: 500, // Backup gear
      currency: 'money',
      img: 'ITEM_GUITAR_CHEAP',
      description: 'items:hq_inst_second_guitar.description',
      effect: { type: 'stat_modifier', stat: 'guitarDifficulty', value: 0.05 } // Makes it slightly harder
    },
    {
      id: 'hq_inst_broken_drum_kit',
      name: 'items:hq_inst_broken_drum_kit.name',
      category: 'INSTRUMENT',
      cost: 1000, // Beater kit
      currency: 'money',
      img: 'ITEM_DRUM_BROKEN',
      description: 'items:hq_inst_broken_drum_kit.description',
      effect: {
        type: 'stat_modifier',
        stat: 'drumMultiplier',
        value: -0.1
      }
    },
    {
      id: 'hq_inst_bass_effect_pedal_cheap',
      name: 'items:hq_inst_bass_effect_pedal_cheap.name',
      category: 'INSTRUMENT',
      cost: 150, // Cheap FX
      currency: 'money',
      img: 'ITEM_PEDAL_CHEAP',
      description: 'items:hq_inst_bass_effect_pedal_cheap.description',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: 0.05 }
    },
    // Weird Instruments
    {
      id: 'hq_inst_theremin_doom',
      name: 'items:hq_inst_theremin_doom.name',
      category: 'INSTRUMENT',
      cost: 3000, // Boutique obscure instrument
      currency: 'money',
      img: 'ITEM_THEREMIN',
      description: 'items:hq_inst_theremin_doom.description',
      effect: { type: 'stat_modifier', stat: 'crowdDecay', value: -0.15 }
    },
    {
      id: 'hq_inst_didgeridoo',
      name: 'items:hq_inst_didgeridoo.name',
      category: 'INSTRUMENT',
      cost: 900, // Niche instrument
      currency: 'money',
      img: 'ITEM_DIDGERIDOO',
      description: 'items:hq_inst_didgeridoo.description',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    }
  ],
  van: [
    {
      id: 'hq_van_suspension',
      name: 'items:hq_van_suspension.name',
      category: 'VAN',
      cost: 500, // Moderate upgrade
      currency: 'fame',
      img: 'ITEM_VAN_SUSPENSION',
      description: 'items:hq_van_suspension.description',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.01
      }
    },
    {
      id: 'hq_van_sound_system',
      name: 'items:hq_van_sound_system.name',
      category: 'VAN',
      cost: 1000, // Major upgrade
      currency: 'fame',
      img: 'ITEM_VAN_STUDIO',
      description: 'items:hq_van_sound_system.description',
      effect: { type: 'unlock_upgrade', id: 'van_sound_system' }
    },
    {
      id: 'hq_van_storage',
      name: 'items:hq_van_storage.name',
      category: 'VAN',
      cost: 800, // Utility upgrade
      currency: 'fame',
      img: 'ITEM_VAN_STORAGE',
      description: 'items:hq_van_storage.description',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'inventorySlots',
        value: 10
      }
    },
    {
      id: 'hq_van_tuning',
      name: 'items:hq_van_tuning.name',
      category: 'VAN',
      cost: 1500, // Performance upgrade
      currency: 'fame',
      img: 'ITEM_VAN_TUNING',
      description: 'items:hq_van_tuning.description',
      effect: { type: 'unlock_upgrade', id: 'van_tuning' }
    },
    // Cheap/DIY Van Items
    {
      id: 'hq_van_tyre_spare',
      name: 'items:hq_van_tyre_spare.name',
      category: 'VAN',
      cost: 100, // Cheap fix
      currency: 'fame',
      img: 'ITEM_VAN_TIRE',
      description: 'items:hq_van_tyre_spare.description',
      effect: {
        type: 'stat_modifier',
        target: 'van',
        stat: 'breakdownChance',
        value: -0.05
      }
    },
    {
      id: 'hq_van_paint_job',
      name: 'items:hq_van_paint_job.name',
      category: 'VAN',
      cost: 300, // Cosmetic/Reputation
      currency: 'fame',
      img: 'ITEM_VAN_PAINT',
      description: 'items:hq_van_paint_job.description',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 5
      }
    },
    {
      id: 'hq_van_sleeping_bags',
      name: 'items:hq_van_sleeping_bags.name',
      category: 'VAN',
      cost: 150, // Survival gear
      currency: 'fame',
      img: 'ITEM_SLEEPING_BAGS',
      description: 'items:hq_van_sleeping_bags.description',
      effect: { type: 'inventory_add', item: 'sleeping_bags', value: 3 }
    },
    {
      id: 'hq_van_tape_glue',
      name: 'items:hq_van_tape_glue.name',
      category: 'VAN',
      cost: 20, // Consumable fix
      currency: 'fame',
      img: 'ITEM_GLUE_TAPE',
      description: 'items:hq_van_tape_glue.description',
      effect: { type: 'inventory_set', item: 'tape_glue', value: true }
    },
    // Skurrile Van Upgrades
    {
      id: 'hq_van_mattress',
      name: 'items:hq_van_mattress.name',
      category: 'VAN',
      cost: 300, // QoL upgrade
      currency: 'fame',
      img: 'ITEM_MATTRESS',
      description: 'items:hq_van_mattress.description',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 5
      }
    },
    {
      id: 'hq_van_spoiler',
      name: 'items:hq_van_spoiler.name',
      category: 'VAN',
      cost: 200, // Cosmetic
      currency: 'fame',
      img: 'ITEM_SPOILER',
      description: 'items:hq_van_spoiler.description',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 1
      }
    },
    {
      id: 'hq_van_disco',
      name: 'items:hq_van_disco.name',
      category: 'VAN',
      cost: 600, // Vibe upgrade
      currency: 'fame',
      img: 'ITEM_DISCO_BALL',
      description: 'items:hq_van_disco.description',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
    },
    {
      id: 'hq_van_flamethrower',
      name: 'items:hq_van_flamethrower.name',
      category: 'VAN',
      cost: 2500, // Extreme upgrade
      currency: 'fame',
      img: 'ITEM_FLAMETHROWER',
      description: 'items:hq_van_flamethrower.description',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 100
      }
    }
  ],
  hq: [
    // Items with type: 'unlock_hq' are currently tracked for ownership only.
    // Gameplay effects (e.g. immediate stat boosts) are pending implementation.
    {
      id: 'hq_room_coffee',
      name: 'items:hq_room_coffee.name',
      category: 'HQ',
      cost: 400, // Appliance cost
      currency: 'money',
      img: 'ITEM_HQ_COFFEE',
      description: 'items:hq_room_coffee.description',
      effect: { type: 'unlock_hq', id: 'hq_coffee' }
    },
    {
      id: 'hq_room_sofa',
      name: 'items:hq_room_sofa.name',
      category: 'HQ',
      cost: 600, // Furniture cost
      currency: 'money',
      img: 'ITEM_HQ_SOFA',
      description: 'items:hq_room_sofa.description',
      effect: { type: 'unlock_hq', id: 'hq_sofa' }
    },
    {
      id: 'hq_room_marketing',
      name: 'items:hq_room_marketing.name',
      category: 'HQ',
      cost: 1000, // Service cost
      currency: 'fame',
      requiresReputation: true,
      img: 'ITEM_HQ_BOTNET',
      description: 'items:hq_room_marketing.description',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'passiveFollowers',
        value: 10
      }
    },
    {
      id: 'hq_room_label',
      name: 'items:hq_room_label.name',
      category: 'HQ',
      cost: 5000, // Major milestone cost
      currency: 'fame',
      requiresReputation: true,
      img: 'ITEM_HQ_LABEL',
      description: 'items:hq_room_label.description',
      effect: { type: 'unlock_hq', id: 'hq_label' }
    },
    // Gritty HQ Items
    {
      id: 'hq_room_old_couch',
      name: 'items:hq_room_old_couch.name',
      category: 'HQ',
      cost: 100, // Cheap furniture
      currency: 'money',
      img: 'ITEM_HQ_OLD_COUCH',
      description: 'items:hq_room_old_couch.description',
      effect: { type: 'unlock_hq', id: 'hq_old_couch' }
    },
    {
      id: 'hq_room_poster_wall',
      name: 'items:hq_room_poster_wall.name',
      category: 'HQ',
      cost: 50, // Decoration cost
      currency: 'money',
      img: 'ITEM_HQ_POSTERS',
      description: 'items:hq_room_poster_wall.description',
      effect: { type: 'unlock_hq', id: 'hq_poster_wall' }
    },
    {
      id: 'hq_room_cheap_beer_fridge',
      name: 'items:hq_room_cheap_beer_fridge.name',
      category: 'HQ',
      cost: 200, // Appliance cost
      currency: 'money',
      img: 'ITEM_HQ_FRIDGE',
      description: 'items:hq_room_cheap_beer_fridge.description',
      effect: { type: 'unlock_hq', id: 'hq_cheap_beer_fridge' }
    },
    {
      id: 'hq_room_diy_soundproofing',
      name: 'items:hq_room_diy_soundproofing.name',
      category: 'HQ',
      cost: 100, // Material cost
      currency: 'money',
      img: 'ITEM_HQ_EGGS',
      description: 'items:hq_room_diy_soundproofing.description',
      effect: { type: 'unlock_hq', id: 'hq_diy_soundproofing' }
    },
    // Bizarre HQ Items
    {
      id: 'hq_room_cat',
      name: 'items:hq_room_cat.name',
      category: 'HQ',
      cost: 50, // Adoption fee
      currency: 'money',
      img: 'ITEM_HQ_CAT',
      description: 'items:hq_room_cat.description',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 10
      }
    },
    {
      id: 'hq_room_beer_pipeline',
      name: 'items:hq_room_beer_pipeline.name',
      category: 'HQ',
      cost: 2000, // Luxury installation
      currency: 'money',
      img: 'ITEM_HQ_PIPELINE',
      description: 'items:hq_room_beer_pipeline.description',
      effect: {
        type: 'stat_modifier',
        target: 'band',
        stat: 'harmony',
        value: 20
      }
    },
    {
      id: 'hq_room_shrine',
      name: 'items:hq_room_shrine.name',
      category: 'HQ',
      cost: 660, // Occult cost (Adjusted to multiple of 10)
      currency: 'fame',
      img: 'ITEM_HQ_SHRINE',
      description: 'items:hq_room_shrine.description',
      effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 10 }
    },
    {
      id: 'hq_room_skull',
      name: 'items:hq_room_skull.name',
      category: 'HQ',
      cost: 300, // Decor cost
      currency: 'money',
      img: 'ITEM_HQ_SKULL',
      description: 'items:hq_room_skull.description',
      effect: {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 5
      }
    },
    {
      id: 'pr_manager_contract',
      name: 'items:pr_manager_contract.name',
      category: 'HQ',
      cost: 500,
      currency: 'money',
      requiresReputation: true,
      img: 'ITEM_HQ_BOTNET', // TODO: placeholder - uses hq_room_marketing until own asset available
      description: 'items:pr_manager_contract.description',
      effect: { type: 'unlock_hq', id: 'pr_manager_contract' }
    }
  ]
}
