import PropTypes from 'prop-types'
import { ShopItem } from './ShopItem'

export const UpgradesTab = ({
  player,
  upgrades,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  processingItemId
}) => {
  return (
    <div className='max-h-[60vh] overflow-y-auto'>
      <div className='mb-4 flex justify-end gap-4 font-mono text-(--star-white)'>
        <span>
          FAME: <span className='text-(--warning-yellow)'>{player.fame}★</span>
        </span>
        <span>
          MONEY: <span className='text-(--toxic-green)'>{player.money}€</span>
        </span>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4'>
        {upgrades.map(item => (
          <ShopItem
            key={item.id}
            item={item}
            isOwned={isItemOwned(item)}
            isDisabled={isItemDisabled(item)}
            onBuy={handleBuy}
            processingItemId={processingItemId}
          />
        ))}
      </div>
    </div>
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
  processingItemId: PropTypes.string
}
