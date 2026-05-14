import React from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector, useGameActions } from '../context/GameState'
import { ShopItem } from './bandhq/ShopItem'
import {
  isItemOwned,
  getAdjustedCost,
  canAfford,
  processPurchaseEffect
} from '../utils/purchaseLogicUtils'
import { calculateFameLevel } from '../utils/gameStateUtils'
import type { CatalogItem, PurchaseItem } from '../types/components'
import type { PlayerState, BandState } from '../types/game'

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
  const { updatePlayer, updateBand, addToast } = useGameActions()

  const handlePurchaseWithConsequences = (item: PurchaseItem) => {
    const adjustedCost = getAdjustedCost(item, band)
    if (!canAfford(item, player, adjustedCost)) {
      addToast(
        t('ui:shop.insufficient_funds', {
          defaultValue: 'Insufficient funds.'
        }),
        'error'
      )
      return
    }

    const playerPatch: Partial<PlayerState> = {
      money: Math.max(0, (player.money || 0) - adjustedCost)
    }
    let bandPatch: Partial<BandState> = {}

    // Process effects
    const effect = item.effects?.[0] ?? item.effect
    if (effect) {
      const result = processPurchaseEffect(effect, item, {}, player, band)
      if (result && 'playerPatch' in result && result.playerPatch) {
        Object.assign(playerPatch, result.playerPatch)
      }
      if (result && 'bandPatch' in result && result.bandPatch) {
        bandPatch = result.bandPatch
      }
    }

    // Apply reputation consequence (deduct fame)
    const currentFame = playerPatch.fame ?? player.fame ?? 0
    const nextFame = Math.max(0, currentFame - 5)
    playerPatch.fame = nextFame
    playerPatch.fameLevel = calculateFameLevel(nextFame)

    updatePlayer(playerPatch)
    // Avoid Object.keys as per guidelines
    let hasBandPatch = false
    for (const _k in bandPatch) {
      hasBandPatch = true
      break
    }
    if (hasBandPatch) {
      updateBand(bandPatch)
    }

    addToast(
      t('ui:shop.black_market_purchase', {
        defaultValue: 'Purchased from Black Market! Lost 5 Fame.'
      }),
      'warning'
    )
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-void-black/90 backdrop-blur-sm p-4'>
      <div className='relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-void-black border border-toxic-green shadow-[0_0_20px_rgba(0,255,0,0.1)] p-6'>
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
            const adjustedCost = getAdjustedCost(item, band)
            const owned = isItemOwned(item, player, band)
            const disabled = !canAfford(item, player, adjustedCost)

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
