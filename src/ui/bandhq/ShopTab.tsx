import { HQ_ITEMS } from '../../data/hqItems'
import { isCatalogEffect } from '../../utils/catalogEffectUtils'
import { isFiniteNumber } from '../../utils/finiteNumber'
import { CatalogTab } from './CatalogTab'
import type {
  CatalogConsumerProps,
  CatalogItem,
  PurchaseItem,
  Effect
} from '../../types/components'
import type { PlayerState } from '../../types'

type ShopTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money'>
}

// ⚡ Bolt Optimization:
// Lifted expensive array creation and filtering out of the render loop.
// Iterating over the source arrays directly using a nested loop avoids
// intermediate array allocations and temporary variables in the module scope.
const ITEMS: CatalogItem[] = (() => {
  const processed: CatalogItem[] = []
  const sources = [
    (Array.isArray(HQ_ITEMS.gear)
      ? HQ_ITEMS.gear
      : []) as unknown as PurchaseItem[],
    (Array.isArray(HQ_ITEMS.instruments)
      ? HQ_ITEMS.instruments
      : []) as unknown as PurchaseItem[]
  ]

  for (let j = 0; j < sources.length; j++) {
    const source = sources[j]
    if (!source || !Array.isArray(source)) continue

    for (let i = 0; i < source.length; i++) {
      const item = source[i]
      if (item == null || item.id == null) continue
      if (!isFiniteNumber(item.cost)) continue

      if (item.effect != null && !isCatalogEffect(item.effect)) {
        throw new Error(
          `Invalid effect shape in ShopTab for item "${String(item.id)}"`
        )
      }

      processed.push({
        ...item,
        id: String(item.id),
        cost: item.cost,
        effect: item.effect as Effect | undefined
      })
    }
  }
  return processed
})()

/**
 * Displays shop catalog items available in Band HQ.
 * @param props - Display data, state flags, callbacks, and visual options for the shop tab view.
 */
export const ShopTab = ({
  player,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: ShopTabProps) => {
  return (
    <CatalogTab
      items={ITEMS}
      balances={{ funds: player.money }}
      handleBuyCallback={handleBuy}
      isItemOwnedCallback={isItemOwned}
      isItemDisabledCallback={isItemDisabled}
      getAdjustedCostCallback={getAdjustedCost}
      processingItemId={processingItemId}
    />
  )
}
