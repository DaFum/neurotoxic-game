import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import {
  GAME_PHASES,
  CLINIC_CONFIG,
  calculateClinicCost
} from '../context/gameConstants'
import {
  validateHealMember,
  validateEnhanceMember,
  calculateHealAmounts
} from '../utils/clinicLogicUtils'

export const useClinicLogic = () => {
  const { t } = useTranslation(['ui'])
  const { player, band, changeScene, addToast, clinicHeal, clinicEnhance } =
    useGameState()

  const currentVisits = player?.clinicVisits || 0

  const membersMap = useMemo(() => {
    const map = new Map()
    const members = band?.members
    if (members) {
      for (let i = 0; i < members.length; i++) {
        const m = members[i]
        map.set(m.id, m)
      }
    }
    return map
  }, [band?.members])

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
      const member = membersMap.get(memberId)

      const validation = validateHealMember(member, player.money, healCostMoney)

      if (!validation.isValid) {
        if (!validation.silent) {
          addToast(
            t(validation.errorKey, {
              defaultValue: validation.defaultMessage
            }),
            'error'
          )
        }
        return
      }

      const { healAmountApplied, moodAmountApplied } = calculateHealAmounts(
        member,
        CLINIC_CONFIG.HEAL_STAMINA_GAIN,
        CLINIC_CONFIG.HEAL_MOOD_GAIN
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
    [player.money, healCostMoney, membersMap, clinicHeal, addToast, t]
  )

  const enhanceMember = useCallback(
    (memberId, trait) => {
      const member = membersMap.get(memberId)

      const validation = validateEnhanceMember(
        member,
        trait,
        player.fame,
        enhanceCostFame
      )

      if (!validation.isValid) {
        if (!validation.silent) {
          addToast(
            t(validation.errorKey, {
              defaultValue: validation.defaultMessage
            }),
            'error'
          )
        }
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
    [player.fame, enhanceCostFame, membersMap, clinicEnhance, addToast, t]
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
