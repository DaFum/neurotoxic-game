import PropTypes from 'prop-types'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { getPrimaryEffect } from '../../hooks/usePurchaseLogic'

export const ShopItem = ({ item, isOwned, isDisabled, onBuy }) => {
  const primaryEffect = getPrimaryEffect(item)
  const isConsumable = primaryEffect?.type === 'inventory_add'

  return (
    <div
      className={`p-4 border-2 relative flex flex-col justify-between transition-colors
        ${
          isOwned && !isConsumable
            ? 'border-(--toxic-green) bg-(--toxic-green)/10'
            : 'border-(--ash-gray) bg-(--void-black)/80'
        }`}
    >
      <div>
        <div className='flex items-center gap-2 mb-2'>
          <img
            src={getGenImageUrl(IMG_PROMPTS[item.img] || item.name)}
            alt={item.name}
            className='w-12 h-12 object-contain bg-(--void-black) border-2 border-(--ash-gray)'
          />
          <h4 className='font-bold text-(--toxic-green) leading-tight font-mono uppercase'>
            {item.name}
          </h4>
        </div>
        <p className='text-xs text-(--ash-gray) mb-2 font-mono'>
          {item.description}
        </p>
      </div>
      <div className='flex justify-between items-center mt-2'>
        <span
          className={`font-mono text-sm font-bold ${
            item.currency === 'fame'
              ? 'text-(--warning-yellow)'
              : 'text-(--star-white)'
          }`}
        >
          {item.cost} {item.currency === 'fame' ? '★' : '€'}
        </span>
        <button
          onClick={() => onBuy(item)}
          disabled={isDisabled}
          className={`px-3 py-1 text-xs font-bold uppercase transition-all duration-200 border-2
            ${
              isOwned && !isConsumable
                ? 'border-(--ash-gray) text-(--ash-gray) cursor-default'
                : isDisabled
                  ? 'border-(--disabled-border) text-(--disabled-text) bg-(--disabled-bg) cursor-not-allowed'
                  : 'border-(--toxic-green) bg-(--toxic-green) text-(--void-black) hover:invert shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
        >
          {isOwned && !isConsumable ? 'OWNED' : 'BUY'}
        </button>
      </div>
    </div>
  )
}

ShopItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    cost: PropTypes.number.isRequired,
    currency: PropTypes.string,
    img: PropTypes.string,
    effects: PropTypes.array,
    effect: PropTypes.object
  }).isRequired,
  isOwned: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  onBuy: PropTypes.func.isRequired
}
