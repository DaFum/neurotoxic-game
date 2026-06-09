import { useCallback } from 'react'
import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import { clampPlayerMoney } from '../../utils/gameState'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import {
  calculateRefuelCost,
  calculateRepairCost,
  EXPENSE_CONSTANTS
} from '../../utils/economyEngine'
import { calcBaseBreakdownChance } from '../../utils/upgradeUtils'
import { audioService } from '../../utils/audio/audioEngine'
import type { VanMaintenanceParams } from './types'

export const useVanMaintenance = ({
  isTravelingRef,
  player,
  assetsRef,
  updatePlayer,
  addToast
}: VanMaintenanceParams) => {
  const handleRefuel = useCallback(() => {
    if (isTravelingRef.current) return

    const currentFuel = player.van?.fuel ?? 0
    const assetModifiers = getActiveAssetModifiers(assetsRef.current)
    const cost = calculateRefuelCost(currentFuel, assetModifiers)

    if (cost <= 0) {
      addToast(
        i18n.t('ui:travel.refuel.tankAlreadyFull', {
          defaultValue: 'Tank is already full!'
        }),
        'info'
      )
      return
    }

    if ((player.money ?? 0) < cost) {
      addToast(
        i18n.t('ui:travel.refuel.notEnoughMoney', {
          defaultValue: 'Not enough money! Need {{cost}} to fill up.',
          cost: formatCurrency(cost, i18n.language)
        }),
        'error'
      )
      return
    }

    updatePlayer({
      money: clampPlayerMoney((player.money ?? 0) - cost),
      van: { ...player.van, fuel: EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL }
    })
    addToast(
      i18n.t('ui:travel.refuel.refueled', {
        defaultValue: 'Refueled: -{{cost}}',
        cost: formatCurrency(cost, i18n.language)
      }),
      'success'
    )

    try {
      audioService.playSFX('cash')
    } catch (_e) {
      // Ignore audio errors
    }
  }, [player, updatePlayer, addToast, isTravelingRef, assetsRef])

  const handleRepair = useCallback(() => {
    if (isTravelingRef.current) return

    const currentCondition = player.van?.condition ?? 100
    const cost = calculateRepairCost(currentCondition)

    if (cost <= 0) {
      addToast(
        i18n.t('ui:travel.repair.vanAlreadyPerfect', {
          defaultValue: 'Van is already in perfect condition!'
        }),
        'info'
      )
      return
    }

    if ((player.money ?? 0) < cost) {
      addToast(
        i18n.t('ui:travel.repair.notEnoughMoney', {
          defaultValue: 'Not enough money! Need {{cost}} to repair.',
          cost: formatCurrency(cost, i18n.language)
        }),
        'error'
      )
      return
    }

    const repairedBreakdown = calcBaseBreakdownChance(
      player.van?.upgrades ?? []
    )

    updatePlayer({
      money: clampPlayerMoney((player.money ?? 0) - cost),
      van: {
        ...player.van,
        condition: 100,
        breakdownChance: Math.round(repairedBreakdown * 100) / 100
      }
    })

    addToast(
      i18n.t('ui:travel.repair.repaired', {
        defaultValue: 'Repaired: -{{cost}}',
        cost: formatCurrency(cost, i18n.language)
      }),
      'success'
    )

    try {
      audioService.playSFX('cash')
    } catch (_e) {
      // Ignore audio errors
    }
  }, [player, updatePlayer, addToast, isTravelingRef])

  return { handleRefuel, handleRepair }
}
