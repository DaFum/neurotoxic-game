import { useCallback, useRef } from 'react'
import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import {
  clampPlayerMoney,
  clampMemberStamina,
  clampMemberMood,
  finiteNumberOr
} from '../../utils/gameState'
import {
  calculateRefuelCost,
  calculateRepairCost,
  EXPENSE_CONSTANTS
} from '../../utils/economyEngine'
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
  band,
  updatePlayer,
  updateBand,
  advanceDay,
  dailyObligations,
  addToast
}: VanMaintenanceParams) => {
  const pendingRestRef = useRef(false)
  const pendingRestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const handleRefuel = useCallback(() => {
    if (isTravelingRef.current) return

    const currentFuel = finiteNumberOr(player.van?.fuel, 0)
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

    if (finiteNumberOr(player.money, 0) < cost) {
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
      money: clampPlayerMoney(finiteNumberOr(player.money, 0) - cost),
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

    const currentCondition = finiteNumberOr(player.van?.condition, 100)
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

    if (finiteNumberOr(player.money, 0) < cost) {
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
      money: clampPlayerMoney(finiteNumberOr(player.money, 0) - cost),
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

  const handleRestInVan = useCallback(() => {
    if (isTravelingRef.current) return

    if (!pendingRestRef.current) {
      pendingRestRef.current = true
      addToast(
        i18n.t('ui:travel.rest.confirm', {
          defaultValue:
            'Resting will skip a day and incur daily costs of {{cost}}. Click again to confirm.',
          cost: formatCurrency(
            finiteNumberOr(dailyObligations, 0),
            i18n.language
          )
        }),
        'warning'
      )
      pendingRestTimeoutRef.current = setTimeout(() => {
        pendingRestRef.current = false
      }, 5000)
      return
    }

    if (pendingRestTimeoutRef.current)
      clearTimeout(pendingRestTimeoutRef.current)
    pendingRestRef.current = false

    const newMembers = (band?.members || []).map(m => {
      const currentStamina = finiteNumberOr(m?.stamina, 0)
      const currentMood = finiteNumberOr(m?.mood, 0)
      const maxStamina = finiteNumberOr(m?.staminaMax, 100)

      return {
        ...m,
        stamina: clampMemberStamina(currentStamina + 50, maxStamina),
        mood: clampMemberMood(currentMood - 10)
      }
    })

    updateBand({ members: newMembers })
    advanceDay()

    addToast(
      i18n.t('ui:travel.rest.rested', {
        defaultValue: 'Rest in van: +50 Stamina, -10 Mood. Passed 1 day.'
      }),
      'success'
    )
  }, [band, updateBand, advanceDay, dailyObligations, addToast, isTravelingRef])

  return { handleRefuel, handleRepair, handleRestInVan }
}
