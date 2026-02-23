import { useState } from 'react'
import PropTypes from 'prop-types'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { getPrimaryEffect } from '../../hooks/usePurchaseLogic'
import { GlitchButton } from '../GlitchButton'

export const ShopItem = ({ item, isOwned, isDisabled, onBuy }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const primaryEffect = getPrimaryEffect(item)
  const isConsumable = primaryEffect?.type === 'inventory_add'
  const isPurchased = isOwned && !isConsumable

  const handlePurchase = async () => {
    if (isDisabled || isPurchased) return
    setIsProcessing(true)
    // Artificial delay for UX
    await new Promise(resolve => setTimeout(resolve, 500))
    onBuy(item)
    setIsProcessing(false)
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
          {item.cost} {item.currency === 'fame' ? '★' : '€'}
        </span>
        <GlitchButton
          onClick={handlePurchase}
          disabled={isDisabled || isPurchased}
          variant={isPurchased ? 'owned' : 'primary'}
          isLoading={isProcessing}
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
  onBuy: PropTypes.func.isRequired
}
