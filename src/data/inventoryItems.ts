/**
 * Gameplay effects of the non-merch band inventory keys granted by HQ shop
 * items and quest rewards.
 *
 * @remarks
 * Every key listed here must also exist in `DEFAULT_BAND_STATE.inventory`, or
 * `sanitizeBandInventory` drops it on load and the effect silently vanishes
 * with the item.
 */

/** One-shot effect applied by `CONSUME_ITEM` when a usable item is used. */
export interface InventoryUseEffect {
  /** Added to every member's mood. */
  readonly memberMood?: number
  /** Added to every member's stamina. */
  readonly memberStamina?: number
  /** Added to the van's condition. */
  readonly vanCondition?: number
  /** Added to band luck. */
  readonly luck?: number
  /**
   * HQ catalog id whose Expedition policy gates the use; a `between_tours_only`
   * item cannot be used during an active run.
   */
  readonly expeditionPolicyItemId?: string
}

/**
 * Usable inventory items and what one use does. Values stay small: each item
 * costs 10–20 or is a quest reward, and the stats drift back daily.
 */
export const INVENTORY_USE_EFFECTS: Readonly<
  Record<string, InventoryUseEffect>
> = {
  tape_glue: { vanCondition: 5, expeditionPolicyItemId: 'hq_van_tape_glue' },
  diy_patch_kit: { memberMood: 3 },
  canned_food: { memberStamina: 5 },
  beer_bulk: { memberMood: 2 },
  energy_drink: { memberStamina: 10 },
  lucky_pick: { luck: 2 }
}

/**
 * Backup gear, in consumption order. When a botched setup minigame would set
 * `damaged_gear`, the first owned spare is used up instead.
 */
export const SPARE_GEAR_ITEM_IDS = ['cheap_mics', 'broken_pedal'] as const

/** Daily stamina each member recovers while the band owns sleeping bags. */
export const SLEEPING_BAGS_STAMINA_PER_DAY = 1
