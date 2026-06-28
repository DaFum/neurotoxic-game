export const van = [
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
    cost: 100, // Cheap repair
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
    cost: 20, // Consumable repair
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
] as const
