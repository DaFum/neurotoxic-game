// TODO: Review this file
import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../../data/hqItems'
import { CatalogTab } from './CatalogTab'

export const ShopTab = ({
  player,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}) => {
  return (
    <CatalogTab
      items={[...HQ_ITEMS.gear, ...HQ_ITEMS.instruments]}
      balances={{ funds: player.money }}
      handleBuy={handleBuy}
      isItemOwned={isItemOwned}
      isItemDisabled={isItemDisabled}
      getAdjustedCost={getAdjustedCost}
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
  processingItemId: PropTypes.string
}
