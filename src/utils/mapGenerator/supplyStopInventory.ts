import { HQ_ITEMS } from '../../data/hqItems'
import { pickRandomSubset } from './mathUtils'
import type { PurchaseItem } from '../../types/components'

/**
 * Picks the stock of a supply stop: three distinct `inventory_add` gear items.
 *
 * Shared by the Career map generator and the Expedition route builder so both
 * stock their supply stops from the same catalog slice.
 *
 * @param random - Seeded source of floats in `[0, 1)`; the draws it consumes
 * are exactly those of `pickRandomSubset(items, 3, random)`.
 * @returns A new array with the selected items.
 */
export const pickSupplyStopInventory = (
  random: () => number
): PurchaseItem[] => {
  const inventoryAddItems = HQ_ITEMS.gear.filter(
    i => i.effect?.type === 'inventory_add'
  ) as PurchaseItem[]
  return pickRandomSubset(inventoryAddItems, 3, random)
}
