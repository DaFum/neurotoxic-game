/**
 * (#1) Actual Updates: Extracted void trade, purchase lock, and void item ownership/disabled logic from BandHQ.tsx into a reusable hook. Added synchronous ref-based lock alongside processingItemId state to prevent rapid re-entry race conditions.
 * (#2) Next Steps: Consider adding unit tests for handleVoidTrade and handleBuyWithLock edge cases.
 * (#3) Found Errors + Solutions: Fixed stash quantity property name from `.quantity` to `.stacks` to match bandReducer data model.
 */
import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { VOID_TRADER_COSTS } from '../../../data/contraband'
import { handleError, GameError, StateError } from '../../../utils/errorHandler'
import type {
  BandState,
  PlayerState,
  ToastPayload,
  TradeVoidItemPayload
} from '../../../types/game'
import type { PurchaseItem, VoidTraderItem } from '../../../types/components'

type StashEntry = {
  stacks?: number
}

const isStashEntry = (entry: unknown): entry is StashEntry => {
  return (
    entry !== null &&
    typeof entry === 'object' &&
    Object.hasOwn(entry, 'stacks') &&
    typeof (entry as Record<string, unknown>).stacks === 'number'
  )
}

type BandHQLogicParams = {
  player: PlayerState
  band: BandState
  handleBuy: (item: PurchaseItem) => Promise<void> | void
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
      return !!(band.stash && band.stash[item.id])
    },
    [band.stash]
  )

  const isVoidItemDisabled = useCallback(
    (item: VoidTraderItem) => {
      const fameCost =
        (item.rarity ? VOID_TRADER_COSTS[item.rarity] : undefined) ?? 1000
      const stashEntry = band.stash?.[item.id]
      const currentQuantity = isStashEntry(stashEntry)
        ? (stashEntry.stacks ?? 0)
        : 0
      const isMaxStacks =
        item.stackable === true &&
        typeof item.maxStacks === 'number' &&
        currentQuantity >= item.maxStacks

      return (
        player.fame < fameCost ||
        (!!(band.stash && band.stash[item.id]) && !item.stackable) ||
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
