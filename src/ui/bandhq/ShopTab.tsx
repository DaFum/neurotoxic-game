import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../../data/hqItems'
import { CatalogTab } from './CatalogTab'
import type { CatalogConsumerProps, CatalogItem } from '../../types/components'
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
  const items: CatalogItem[] = [...HQ_ITEMS.gear, ...HQ_ITEMS.instruments]

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
