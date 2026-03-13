import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import {
  createClinicHealAction,
  createClinicEnhanceAction,
  createChangeSceneAction,
  createAddToastAction
} from '../context/actionCreators'
import { GAME_PHASES } from '../context/gameConstants'

export const useClinicLogic = () => {
  const { t } = useTranslation(['ui'])
  const { player, band, dispatch } = useGameState()

  // Base costs that scale with visits
  const visitMultiplier = 1.2
  const currentVisits = player?.clinicVisits || 0

  const calculateCost = useCallback(
    baseCost => Math.floor(baseCost * Math.pow(visitMultiplier, currentVisits)),
    [currentVisits]
  )

  const healCostMoney = calculateCost(150)
  const enhanceCostFame = calculateCost(500)

  const healMember = useCallback(
    memberId => {
      const member = band?.members?.find(m => m.id === memberId)
      if (!member) return

      if (player.money < healCostMoney) {
        dispatch(
          createAddToastAction({
            message: t('ui:clinic.not_enough_money', {
              defaultValue: 'Not enough money.'
            }),
            type: 'error'
          })
        )
        return
      }

      dispatch(
        createClinicHealAction({
          memberId,
          cost: healCostMoney,
          fameCost: 0,
          staminaGain: 30, // Heals 30 stamina
          moodGain: 10 // Bonus 10 mood
        })
      )
      dispatch(
        createAddToastAction({
          message: t('ui:clinic.heal_success', {
            defaultValue: 'Stamina restored. The void embraces you.'
          }),
          type: 'success'
        })
      )
    },
    [player.money, healCostMoney, band, dispatch, t]
  )

  const enhanceMember = useCallback(
    (memberId, trait) => {
      const member = band?.members?.find(m => m.id === memberId)
      if (!member) return

      if (player.fame < enhanceCostFame) {
        dispatch(
          createAddToastAction({
            message: t('ui:clinic.not_enough_fame', {
              defaultValue: 'Not enough fame. The void demands sacrifice.'
            }),
            type: 'error'
          })
        )
        return
      }

      dispatch(
        createClinicEnhanceAction({
          memberId,
          cost: 0,
          fameCost: enhanceCostFame,
          trait
        })
      )
      dispatch(
        createAddToastAction({
          message: t('ui:clinic.enhance_success', {
            defaultValue: 'Flesh upgraded.'
          }),
          type: 'success'
        })
      )
    },
    [player.fame, enhanceCostFame, band, dispatch, t]
  )

  const leaveClinic = useCallback(() => {
    dispatch(createChangeSceneAction(GAME_PHASES.OVERWORLD))
  }, [dispatch])

  return {
    player,
    band,
    healCostMoney,
    enhanceCostFame,
    healMember,
    enhanceMember,
    leaveClinic
  }
}
