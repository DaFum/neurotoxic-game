import PropTypes from 'prop-types'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { getPrimaryEffect } from '../../utils/purchaseLogicUtils'
import { GlitchButton } from '../GlitchButton'

export const ShopItem = ({
  item,
  isOwned,
  isDisabled,
  adjustedCost,
  onBuy,
  processingItemId
}) => {
  const primaryEffect = getPrimaryEffect(item)
  const isConsumable = primaryEffect?.type === 'inventory_add'
  const isPurchased = isOwned && !isConsumable

  const isProcessingThis = processingItemId === item.id
  const isAnyProcessing = !!processingItemId

  const handlePurchase = () => {
    if (isDisabled || isPurchased || isAnyProcessing) return
    onBuy(item)
  }

  return (
    <div
      className={`p-4 border-2 relative flex flex-col justify-between transition-colors
        ${
          isPurchased
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
          {adjustedCost !== undefined && adjustedCost < item.cost ? (
            <>
              <span className='line-through opacity-50 mr-2'>{item.cost}</span>
              <span className='text-(--toxic-green)'>{adjustedCost}</span>
            </>
          ) : adjustedCost !== undefined ? (
            adjustedCost
          ) : (
            item.cost
          )}{' '}
          {item.currency === 'fame' ? '★' : '€'}
        </span>
        <GlitchButton
          onClick={handlePurchase}
          disabled={
            isDisabled || isPurchased || (isAnyProcessing && !isProcessingThis)
          }
          variant={isPurchased ? 'owned' : 'primary'}
          isLoading={isProcessingThis}
          size='sm'
          className='min-w-[80px]'
        >
          {isPurchased ? 'OWNED' : 'BUY'}
        </GlitchButton>
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
  adjustedCost: PropTypes.number,
  /** Callback executed on purchase attempt. Parent handles lock. */
  onBuy: PropTypes.func.isRequired,
  processingItemId: PropTypes.string
}
