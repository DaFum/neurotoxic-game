import { useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import {
  checkHasBroadcastedToday,
  validatePirateBroadcast
} from '../utils/pirateRadioUtils'
import { useDailySocialAction } from './useDailySocialAction'

/** Tuning values for the pirate-radio social action. */
export const PIRATE_RADIO_CONFIG = {
  COST: 200,
  FAME_GAIN: 150,
  ZEALOTRY_GAIN: 15,
  CONTROVERSY_GAIN: 20,
  HARMONY_COST: 10
}

/**
 * Coordinates pirate-radio modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and pirate-radio tuning constants.
 */
export const usePirateRadio = () => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { pirateBroadcast } = useGameActions()

  const hasRunToday = useCallback(
    () => checkHasBroadcastedToday(social, player.day),
    [social, player.day]
  )
  const validate = useCallback(
    () => validatePirateBroadcast(social, player, band, PIRATE_RADIO_CONFIG),
    [social, player, band]
  )
  const buildPayload = useCallback(
    (successMessageKey: string) => ({
      cost: PIRATE_RADIO_CONFIG.COST,
      fameGain: PIRATE_RADIO_CONFIG.FAME_GAIN,
      zealotryGain: PIRATE_RADIO_CONFIG.ZEALOTRY_GAIN,
      controversyGain: PIRATE_RADIO_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: PIRATE_RADIO_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: successMessageKey,
        type: 'success' as const
      }
    }),
    []
  )

  const action = useDailySocialAction({
    config: PIRATE_RADIO_CONFIG,
    loggerScope: 'PirateRadio',
    validationFailureMessage:
      'validatePirateBroadcast failed while deriving canBroadcast',
    successMessageKey: 'ui:pirate_radio.success',
    validate,
    hasRunToday,
    dispatchAction: pirateBroadcast,
    buildPayload
  })

  return {
    showPirateRadio: action.showModal,
    hasBroadcastedToday: action.hasRunToday,
    openPirateRadio: action.openModal,
    closePirateRadio: action.closeModal,
    triggerBroadcast: action.trigger,
    canBroadcast: action.canRun,
    PIRATE_RADIO_CONFIG: action.config
  }
}
