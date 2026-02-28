import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../../data/hqItems'
import { ShopItem } from './ShopItem'

export const ShopTab = ({
  player,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}) => {
  return (
    <div>
      <div className='mb-4 text-right font-mono text-(--star-white)'>
        FUNDS: <span className='text-(--toxic-green)'>{player.money}€</span>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4'>
        {[...HQ_ITEMS.gear, ...HQ_ITEMS.instruments].map(item => (
          <ShopItem
            key={item.id}
            item={item}
            isOwned={isItemOwned(item)}
            isDisabled={isItemDisabled(item)}
            adjustedCost={getAdjustedCost ? getAdjustedCost(item) : undefined}
            onBuy={handleBuy}
            processingItemId={processingItemId}
          />
        ))}
      </div>
    </div>
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
