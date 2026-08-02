import { HQ_ITEMS } from '../../data/hqItems'
import { CatalogTab } from './CatalogTab'
import type { CatalogConsumerProps, CatalogItem } from '../../types/components'
import type { PlayerState } from '../../types'

type ShopTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money'>
}

// Lifted out of the render loop. The catalog data files are checked against
// `PurchaseItem` with `satisfies`, so no runtime normalization is needed.
const ITEMS: CatalogItem[] = [...HQ_ITEMS.gear, ...HQ_ITEMS.instruments]

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
