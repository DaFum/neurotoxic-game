import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import {
  createClinicHealAction,
  createClinicEnhanceAction,
  createChangeSceneAction,
  createAddToastAction
} from '../context/actionCreators'
import { GAME_PHASES, CLINIC_CONFIG } from '../context/gameConstants'

export const useClinicLogic = () => {
  const { t } = useTranslation(['ui'])
  const { player, band, dispatch } = useGameState()

  const currentVisits = player?.clinicVisits || 0

  const calculateCost = useCallback(
    baseCost => Math.floor(baseCost * Math.pow(CLINIC_CONFIG.VISIT_MULTIPLIER, currentVisits)),
    [currentVisits]
  )

  const healCostMoney = calculateCost(CLINIC_CONFIG.HEAL_BASE_COST_MONEY)
  const enhanceCostFame = calculateCost(CLINIC_CONFIG.ENHANCE_BASE_COST_FAME)

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

      const currentStamina = member.stamina || 0
      const healAmountApplied = Math.min(CLINIC_CONFIG.HEAL_STAMINA_GAIN, 100 - currentStamina)

      dispatch(
        createClinicHealAction({
          memberId,
          cost: healCostMoney,
          fameCost: 0,
          staminaGain: CLINIC_CONFIG.HEAL_STAMINA_GAIN,
          moodGain: CLINIC_CONFIG.HEAL_MOOD_GAIN
        })
      )
      dispatch(
        createAddToastAction({
          message: t('ui:clinic.heal_success', {
            defaultValue: `Stamina restored by ${healAmountApplied}. The void embraces you.`,
            healAmountApplied
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
