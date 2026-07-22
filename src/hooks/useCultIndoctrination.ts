import type { CultIndoctrinationConfig } from '../types'
import { useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import {
  checkHasIndoctrinatedToday,
  validateCultIndoctrination
} from '../utils/cultIndoctrinationUtils'
import { useDailySocialAction } from './useDailySocialAction'

/** Tuning values for the cult indoctrination social action. */
export const CULT_INDOCTRINATION_CONFIG = {
  COST: 1000,
  FAME_GAIN: 500,
  ZEALOTRY_GAIN: 40,
  CONTROVERSY_GAIN: 50,
  HARMONY_COST: 30,
  REQUIRED_ZEALOTRY: 50
} as const satisfies CultIndoctrinationConfig

/**
 * Coordinates cult indoctrination modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and indoctrination tuning constants.
 */
export const useCultIndoctrination = () => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { cultIndoctrination } = useGameActions()

  const hasRunToday = useCallback(
    () => checkHasIndoctrinatedToday(social, player.day),
    [social, player.day]
  )
  const validate = useCallback(
    () =>
      validateCultIndoctrination(
        social,
        player,
        band,
        CULT_INDOCTRINATION_CONFIG
      ),
    [social, player, band]
  )
  const buildPayload = useCallback(
    (successMessageKey: string) => ({
      cost: CULT_INDOCTRINATION_CONFIG.COST,
      fameGain: CULT_INDOCTRINATION_CONFIG.FAME_GAIN,
      zealotryGain: CULT_INDOCTRINATION_CONFIG.ZEALOTRY_GAIN,
      controversyGain: CULT_INDOCTRINATION_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: CULT_INDOCTRINATION_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: successMessageKey,
        type: 'success' as const
      }
    }),
    []
  )

  const action = useDailySocialAction({
    config: CULT_INDOCTRINATION_CONFIG,
    loggerScope: 'CultIndoctrination',
    validationFailureMessage:
      'validateCultIndoctrination failed while deriving canIndoctrinate',
    successMessageKey: 'ui:cult_indoctrination.success',
    validate,
    hasRunToday,
    dispatchAction: cultIndoctrination,
    buildPayload
  })

  return {
    showCultIndoctrination: action.showModal,
    hasIndoctrinatedToday: action.hasRunToday,
    openCultIndoctrination: action.openModal,
    closeCultIndoctrination: action.closeModal,
    triggerIndoctrination: action.trigger,
    canIndoctrinate: action.canRun,
    CULT_INDOCTRINATION_CONFIG: action.config
  }
}
