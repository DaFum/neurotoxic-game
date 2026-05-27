import { finiteNumberOr } from './gameStateUtils'

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
