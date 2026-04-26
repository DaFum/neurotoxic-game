import PropTypes from 'prop-types'
import { CatalogTab } from './CatalogTab'

export const UpgradesTab = ({
  player,
  upgrades,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: Record<string, unknown>) => {
  return (
    <CatalogTab
      items={upgrades}
      balances={{ fame: (player as any).fame, money: (player as any).money }}
      handleBuy={handleBuy}
      isItemOwned={isItemOwned}
      isItemDisabled={isItemDisabled}
      getAdjustedCost={getAdjustedCost}
      processingItemId={processingItemId}
    />
  )
}

UpgradesTab.propTypes = {
  player: PropTypes.shape({
    money: PropTypes.number,
    fame: PropTypes.number
  }).isRequired,
  upgrades: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleBuy: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  getAdjustedCost: PropTypes.func,
  processingItemId: PropTypes.string
}
