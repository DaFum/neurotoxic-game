import { useCallback } from 'react'
import type { BandMember } from '../types'
import { useGameActions, useGameSelector } from '../context/GameState'
import { getSafeUUID } from '../utils/crypto'
import { useTranslation } from 'react-i18next'
import type { PlayerState, BandState } from '../types'
import type { ValidationResult } from '../types/validation'
import {
  GAME_PHASES,
  CLINIC_CONFIG,
  calculateClinicCost
} from '../context/gameConstants'
import {
  validateHealMember,
  validateEnhanceMember
} from '../utils/clinicLogicUtils'

/**
 * Provides clinic screen state and actions for healing or enhancing band members.
 * @returns Clinic resources, calculated costs, and handlers for clinic actions.
 */
export const useClinicLogic = (): {
  player: PlayerState | undefined | null
  band: BandState | undefined | null
  healCostMoney: number
  enhanceCostFame: number
  healMember: (memberId: string) => void
  graftNeuroOverclock: (memberId: string) => void
  enhanceMember: (memberId: string, traitId: string) => void
  leaveClinic: () => void
} => {
  const { t } = useTranslation(['ui'])
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const {
    changeScene,
    addToast,
    clinicHeal,
    clinicEnhance,
    graftNeuroOverclock
  } = useGameActions()

  const currentVisits = player?.clinicVisits ?? 0
  const members = band?.members
  const healCostMoney = calculateClinicCost(
    CLINIC_CONFIG.HEAL_BASE_COST_MONEY,
    currentVisits
  )
  const enhanceCostFame = calculateClinicCost(
    CLINIC_CONFIG.ENHANCE_BASE_COST_FAME,
    currentVisits
  )

  const findMember = useCallback(
    (memberId: string): BandMember | undefined =>
      members?.find((m: BandMember) => m?.id === memberId),
    [members]
  )

  /** Reports a failed validation as a toast and returns false, unless it is silent. */
  const reportRejection = useCallback(
    (validation: ValidationResult): boolean => {
      if (validation.isValid) return true
      if (!validation.silent) {
        addToast(
          t(validation.errorKey as string, {
            defaultValue: validation.defaultMessage
          }),
          'error'
        )
      }
      return false
    },
    [addToast, t]
  )

  const healMember = useCallback(
    (memberId: string) => {
      const member = findMember(memberId)
      const validation = validateHealMember(
        member,
        player?.money ?? 0,
        healCostMoney
      )
      if (!reportRejection(validation)) return

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
    [player?.money, healCostMoney, findMember, reportRejection, clinicHeal, t]
  )

  const enhanceMember = useCallback(
    (memberId: string, trait: string) => {
      const member = findMember(memberId)
      const validation = validateEnhanceMember(
        member,
        trait,
        player?.fame ?? 0,
        enhanceCostFame
      )
      if (!reportRejection(validation)) return

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
    [
      player?.fame,
      enhanceCostFame,
      findMember,
      reportRejection,
      clinicEnhance,
      t
    ]
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
    graftNeuroOverclock,
    leaveClinic
  }
}
