export const hq = [
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
    cost: 25000, // Luxury installation
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
    effect: { type: 'unlock_hq', id: 'hq_room_shrine' }
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
    img: 'ITEM_HQ_PR_CONTRACT',
    description: 'items:pr_manager_contract.description',
    effect: { type: 'unlock_hq', id: 'pr_manager_contract' }
  },
  {
    id: 'hq_room_void_altar',
    name: 'items:hq_room_void_altar.name',
    category: 'HQ',
    cost: 660,
    currency: 'fame',
    img: 'ITEM_HQ_VOID_ALTAR',
    description: 'items:hq_room_void_altar.description',
    effect: { type: 'unlock_hq', id: 'hq_room_void_altar' }
  }
] as const
