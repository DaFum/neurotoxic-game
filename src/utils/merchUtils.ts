import { finiteNumberOr } from './gameStateUtils'
import { HQ_ITEMS_BY_MERCH_KEY } from '../data/hqItems'

export type HQItemDef =
  typeof HQ_ITEMS_BY_MERCH_KEY extends ReadonlyMap<string, infer T> ? T : never

export const getMerchBundleAmount = (itemDef?: HQItemDef | null): number => {
  if (!itemDef) return 10
  const effect = itemDef.effect
  if (
    effect &&
    typeof effect === 'object' &&
    Object.hasOwn(effect, 'value') &&
    typeof effect.value === 'number' &&
    Number.isFinite(effect.value) &&
    effect.value > 0
  ) {
    return effect.value
  }
  return 10
}

export const getTotalMerchStock = (
  inventory: Record<string, unknown>
): number => {
  let total = 0
  for (const merchKey of HQ_ITEMS_BY_MERCH_KEY.keys()) {
    const value = inventory[merchKey]
    total += typeof value === 'number' && Number.isFinite(value) ? value : 0
  }
  return Math.max(0, total)
}

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
