import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import type { CatalogItem } from '../../types/components'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { getPrimaryEffect } from '../../utils/purchaseLogicUtils'
import { GlitchButton } from '../GlitchButton'
import { Tooltip } from '../shared'

export interface ShopItemProps {
  item: CatalogItem
  isOwned: boolean
  isDisabled: boolean
  adjustedCost?: number
  onBuy: (item: CatalogItem) => void
  processingItemId?: string | number
}

// ⚡ Bolt Optimization: Wrapped ShopItem in React.memo
// Prevents re-rendering all shop/upgrade items when parent `BandHQ` state changes
// (e.g. player money updates) if the item's specific props haven't changed.
export const ShopItem = React.memo(
  ({
    item,
    isOwned,
    isDisabled,
    adjustedCost,
    onBuy,
    processingItemId
  }: ShopItemProps) => {
    const { t } = useTranslation(['items', 'ui'])
    const primaryEffect = getPrimaryEffect(item)
    const isConsumable = primaryEffect?.type === 'inventory_add'
    const isPurchased = isOwned && !isConsumable
    const imagePromptKey = String(item.img ?? '')
    const localizedUnknownItem = t('ui:shop.messages.unknownItem', {
      defaultValue: 'Unknown Item'
    })
    const sanitizedPrompt =
      Object.hasOwn(IMG_PROMPTS, imagePromptKey) &&
      typeof IMG_PROMPTS[imagePromptKey as keyof typeof IMG_PROMPTS] ===
        'string'
        ? IMG_PROMPTS[imagePromptKey as keyof typeof IMG_PROMPTS]
        : typeof item.name === 'string'
          ? item.name
          : localizedUnknownItem

    const isProcessingThis =
      processingItemId != null &&
      item.id != null &&
      String(processingItemId) === String(item.id)
    const isAnyProcessing = processingItemId != null

    const handlePurchase = useCallback(() => {
      if (isDisabled || isPurchased || isAnyProcessing) return
      onBuy(item)
    }, [isDisabled, isPurchased, isAnyProcessing, onBuy, item])

    return (
      <div
        className={`p-4 border-2 relative flex flex-col justify-between transition-colors
        ${
          isPurchased
            ? 'border-toxic-green bg-toxic-green/10'
            : 'border-ash-gray bg-void-black/80'
        }`}
      >
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <img
              src={getGenImageUrl(sanitizedPrompt)}
              alt=''
              aria-hidden='true'
              className='w-12 h-12 object-contain bg-void-black border-2 border-ash-gray'
            />
            <h4 className='font-bold text-toxic-green leading-tight font-mono uppercase'>
              {typeof item.name === 'string'
                ? t(item.name)
                : localizedUnknownItem}
            </h4>
          </div>
          <p className='text-xs text-ash-gray mb-2 font-mono'>
            {item.description ? t(item.description) : ''}
          </p>
        </div>
        <div className='flex justify-between items-center mt-2'>
          <span
            className={`font-mono text-sm font-bold ${
              item.currency === 'fame'
                ? 'text-warning-yellow'
                : 'text-star-white'
            }`}
          >
            {adjustedCost !== undefined &&
            item.cost !== undefined &&
            adjustedCost < item.cost ? (
              <>
                <span className='line-through opacity-50 mr-2'>
                  {item.cost}
                </span>
                <span className='text-toxic-green'>{adjustedCost}</span>
              </>
            ) : adjustedCost !== undefined ? (
              adjustedCost
            ) : item.cost !== undefined ? (
              item.cost
            ) : (
              0
            )}{' '}
            {item.currency === 'fame' ? '★' : '€'}
          </span>
          {isPurchased || isDisabled ? (
            <Tooltip
              content={
                isPurchased
                  ? t('ui:shop.messages.alreadyOwned', {
                      itemName:
                        typeof item.name === 'string'
                          ? t(item.name)
                          : t('ui:shop.messages.unknownItem', {
                              defaultValue: 'Unknown Item'
                            }),
                      defaultValue: 'Already owned!'
                    })
                  : t('ui:shop.messages.notEnough', {
                      currency:
                        item.currency === 'fame'
                          ? t('ui:shop.messages.fame', { defaultValue: 'Fame' })
                          : t('ui:shop.messages.money', {
                              defaultValue: 'Money'
                            }),
                      itemName:
                        typeof item.name === 'string'
                          ? t(item.name)
                          : t('ui:shop.messages.unknownItem', {
                              defaultValue: 'Unknown Item'
                            }),
                      defaultValue: 'Not enough currency.'
                    })
              }
            >
              <GlitchButton
                onClick={handlePurchase}
                disabled={
                  isDisabled ||
                  isPurchased ||
                  (isAnyProcessing && !isProcessingThis)
                }
                variant={isPurchased ? 'owned' : 'primary'}
                isLoading={isProcessingThis}
                size='sm'
                className='min-w-[80px]'
              >
                {isPurchased
                  ? t('ui:hq.owned', { defaultValue: 'OWNED' })
                  : t('ui:hq.buy', { defaultValue: 'BUY' })}
              </GlitchButton>
            </Tooltip>
          ) : (
            <GlitchButton
              onClick={handlePurchase}
              disabled={isAnyProcessing && !isProcessingThis}
              variant='primary'
              isLoading={isProcessingThis}
              size='sm'
              className='min-w-[80px]'
            >
              {t('ui:hq.buy', { defaultValue: 'BUY' })}
            </GlitchButton>
          )}
        </div>
      </div>
    )
  }
)

ShopItem.displayName = 'ShopItem'
;(ShopItem as typeof ShopItem & { propTypes: unknown }).propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
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
  processingItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}
