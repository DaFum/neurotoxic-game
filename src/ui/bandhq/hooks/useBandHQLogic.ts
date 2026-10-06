import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { VOID_TRADER_COSTS } from '../../../data/contraband'
import { handleError, GameError, StateError } from '../../../utils/errorHandler'
import { isStashEntry } from '../../../utils/gameState'
import { finiteNumberOr } from '../../../utils/finiteNumber'
import { usePurchaseLock } from './usePurchaseLock'
import type {
  BandState,
  PlayerState,
  ToastPayload,
  TradeVoidItemPayload
} from '../../../types'
import type { PurchaseItem, VoidTraderItem } from '../../../types/components'

const DEFAULT_VOID_FAME_COST = 1000

const getVoidFameCost = (item: VoidTraderItem): number =>
  finiteNumberOr(
    item.rarity ? VOID_TRADER_COSTS[item.rarity] : undefined,
    DEFAULT_VOID_FAME_COST
  )

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

/**
 * State and callbacks returned by the Band HQ orchestration hook.
 */
export interface BandHQLogicResult {
  processingItemId: string | null
  handleVoidTrade: (item: VoidTraderItem) => void
  isVoidItemOwned: (item: VoidTraderItem) => boolean
  isVoidItemDisabled: (item: VoidTraderItem) => boolean
  handleBuyWithLock: (item: PurchaseItem) => Promise<void>
}

/**
 * Coordinates Band HQ purchase locks and void-trader item handling.
 * @param params - Player and band state, purchase handler, void-trader action, and toast callback.
 * @returns Processing state plus locked purchase and void-trader helpers.
 */
export const useBandHQLogic = ({
  player,
  band,
  handleBuy,
  tradeVoidItem,
  addToast
}: BandHQLogicParams): BandHQLogicResult => {
  const { t } = useTranslation()
  const { processingItemId, runWithLock } = usePurchaseLock()

  const handleVoidTrade = useCallback(
    (item: VoidTraderItem) => {
      void runWithLock(item.id, () => {
        try {
          const fameCost = getVoidFameCost(item)
          if (player.fame < fameCost) {
            throw new GameError(
              t('ui:error.insufficient_fame', {
                defaultValue: 'Not enough fame. You need {{cost}} fame.',
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
        }
      })
    },
    [player.fame, tradeVoidItem, addToast, t, runWithLock]
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
      const fameCost = getVoidFameCost(item)
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
      if (item.id == null) {
        handleError(new StateError('Invalid purchase item id', { item }), {
          addToast
        })
        return
      }

      await runWithLock(String(item.id), async () => {
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
        }
      })
    },
    [handleBuy, addToast, t, runWithLock]
  )

  return {
    processingItemId,
    handleVoidTrade,
    isVoidItemOwned,
    isVoidItemDisabled,
    handleBuyWithLock
  }
}
