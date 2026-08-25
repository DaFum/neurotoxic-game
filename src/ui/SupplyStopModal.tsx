import React from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector, useGameActions } from '../context/GameState'
import { ShopItem } from './bandhq/ShopItem'
import { Modal } from './shared/Modal'
import { usePurchaseLogic } from './bandhq/hooks/usePurchaseLogic'
import { usePurchaseLock } from './bandhq/hooks/usePurchaseLock'
import { calculateFameLevel, finiteNumberOr } from '../utils/gameState'
import type { CatalogItem, PurchaseItem } from '../types/components'
import type { PlayerPatch } from '../types/purchase'

const BLACK_MARKET_FAME_LOSS = 5

/**
 * Supply-stop inventory and close callback for the black-market purchase modal.
 */
export interface SupplyStopModalProps {
  inventory: PurchaseItem[]
  onClose: () => void
}

/**
 * Displays black-market inventory and applies supply-stop purchase consequences.
 * @param props - Supply inventory and close handler for the supply-stop modal.
 */
export const SupplyStopModal: React.FC<SupplyStopModalProps> = ({
  inventory,
  onClose
}) => {
  const { t } = useTranslation(['ui', 'items'])
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { updatePlayer, updateBand, addToast } = useGameActions()
  const fameLostRef = React.useRef(0)
  const applyBlackMarketFamePenalty = React.useCallback(
    (playerPatch: PlayerPatch): PlayerPatch => {
      // The shared purchase hook builds the normal cost/effect patch first.
      // Supply Stops then apply their bounded reputation penalty to that final
      // fame value so purchase effects and black-market risk stay atomic.
      const currentFame = finiteNumberOr(playerPatch.fame ?? player.fame, 0)
      const nextFame = Math.max(0, currentFame - BLACK_MARKET_FAME_LOSS)
      fameLostRef.current = currentFame - nextFame

      return {
        ...playerPatch,
        fame: nextFame,
        fameLevel: calculateFameLevel(nextFame)
      }
    },
    [player.fame]
  )
  const purchaseLogic = usePurchaseLogic({
    player,
    band,
    social,
    updatePlayer,
    updateBand,
    addToast,
    transformPlayerPatch: applyBlackMarketFamePenalty
  })

  const { processingItemId, runWithLock } = usePurchaseLock()

  const handlePurchaseWithConsequences = (item: PurchaseItem) => {
    if (item.id == null) return
    // Reuse the shared purchase lock so a rapid double-click applies the
    // black-market fame penalty (and its toast) only once per purchase.
    void runWithLock(String(item.id), () => {
      const purchased = purchaseLogic.handleBuy(item)
      if (!purchased) {
        return
      }

      addToast(
        t('ui:shop.black_market_purchase', {
          amount: fameLostRef.current,
          defaultValue: 'Purchased from Black Market! Lost {{amount}} Fame.'
        }),
        'warning'
      )
    })
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('ui:map.supply_stop_title', {
        defaultValue: 'BLACK MARKET SUPPLY STOP'
      })}
      className='max-w-4xl'
    >
      <div className='overflow-y-auto overflow-x-hidden'>
        <p className='text-ash-gray font-mono mb-8 text-sm'>
          {t('ui:map.supply_stop_warning', {
            defaultValue:
              "Warning: Purchasing goods here will negatively impact your band's reputation."
          })}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {inventory.map(item => {
            if (item.id == null) return null
            const catalogItem: CatalogItem = {
              ...item,
              id: item.id,
              cost: item.cost ?? 0
            }
            const disabled = purchaseLogic.isItemDisabled(item)
            const decision = purchaseLogic.getPurchaseDecision(item)

            return (
              <ShopItem
                key={item.id}
                item={catalogItem}
                decision={decision}
                isDisabled={disabled}
                onBuy={handlePurchaseWithConsequences}
                processingItemId={processingItemId ?? undefined}
              />
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
