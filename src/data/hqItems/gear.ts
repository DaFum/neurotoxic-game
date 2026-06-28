export const gear = [
// Standard Consumables
    {
      id: 'hq_gear_neuro_decimator',
      name: 'items:hq_gear_neuro_decimator.name',
      category: 'GEAR',
      cost: 660, // Brutalist pricing, rounded to multiple of 10 for integrity test
      currency: 'money',
      img: 'ITEM_NEURO_DECIMATOR',
      description: 'items:hq_gear_neuro_decimator.description',
      effect: { type: 'inventory_set', item: 'neuroDecimator', value: true }
    },
    {
      id: 'hq_gear_neurotoxic_pedal',
      name: 'items:hq_gear_neurotoxic_pedal.name',
      category: 'GEAR',
      cost: 660,
      currency: 'money',
      img: 'ITEM_NEUROTOXIC_PEDAL',
      description: 'items:hq_gear_neurotoxic_pedal.description',
      effect: { type: 'inventory_set', item: 'neurotoxicPedal', value: true }
    },
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
    {
      id: 'hq_merch_neuro_cutting_board_bundle',
      name: 'items:hq_merch_neuro_cutting_board_bundle.name',
      category: 'MERCH',
      cost: 150, // 7.5€/Board production cost
      currency: 'money',
      img: 'ITEM_MERCH_NEURO_CUTTING_BOARD',
      description: 'items:hq_merch_neuro_cutting_board_bundle.description',
      effect: { type: 'inventory_add', item: 'neuro_cutting_board', value: 20 }
    },
    {
      id: 'hq_merch_neuro_lunchbox_bundle',
      name: 'items:hq_merch_neuro_lunchbox_bundle.name',
      category: 'MERCH',
      cost: 200, // 10€/Lunchbox production cost
      currency: 'money',
      img: 'ITEM_MERCH_NEURO_LUNCHBOX',
      description: 'items:hq_merch_neuro_lunchbox_bundle.description',
      effect: { type: 'inventory_add', item: 'neuro_lunchbox', value: 20 }
    },
    {
      id: 'hq_merch_neuro_mug_bundle',
      name: 'items:hq_merch_neuro_mug_bundle.name',
      category: 'MERCH',
      cost: 120, // 4€/Mug production cost
      currency: 'money',
      img: 'ITEM_MERCH_NEURO_MUG',
      description: 'items:hq_merch_neuro_mug_bundle.description',
      effect: { type: 'inventory_add', item: 'neuro_mug', value: 30 }
    },
    {
      id: 'hq_merch_neuro_bowl_bundle',
      name: 'items:hq_merch_neuro_bowl_bundle.name',
      category: 'MERCH',
      cost: 150, // 5€/Bowl production cost
      currency: 'money',
      img: 'ITEM_MERCH_NEURO_BOWL',
      description: 'items:hq_merch_neuro_bowl_bundle.description',
      effect: { type: 'inventory_add', item: 'neuro_bowl', value: 30 }
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
] as const
