import { useCallback, useMemo } from 'react'
import type { BandMember } from '../types/game'
import type { TFunction } from 'i18next'
import type { GameStateWithActions } from '../context/GameState'
import { getSafeUUID } from '../utils/crypto'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import {
  GAME_PHASES,
  CLINIC_CONFIG,
  calculateClinicCost
} from '../context/gameConstants'
import {
  validateHealMember,
  validateEnhanceMember
} from '../utils/clinicLogicUtils'

const useClinicHeal = (
  playerMoney: number,
  currentVisits: number,
  membersMap: Map<string, BandMember>,
  clinicHeal: GameStateWithActions['clinicHeal'],
  addToast: (msg: string, type: string) => void,
  t: TFunction
) => {
  const healCostMoney = calculateClinicCost(
    CLINIC_CONFIG.HEAL_BASE_COST_MONEY,
    currentVisits
  )

  const healMember = useCallback(
    (memberId: string) => {
      const member = membersMap.get(memberId)

      const validation = validateHealMember(member, playerMoney, healCostMoney)

      if (!validation.isValid) {
        if (!validation.silent) {
          addToast(
            t(validation.errorKey as string, {
              defaultValue: validation.defaultMessage
            }),
            'error'
          )
        }
        return
      }

      const toastId = getSafeUUID()

      clinicHeal({
        memberId,
        type: 'heal',
        staminaGain: CLINIC_CONFIG.HEAL_STAMINA_GAIN,
        moodGain: CLINIC_CONFIG.HEAL_MOOD_GAIN,
        getSuccessToast: (appliedStamina: number, appliedMood: number) => ({
          id: toastId,
          message: t('ui:clinic.heal_success', {
            defaultValue:
              '+{{stamina}} Stamina, +{{mood}} Mood. The void embraces you.',
            stamina: appliedStamina,
            mood: appliedMood
          }),
          type: 'success'
        })
      })
    },
    [playerMoney, healCostMoney, membersMap, clinicHeal, addToast, t]
  )

  return { healCostMoney, healMember }
}

const useClinicEnhance = (
  playerFame: number,
  currentVisits: number,
  membersMap: Map<string, BandMember>,
  clinicEnhance: GameStateWithActions['clinicEnhance'],
  addToast: (msg: string, type: string) => void,
  t: TFunction
) => {
  const enhanceCostFame = calculateClinicCost(
    CLINIC_CONFIG.ENHANCE_BASE_COST_FAME,
    currentVisits
  )

  const enhanceMember = useCallback(
    (memberId: string, trait: string) => {
      const member = membersMap.get(memberId)

      const validation = validateEnhanceMember(
        member,
        trait,
        playerFame,
        enhanceCostFame
      )

      if (!validation.isValid) {
        if (!validation.silent) {
          addToast(
            t(validation.errorKey as string, {
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
          id: getSafeUUID(),
          message: t('ui:clinic.enhance_success', {
            defaultValue: 'Flesh upgraded.'
          }),
          type: 'success'
        }
      })
    },
    [playerFame, enhanceCostFame, membersMap, clinicEnhance, addToast, t]
  )

  return { enhanceCostFame, enhanceMember }
}

export const useClinicLogic = () => {
  const { t } = useTranslation(['ui'])
  const { player, band, changeScene, addToast, clinicHeal, clinicEnhance } =
    useGameState()

  const currentVisits = player?.clinicVisits || 0

  const membersMap = useMemo(() => {
    const map = new Map<string, BandMember>()
    band?.members?.forEach(m => {
      if (m.id) {
        map.set(m.id, m)
      }
    })
    return map
  }, [band?.members])

  const { healCostMoney, healMember } = useClinicHeal(
    player?.money ?? 0,
    currentVisits,
    membersMap,
    clinicHeal,
    addToast,
    t
  )

  const { enhanceCostFame, enhanceMember } = useClinicEnhance(
    player?.fame ?? 0,
    currentVisits,
    membersMap,
    clinicEnhance,
    addToast,
    t
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
