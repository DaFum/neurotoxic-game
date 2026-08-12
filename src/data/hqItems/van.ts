/**
 * Defines the catalog of available van upgrades and their corresponding effects.
 *
 * @remarks
 * This array serves as the canonical source for all purchasable van items in the headquarters.
 * It includes performance upgrades, cosmetic improvements, and survival gear, each with specific
 * costs and mechanical effects applied to the band, van, or player state.
 */
export const van = [
  {
    id: 'hq_van_suspension',
    name: 'items:hq_van_suspension.name',
    category: 'VAN',
    cost: 270, // Moderate upgrade
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
    cost: 540, // Major upgrade
    currency: 'fame',
    img: 'ITEM_VAN_STUDIO',
    description: 'items:hq_van_sound_system.description',
    effect: { type: 'passive', key: 'harmony_regen_travel' }
  },
  {
    id: 'hq_van_storage',
    name: 'items:hq_van_storage.name',
    category: 'VAN',
    cost: 440, // Utility upgrade
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
    cost: 810, // Performance upgrade
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
    cost: 60, // Cheap repair
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
    cost: 160, // Cosmetic/Reputation
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
    cost: 80, // Survival gear
    currency: 'fame',
    img: 'ITEM_SLEEPING_BAGS',
    description: 'items:hq_van_sleeping_bags.description',
    effect: { type: 'inventory_add', item: 'sleeping_bags', value: 3 }
  },
  {
    id: 'hq_van_tape_glue',
    name: 'items:hq_van_tape_glue.name',
    category: 'VAN',
    cost: 10, // Consumable repair
    currency: 'fame',
    img: 'ITEM_GLUE_TAPE',
    description: 'items:hq_van_tape_glue.description',
    effect: { type: 'inventory_add', item: 'tape_glue', value: 1 }
  },
  // Skurrile Van Upgrades
  {
    id: 'hq_van_mattress',
    name: 'items:hq_van_mattress.name',
    category: 'VAN',
    cost: 160, // QoL upgrade
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
    cost: 110, // Cosmetic
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
    cost: 330, // Vibe upgrade
    currency: 'fame',
    img: 'ITEM_DISCO_BALL',
    description: 'items:hq_van_disco.description',
    effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
  },
  {
    id: 'hq_van_flamethrower',
    name: 'items:hq_van_flamethrower.name',
    category: 'VAN',
    cost: 1400, // Extreme upgrade
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
