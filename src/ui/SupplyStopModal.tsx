import React from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector, useGameActions } from '../context/GameState'
import { ShopItem } from './bandhq/ShopItem'
import { usePurchaseLogic } from './bandhq/hooks/usePurchaseLogic'
import { toFiniteNumber } from '../utils/numberUtils'
import { calculateFameLevel } from '../utils/gameStateUtils'
import type { CatalogItem, PurchaseItem } from '../types/components'

export interface SupplyStopModalProps {
  inventory: PurchaseItem[]
  onClose: () => void
}

export const SupplyStopModal: React.FC<SupplyStopModalProps> = ({
  inventory,
  onClose
}) => {
  const { t } = useTranslation(['ui', 'items'])
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { updatePlayer, updateBand, addToast } = useGameActions()
  const purchaseLogic = usePurchaseLogic({
    player,
    band,
    social,
    updatePlayer,
    updateBand,
    addToast
  })

  const handlePurchaseWithConsequences = (item: PurchaseItem) => {
    const purchased = purchaseLogic.handleBuy(item)
    if (!purchased) {
      return
    }

    const currentFame = toFiniteNumber(player.fame, 0)
    const nextFame = Math.max(0, currentFame - 5)
    const fameLost = currentFame - nextFame
    updatePlayer({
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame)
    })

    addToast(
      t('ui:shop.black_market_purchase', {
        amount: fameLost,
        defaultValue: 'Purchased from Black Market! Lost {{amount}} Fame.'
      }),
      'warning'
    )
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-void-black/90 backdrop-blur-sm p-4'>
      <div className='relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-void-black border border-toxic-green shadow-[0_0_20px_var(--color-toxic-green-10)] p-6'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-blood-red hover:text-white hover:bg-blood-red px-3 py-1 font-bold tracking-widest border border-blood-red transition-colors'
        >
          {t('ui:action_close', { defaultValue: 'CLOSE' })}
        </button>

        <h2 className='text-2xl font-black tracking-widest text-toxic-green mb-6 uppercase'>
          {t('ui:map.supply_stop_title', {
            defaultValue: 'BLACK MARKET SUPPLY STOP'
          })}
        </h2>

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
            const adjustedCost = purchaseLogic.getAdjustedCost(item)
            const owned = purchaseLogic.isItemOwned(item)
            const disabled = purchaseLogic.isItemDisabled(item)

            return (
              <ShopItem
                key={item.id}
                item={catalogItem}
                isOwned={owned}
                isDisabled={disabled}
                adjustedCost={adjustedCost}
                onBuy={handlePurchaseWithConsequences}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
