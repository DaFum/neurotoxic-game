import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../../data/hqItems'
import { CatalogTab } from './CatalogTab'
import type { CatalogConsumerProps, CatalogItem, PurchaseItem } from '../../types/components'
import type { PlayerState } from '../../types/game'

type ShopTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money'>
}

export const ShopTab = ({
  player,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: ShopTabProps) => {
  const rawItems: PurchaseItem[] = [
    ...((HQ_ITEMS.gear as unknown as PurchaseItem[]) || []),
    ...((HQ_ITEMS.instruments as unknown as PurchaseItem[]) || [])
  ]

  const items: CatalogItem[] = rawItems
    .filter((item): item is PurchaseItem & { id: string | number; cost: number } =>
      item.id != null && item.cost != null
    )
    .map(item => ({
      ...item,
      id: String(item.id),
      cost: Number(item.cost),
      effect: item.effect as import('../../types/components').Effect
    }))

  return (
    <CatalogTab
      items={items}
      balances={{ funds: player.money }}
      handleBuyCallback={handleBuy}
      isItemOwnedCallback={isItemOwned}
      isItemDisabledCallback={isItemDisabled}
      getAdjustedCostCallback={getAdjustedCost}
      processingItemId={processingItemId}
    />
  )
}

ShopTab.propTypes = {
  player: PropTypes.shape({
    money: PropTypes.number
  }).isRequired,
  handleBuy: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  getAdjustedCost: PropTypes.func,
  processingItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}
