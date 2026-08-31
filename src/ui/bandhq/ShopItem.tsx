import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogItem } from '../../types/components'
import { IMG_PROMPTS } from '../../utils/imageGen'
import { LABEL_CONTRACT_ADVANCE } from '../../utils/purchaseLogicUtils'
import type { PurchaseDecision } from '../../types/purchase'
import { formatCurrency } from '../../utils/numberUtils'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { GlitchButton } from '../GlitchButton'
import { GeneratedImagePanel } from '../shared/GeneratedImagePanel'
import { Tooltip } from '../shared'

/**
 * Catalog item data, purchase state, and buy callback for one shop row.
 */
export interface ShopItemProps {
  item: CatalogItem
  decision: PurchaseDecision
  isDisabled: boolean
  onBuy: (item: CatalogItem) => void
  processingItemId?: string | number
}

// ⚡ Bolt Optimization: Wrapped ShopItem in React.memo
// Prevents re-rendering all shop/upgrade items when parent `BandHQ` state changes
// (e.g. player money updates) if the item's specific props haven't changed.
/**
 * Displays one catalog item with price, ownership, disabled, and buy states.
 * @param props - Shop item data, cost/ownership state, disabled state, purchase callback, and processing lock id.
 */
export const ShopItem = React.memo(
  ({ item, decision, isDisabled, onBuy, processingItemId }: ShopItemProps) => {
    const { t, i18n } = useTranslation(['items', 'ui'])
    const formatPrice = (v: number) => {
      const safe = Number.isFinite(v) ? v : 0
      return item.currency === 'fame'
        ? `${safe} ★`
        : formatCurrency(safe, i18n.language)
    }
    // Normalize both costs up front: `??` only rejects null/undefined, so a
    // non-finite cost would otherwise reach the comparison (`-Infinity < cost`
    // is true) and render as 0 through `formatPrice`. NaN fails every
    // comparison, so a corrupt cost simply shows no discount.
    const adjusted = finiteNumberOr(decision?.cost, Number.NaN)
    const baseCost = finiteNumberOr(item.cost, Number.NaN)
    const hasDiscount = adjusted < baseCost
    const priceValue = finiteNumberOr(adjusted, finiteNumberOr(baseCost, 0))
    const isPurchased = decision?.isOwned && !decision?.isConsumable
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

    const displayName =
      typeof item.name === 'string' ? t(item.name) : localizedUnknownItem

    const disabledReason = isPurchased
      ? t('ui:shop.messages.alreadyOwned', {
          itemName: displayName,
          defaultValue: 'Already owned!'
        })
      : isDisabled
        ? t('ui:shop.messages.notEnough', {
            currency:
              item.currency === 'fame'
                ? t('ui:shop.messages.fame', { defaultValue: 'Fame' })
                : t('ui:shop.messages.money', { defaultValue: 'Money' }),
            itemName: displayName,
            defaultValue: 'Not enough currency.'
          })
        : undefined

    const label = isPurchased
      ? t('ui:hq.owned', { defaultValue: 'OWNED' })
      : t('ui:hq.buy', { defaultValue: 'BUY' })

    const button = (
      <GlitchButton
        onClick={handlePurchase}
        disabled={
          isDisabled || isPurchased || (isAnyProcessing && !isProcessingThis)
        }
        variant={isPurchased ? 'owned' : 'primary'}
        isLoading={isProcessingThis}
        size='sm'
        className='min-w-20 min-h-11'
      >
        {label}
      </GlitchButton>
    )

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
            <GeneratedImagePanel
              prompt={sanitizedPrompt}
              alt=''
              aspectRatio='1:1'
              className='w-12 h-12 shrink-0 object-contain bg-void-black border-2! border-ash-gray! shadow-none!'
              variant='inline'
            />
            <h4 className='font-bold text-toxic-green leading-tight font-mono uppercase'>
              {displayName}
            </h4>
          </div>
          <p className='text-xs text-ash-gray mb-2 font-mono'>
            {item.description
              ? t(
                  item.description,
                  item.id === 'hq_room_label'
                    ? {
                        amount: formatCurrency(
                          LABEL_CONTRACT_ADVANCE,
                          i18n.language,
                          'always'
                        )
                      }
                    : undefined
                )
              : ''}
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
            {hasDiscount ? (
              <>
                <span className='line-through opacity-50 mr-2'>
                  {formatPrice(baseCost)}
                </span>
                <span className='text-toxic-green'>
                  {formatPrice(adjusted)}
                </span>
              </>
            ) : (
              formatPrice(priceValue)
            )}
          </span>
          {disabledReason ? (
            <Tooltip content={disabledReason}>{button}</Tooltip>
          ) : (
            button
          )}
        </div>
      </div>
    )
  }
)

ShopItem.displayName = 'ShopItem'
