import type { DarkWebLeakConfig } from '../types'
import { useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import {
  checkHasLeakedToday,
  validateDarkWebLeak
} from '../utils/darkWebLeakUtils'
import { useDailySocialAction } from './useDailySocialAction'

/** Tuning values for the dark-web leak social action. */
export const DARK_WEB_LEAK_CONFIG: DarkWebLeakConfig = {
  COST: 500,
  FAME_GAIN: 300,
  ZEALOTRY_GAIN: 25,
  CONTROVERSY_GAIN: 30,
  HARMONY_COST: 20,
  REQUIRED_CONTROVERSY: 40
}

/**
 * Coordinates dark-web leak modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and leak tuning constants.
 */
export const useDarkWebLeak = () => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { darkWebLeak } = useGameActions()

  const hasRunToday = useCallback(
    () => checkHasLeakedToday(social, player.day),
    [social, player.day]
  )
  const validate = useCallback(
    () => validateDarkWebLeak(social, player, band, DARK_WEB_LEAK_CONFIG),
    [social, player, band]
  )
  const buildPayload = useCallback(
    (successMessageKey: string) => ({
      cost: DARK_WEB_LEAK_CONFIG.COST,
      fameGain: DARK_WEB_LEAK_CONFIG.FAME_GAIN,
      zealotryGain: DARK_WEB_LEAK_CONFIG.ZEALOTRY_GAIN,
      controversyGain: DARK_WEB_LEAK_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: DARK_WEB_LEAK_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: successMessageKey,
        type: 'success' as const
      }
    }),
    []
  )

  const action = useDailySocialAction({
    config: DARK_WEB_LEAK_CONFIG,
    loggerScope: 'DarkWebLeak',
    validationFailureMessage:
      'validateDarkWebLeak failed while deriving canLeak',
    successMessageKey: 'ui:dark_web_leak.success',
    validate,
    hasRunToday,
    dispatchAction: darkWebLeak,
    buildPayload
  })

  return {
    showDarkWebLeak: action.showModal,
    hasLeakedToday: action.hasRunToday,
    openDarkWebLeak: action.openModal,
    closeDarkWebLeak: action.closeModal,
    triggerLeak: action.trigger,
    canLeak: action.canRun,
    DARK_WEB_LEAK_CONFIG: action.config
  }
}
