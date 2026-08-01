/**
 * Defines the comprehensive collection of obtainable Headquarters (HQ) items, upgrades, and room enhancements.
 *
 * @remarks
 * These items intrinsically influence band statistics (e.g., harmony, fame) and act as progression gateways
 * by unlocking specific narrative or visual dimensions of the player's HQ. When an `unlock_hq` item is purchased, the purchase handler merely records ownership of its ID. However, the runtime engine (e.g., `updatePassiveEffectsAndMembers` and `unlockCheck`) actively reads these IDs to apply passive gameplay effects like stamina/mood recovery and to enable trait progression.
 */
export const hq = [
  {
    id: 'hq_room_coffee',
    name: 'items:hq_room_coffee.name',
    category: 'HQ',
    cost: 200, // Appliance cost
    currency: 'money',
    img: 'ITEM_HQ_COFFEE',
    description: 'items:hq_room_coffee.description',
    effect: { type: 'unlock_hq', id: 'hq_coffee' }
  },
  {
    id: 'hq_room_sofa',
    name: 'items:hq_room_sofa.name',
    category: 'HQ',
    cost: 290, // Furniture cost
    currency: 'money',
    img: 'ITEM_HQ_SOFA',
    description: 'items:hq_room_sofa.description',
    effect: { type: 'unlock_hq', id: 'hq_sofa' }
  },
  {
    id: 'hq_room_marketing',
    name: 'items:hq_room_marketing.name',
    category: 'HQ',
    cost: 540, // Service cost
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
    cost: 2700, // Major milestone cost
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
    cost: 50, // Cheap furniture
    currency: 'money',
    img: 'ITEM_HQ_OLD_COUCH',
    description: 'items:hq_room_old_couch.description',
    effect: { type: 'unlock_hq', id: 'hq_old_couch' }
  },
  {
    id: 'hq_room_poster_wall',
    name: 'items:hq_room_poster_wall.name',
    category: 'HQ',
    cost: 20, // Decoration cost
    currency: 'money',
    img: 'ITEM_HQ_POSTERS',
    description: 'items:hq_room_poster_wall.description',
    effect: { type: 'unlock_hq', id: 'hq_poster_wall' }
  },
  {
    id: 'hq_room_cheap_beer_fridge',
    name: 'items:hq_room_cheap_beer_fridge.name',
    category: 'HQ',
    cost: 100, // Appliance cost
    currency: 'money',
    img: 'ITEM_HQ_FRIDGE',
    description: 'items:hq_room_cheap_beer_fridge.description',
    effect: { type: 'unlock_hq', id: 'hq_cheap_beer_fridge' }
  },
  {
    id: 'hq_room_diy_soundproofing',
    name: 'items:hq_room_diy_soundproofing.name',
    category: 'HQ',
    cost: 50, // Material cost
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
    cost: 20, // Adoption fee
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
    cost: 12500, // Luxury installation
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
    cost: 360, // Occult cost (Adjusted to multiple of 10)
    currency: 'fame',
    img: 'ITEM_HQ_SHRINE',
    description: 'items:hq_room_shrine.description',
    effect: { type: 'unlock_hq', id: 'hq_room_shrine' }
  },
  {
    id: 'hq_room_skull',
    name: 'items:hq_room_skull.name',
    category: 'HQ',
    cost: 150, // Decor cost
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
    cost: 250,
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
    cost: 360,
    currency: 'fame',
    img: 'ITEM_HQ_VOID_ALTAR',
    description: 'items:hq_room_void_altar.description',
    effect: { type: 'unlock_hq', id: 'hq_room_void_altar' }
  }
] as const
