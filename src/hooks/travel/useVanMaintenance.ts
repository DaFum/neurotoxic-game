import { useCallback } from 'react'
import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import { clampPlayerMoney } from '../../utils/gameState'
import {
  calculateRefuelCost,
  calculateRepairCost,
  EXPENSE_CONSTANTS
} from '../../utils/economy'
import { calcBaseBreakdownChance } from '../../utils/upgradeUtils'
import { audioService } from '../../utils/audio/audioEngine'
import type { VanMaintenanceParams } from './types'

/**
 * Provides the van refuel and repair handlers.
 *
 * @remarks
 * `handleRefuel` fills the tank to `MAX_FUEL`; `handleRepair` restores condition
 * to 100 and recomputes breakdown chance from installed upgrades. Both compute
 * cost from the current value,
 * no-op with an info toast when nothing is needed, reject with an error toast
 * when the player can't afford it, clamp the resulting money with
 * `clampPlayerMoney`, and play the `cash` SFX on success. Both are gated by
 * `isTravelingRef` and do nothing while a trip is in progress.
 *
 * @returns An object containing the `handleRefuel` and `handleRepair` functions.
 */
export const useVanMaintenance = ({
  isTravelingRef,
  player,
  updatePlayer,
  addToast
}: VanMaintenanceParams) => {
  const handleRefuel = useCallback(() => {
    if (isTravelingRef.current) return

    const currentFuel = player.van?.fuel ?? 0
    const cost = calculateRefuelCost(currentFuel)

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
  }, [player, updatePlayer, addToast, isTravelingRef])

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
