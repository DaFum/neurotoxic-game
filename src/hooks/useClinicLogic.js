import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import {
  GAME_PHASES,
  CLINIC_CONFIG,
  calculateClinicCost
} from '../context/gameConstants'

export const useClinicLogic = () => {
  const { t } = useTranslation(['ui'])
  const { player, band, changeScene, addToast, clinicHeal, clinicEnhance } =
    useGameState()

  const currentVisits = player?.clinicVisits || 0

  const healCostMoney = calculateClinicCost(
    CLINIC_CONFIG.HEAL_BASE_COST_MONEY,
    currentVisits
  )
  const enhanceCostFame = calculateClinicCost(
    CLINIC_CONFIG.ENHANCE_BASE_COST_FAME,
    currentVisits
  )

  const healMember = useCallback(
    memberId => {
      const member = band?.members?.find(m => m.id === memberId)
      if (!member) return

      if (player.money < healCostMoney) {
        addToast(
          t('ui:clinic.not_enough_money', {
            defaultValue: 'Not enough money.'
          }),
          'error'
        )
        return
      }

      const currentStamina = member.stamina || 0
      const healAmountApplied = Math.min(
        CLINIC_CONFIG.HEAL_STAMINA_GAIN,
        100 - currentStamina
      )
      const currentMood = member.mood || 0
      const moodAmountApplied = Math.min(
        CLINIC_CONFIG.HEAL_MOOD_GAIN,
        100 - currentMood
      )

      clinicHeal({
        memberId,
        type: 'heal',
        staminaGain: CLINIC_CONFIG.HEAL_STAMINA_GAIN,
        moodGain: CLINIC_CONFIG.HEAL_MOOD_GAIN,
        successToast: {
          id: crypto.randomUUID(),
          message: t('ui:clinic.heal_success', {
            defaultValue:
              '+{{stamina}} Stamina, +{{mood}} Mood. The void embraces you.',
            stamina: healAmountApplied,
            mood: moodAmountApplied
          }),
          type: 'success'
        }
      })
    },
    [player.money, healCostMoney, band, clinicHeal, addToast, t]
  )

  const enhanceMember = useCallback(
    (memberId, trait) => {
      const member = band?.members?.find(m => m.id === memberId)
      if (!member) return

      if (member.traits && member.traits.some(tr => tr.id === trait)) return

      if (player.fame < enhanceCostFame) {
        addToast(
          t('ui:clinic.not_enough_fame', {
            defaultValue: 'Not enough fame. The void demands sacrifice.'
          }),
          'error'
        )
        return
      }

      clinicEnhance({
        memberId,
        type: 'enhance',
        trait,
        successToast: {
          id: crypto.randomUUID(),
          message: t('ui:clinic.enhance_success', {
            defaultValue: 'Flesh upgraded.'
          }),
          type: 'success'
        }
      })
    },
    [player.fame, enhanceCostFame, band, clinicEnhance, addToast, t]
  )

  const leaveClinic = useCallback(() => {
    changeScene(GAME_PHASES.OVERWORLD)
  }, [changeScene])

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
