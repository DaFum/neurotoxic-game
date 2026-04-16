// @ts-nocheck
/**
 * (#1) Actual Updates: Extracted void trade, purchase lock, and void item ownership/disabled logic from BandHQ.tsx into a reusable hook. Added synchronous ref-based lock alongside processingItemId state to prevent rapid re-entry race conditions.
 * (#2) Next Steps: Consider adding unit tests for handleVoidTrade and handleBuyWithLock edge cases.
 * (#3) Found Errors + Solutions: Fixed stash quantity property name from `.quantity` to `.stacks` to match bandReducer data model.
 */
import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { VOID_TRADER_COSTS } from '../../../data/contraband'
import {
  handleError,
  GameError,
  StateError
} from '../../../utils/errorHandler'

export const useBandHQLogic = ({
  player,
  band,
  handleBuy,
  tradeVoidItem,
  addToast
}) => {
  const { t } = useTranslation()
  const [processingItemId, setProcessingItemId] = useState(null)
  const processingItemIdRef = useRef(null)

  const handleVoidTrade = useCallback(
    item => {
      if (processingItemIdRef.current !== null) return
      processingItemIdRef.current = item.id
      setProcessingItemId(item.id)
      try {
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
          messageKey: 'ui:toast.void_trade_success',
          options: { itemName: `items:contraband.${item.id}.name` },
          type: 'success'
        }
        tradeVoidItem({ contrabandId: item.id, fameCost, successToast })
      } catch (err) {
        handleError(err, { addToast })
      } finally {
        processingItemIdRef.current = null
        setProcessingItemId(null)
      }
    },
    [player.fame, tradeVoidItem, addToast, t]
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
      const currentQuantity = band.stash?.[item.id]?.stacks || 0
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
      if (processingItemIdRef.current !== null) return
      processingItemIdRef.current = item.id
      setProcessingItemId(item.id)
      try {
        await handleBuy(item)
      } catch (err) {
        if (err instanceof GameError || err instanceof StateError) {
          handleError(err, { addToast })
        } else {
          handleError(
            new GameError(
              t('ui:hq.purchaseFailed', { defaultValue: 'Purchase failed' }),
              {
                context: {
                  originalError: err?.message,
                  stack: err?.stack
                }
              }
            ),
            { addToast }
          )
        }
      } finally {
        processingItemIdRef.current = null
        setProcessingItemId(null)
      }
    },
    [handleBuy, addToast, t]
  )

  return {
    processingItemId,
    handleVoidTrade,
    isVoidItemOwned,
    isVoidItemDisabled,
    handleBuyWithLock
  }
}
