import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { VOID_TRADER_COSTS } from '../../../data/contraband'
import { handleError, GameError, StateError } from '../../../utils/errorHandler'
import { isStashEntry } from '../../../utils/gameStateUtils'
import type {
  BandState,
  PlayerState,
  ToastPayload,
  TradeVoidItemPayload
} from '../../../types'
import type { PurchaseItem, VoidTraderItem } from '../../../types/components'

type BandHQLogicParams = {
  player: PlayerState
  band: BandState
  // Returns false when validation blocks a purchase; successful callers ignore the value.
  handleBuy: (item: PurchaseItem) => Promise<void | boolean> | void | boolean
  tradeVoidItem: (payload: TradeVoidItemPayload) => void
  addToast: (
    message: string,
    type?: 'error' | 'warning' | 'success' | 'info'
  ) => void
}

export interface BandHQLogicResult {
  processingItemId: string | null
  handleVoidTrade: (item: VoidTraderItem) => void
  isVoidItemOwned: (item: VoidTraderItem) => boolean
  isVoidItemDisabled: (item: VoidTraderItem) => boolean
  handleBuyWithLock: (item: PurchaseItem) => Promise<void>
}

export const useBandHQLogic = ({
  player,
  band,
  handleBuy,
  tradeVoidItem,
  addToast
}: BandHQLogicParams): BandHQLogicResult => {
  const { t } = useTranslation()
  const [processingItemId, setProcessingItemId] = useState<string | null>(null)
  const processingItemIdRef = useRef<string | null>(null)

  const handleVoidTrade = useCallback(
    (item: VoidTraderItem) => {
      if (processingItemIdRef.current !== null) return
      processingItemIdRef.current = item.id
      setProcessingItemId(item.id)
      try {
        const fameCost =
          (item.rarity ? VOID_TRADER_COSTS[item.rarity] : undefined) ?? 1000
        if (player.fame < fameCost) {
          throw new GameError(
            t('ui:error.insufficient_fame', {
              defaultValue: `Not enough fame. You need ${fameCost} fame.`,
              cost: fameCost
            }),
            { context: { cost: fameCost } }
          )
        }
        const successToast: Omit<ToastPayload, 'id'> = {
          messageKey: 'ui:toast.void_trade_success',
          options: { itemName: t(`items:contraband.${item.id}.name`) },
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
    (item: VoidTraderItem) => {
      if (item.stackable) return false
      return !!(band.stash && Object.hasOwn(band.stash, item.id))
    },
    [band.stash]
  )

  const isVoidItemDisabled = useCallback(
    (item: VoidTraderItem) => {
      const fameCost =
        (item.rarity ? VOID_TRADER_COSTS[item.rarity] : undefined) ?? 1000
      const hasStashOwn = !!(band.stash && Object.hasOwn(band.stash, item.id))
      const stashEntry = hasStashOwn ? band.stash[item.id] : undefined
      const currentQuantity = isStashEntry(stashEntry)
        ? (stashEntry.stacks ?? 0)
        : 0
      const isMaxStacks =
        item.stackable === true &&
        typeof item.maxStacks === 'number' &&
        currentQuantity >= item.maxStacks

      return (
        player.fame < fameCost ||
        (hasStashOwn && !item.stackable) ||
        isMaxStacks
      )
    },
    [player.fame, band.stash]
  )

  const handleBuyWithLock = useCallback(
    async (item: PurchaseItem) => {
      if (processingItemIdRef.current !== null) return
      if (item.id == null) {
        handleError(new StateError('Invalid purchase item id', { item }), {
          addToast
        })
        return
      }

      const itemId = String(item.id)
      processingItemIdRef.current = itemId
      setProcessingItemId(itemId)
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
                  originalError:
                    err instanceof Error ? err.message : String(err),
                  stack: err instanceof Error ? err.stack : undefined
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
