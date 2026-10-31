import { finiteNumberOr } from './gameState'
import { isFiniteNumber } from './finiteNumber'
import { HQ_ITEMS_BY_MERCH_KEY } from '../data/hqItems'
import { MERCH_MAX_PRICES } from '../data/merch'
import type { BandState } from '../types'
import type { AssetModifiers } from '../types/assets'

/**
 * HQ item definition type for merch-backed inventory items.
 */
type HQItemDef =
  typeof HQ_ITEMS_BY_MERCH_KEY extends ReadonlyMap<string, infer T> ? T : never

/**
 * Base merch carrying capacity before asset modifiers.
 */
const BASE_MERCH_CAPACITY = 100

/**
 * Calculates merch carrying capacity from a capacity bonus.
 */
export const getMerchCapacity = (bonus: unknown): number =>
  BASE_MERCH_CAPACITY + Math.max(0, finiteNumberOr(bonus, 0))

/**
 * Resolves the number of merch units restored by one restock bundle.
 */
export const getMerchBundleAmount = (itemDef?: HQItemDef | null): number => {
  if (!itemDef) return 10
  const effect = itemDef.effect
  if (
    effect &&
    typeof effect === 'object' &&
    Object.hasOwn(effect, 'value') &&
    typeof (effect as { value?: unknown }).value === 'number' &&
    Number.isFinite((effect as { value?: unknown }).value) &&
    ((effect as { value?: unknown }).value as number) > 0
  ) {
    return (effect as { value?: unknown }).value as number
  }
  return 10
}

/**
 * Sums all merch stock counts from inventory.
 */
export const getTotalMerchStock = (
  inventory: Record<string, unknown>
): number => {
  let total = 0
  for (const merchKey of HQ_ITEMS_BY_MERCH_KEY.keys()) {
    const value = inventory[merchKey]
    total += finiteNumberOr(value, 0)
  }
  return Math.max(0, total)
}

/**
 * Calculates the proportional cost for a merch restock amount.
 */
export const resolveMerchRestockCost = ({
  itemCost,
  merchCostMultiplier,
  restockAmount,
  bundleAmount
}: {
  itemCost: unknown
  merchCostMultiplier: unknown
  restockAmount: unknown
  bundleAmount: unknown
}): number => {
  const safeItemCost = Math.max(0, finiteNumberOr(itemCost, 50))
  const safeMultiplier = Math.max(0, finiteNumberOr(merchCostMultiplier, 1))
  const safeRestockAmount = Math.max(0, finiteNumberOr(restockAmount, 0))
  const safeBundleAmount = Math.max(1, finiteNumberOr(bundleAmount, 10))
  const cappedRestockAmount = Math.min(safeRestockAmount, safeBundleAmount)

  if (cappedRestockAmount <= 0) return 0

  const fullBundleCost = Math.ceil(safeItemCost * safeMultiplier)
  return Math.ceil(fullBundleCost * (cappedRestockAmount / safeBundleAmount))
}

/**
 * Resolves one restock of a merch item against the current stock.
 *
 * @param merchKey - Merch inventory key to restock.
 * @param inventory - Current band inventory.
 * @param assetModifiers - Active asset merch capacity bonus and cost multiplier.
 * @returns `null` for a key that is not restockable merch; otherwise the units
 * one restock adds (`0` when stock is at capacity) and their cost.
 *
 * @remarks
 * Shared by the pre-gig handler, which picks its toast from it, and the
 * `RESTOCK_MERCH` reducer, which stays authoritative over the purchase.
 */
export const resolveMerchRestock = (
  merchKey: string,
  inventory: Record<string, unknown>,
  assetModifiers: Pick<
    AssetModifiers,
    'merchCapacityBonus' | 'merchCostMultiplier'
  >
): { restockAmount: number; cost: number } | null => {
  const itemDef = HQ_ITEMS_BY_MERCH_KEY.get(merchKey)
  if (!itemDef) return null
  const bundleAmount = getMerchBundleAmount(itemDef)
  const remainingCapacity = Math.max(
    0,
    getMerchCapacity(assetModifiers.merchCapacityBonus) -
      getTotalMerchStock(inventory)
  )
  const restockAmount = Math.min(bundleAmount, remainingCapacity)
  return {
    restockAmount,
    cost: resolveMerchRestockCost({
      itemCost: itemDef.cost,
      merchCostMultiplier: assetModifiers.merchCostMultiplier,
      restockAmount,
      bundleAmount
    })
  }
}

/**
 * Checks whether a key names a sellable merch item (a `MERCH_MAX_PRICES` key).
 * @param key - Untrusted sold-merch key.
 * @returns True only for canonical merch keys; gear, consumables, unknown and
 * forbidden keys are rejected.
 */
export const isSoldMerchKey = (key: string): boolean =>
  Object.hasOwn(MERCH_MAX_PRICES, key)

/**
 * Decrements sold-merch counts from a band inventory, clamped at zero (pure).
 * Keys that are not canonical merch keys are ignored, so a sold count can
 * never zero out gear flags or add unknown inventory keys. A canonical key
 * whose stored value is not a finite number is ignored too and keeps its
 * stored value.
 * @param inventory - Current band inventory.
 * @param soldMerch - Quantities sold this gig, keyed by merch id.
 * @returns A new inventory record with sold quantities removed.
 */
export function buildSoldMerchInventory(
  inventory: BandState['inventory'] | undefined | null,
  soldMerch: Record<string, number>
): BandState['inventory'] {
  const updatedInventory = { ...(inventory || {}) }
  for (const merchKey in soldMerch) {
    if (Object.hasOwn(soldMerch, merchKey) && isSoldMerchKey(merchKey)) {
      // A stored value that is not a finite number (a missing key, a flag, a
      // string, NaN) is not a stock count: leave it as it is instead of
      // rewriting it to a number.
      const currentAmount = updatedInventory[merchKey]
      if (!isFiniteNumber(currentAmount)) continue
      const soldAmount = Math.max(0, finiteNumberOr(soldMerch[merchKey], 0))
      updatedInventory[merchKey] = Math.max(0, currentAmount - soldAmount)
    }
  }
  return updatedInventory
}
