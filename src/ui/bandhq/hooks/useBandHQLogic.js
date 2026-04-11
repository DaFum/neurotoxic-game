import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { VOID_TRADER_COSTS } from '../../../data/contraband.js'
import { handleError, GameError, StateError } from '../../../utils/errorHandler.js'

export const useBandHQLogic = ({
  player,
  band,
  handleBuy,
  tradeVoidItem,
  addToast
}) => {
  const { t } = useTranslation()
  const [processingItemId, setProcessingItemId] = useState(null)

  const handleVoidTrade = useCallback(
    async item => {
      if (processingItemId) return
      setProcessingItemId(item.id)
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        const fameCost = VOID_TRADER_COSTS[item.rarity] ?? 1000
        if (player.fame < fameCost) {
          throw new GameError(
            t('ui:error.insufficient_fame', {
              defaultValue: `Not enough fame. You need ${fameCost} fame.`,
              cost: fameCost
            }),
            { context: { cost: fameCost } }
          )
        }
        const successToast = {
          message: `ui:toast.void_trade_success|${JSON.stringify({
            itemName: `items:contraband.${item.id}.name`
          })}`,
          type: 'success'
        }
        tradeVoidItem({ contrabandId: item.id, fameCost, successToast })
      } catch (err) {
        handleError(err, { addToast })
      } finally {
        setProcessingItemId(null)
      }
    },
    [player.fame, processingItemId, tradeVoidItem, addToast, t]
  )

  const isVoidItemOwned = useCallback(
    item => {
      return !!(band.stash && band.stash[item.id])
    },
    [band.stash]
  )

  const isVoidItemDisabled = useCallback(
    item => {
      const fameCost = VOID_TRADER_COSTS[item.rarity] ?? 1000
      const currentQuantity = band.stash?.[item.id]?.quantity || 0
      const isMaxStacks =
        item.stackable && item.maxStacks && currentQuantity >= item.maxStacks

      return (
        player.fame < fameCost ||
        (!!(band.stash && band.stash[item.id]) && !item.stackable) ||
        isMaxStacks
      )
    },
    [player.fame, band.stash]
  )

  const handleBuyWithLock = useCallback(
    async item => {
      if (processingItemId) return
      setProcessingItemId(item.id)
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        await handleBuy(item)
      } catch (err) {
        if (err instanceof GameError || err instanceof StateError) {
          handleError(err, { addToast })
        } else {
          handleError(
            new GameError(t('ui:hq.purchaseFailed', { defaultValue: 'Purchase failed' }), {
              context: {
                originalError: err?.message,
                stack: err?.stack
              }
            }),
            { addToast }
          )
        }
      } finally {
        setProcessingItemId(null)
      }
    },
    [processingItemId, handleBuy, addToast, t]
  )

  return {
    processingItemId,
    handleVoidTrade,
    isVoidItemOwned,
    isVoidItemDisabled,
    handleBuyWithLock
  }
}
