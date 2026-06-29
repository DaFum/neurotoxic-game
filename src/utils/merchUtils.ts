import { finiteNumberOr } from './gameState'
import { HQ_ITEMS_BY_MERCH_KEY } from '../data/hqItems'

/**
 * HQ item definition type for merch-backed inventory items.
 */
export type HQItemDef =
  typeof HQ_ITEMS_BY_MERCH_KEY extends ReadonlyMap<string, infer T> ? T : never

/**
 * Base merch carrying capacity before asset modifiers.
 */
export const BASE_MERCH_CAPACITY = 100

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
