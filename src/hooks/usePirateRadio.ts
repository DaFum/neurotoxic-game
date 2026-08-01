import type { ZealotryActionConfig } from '../types'
import { useGameActions } from '../context/GameState'
import type { ZealotryActionDescriptor } from '../utils/dailySocialActionUtils'
import { useZealotryAction } from './useZealotryAction'

/** Tuning values for the pirate-radio social action. */
export const PIRATE_RADIO_CONFIG: ZealotryActionConfig = {
  COST: 200,
  FAME_GAIN: 150,
  ZEALOTRY_GAIN: 15,
  CONTROVERSY_GAIN: 20,
  HARMONY_COST: 10
}

const PIRATE_RADIO_ACTION: ZealotryActionDescriptor = {
  dayField: 'lastPirateBroadcastDay',
  config: PIRATE_RADIO_CONFIG,
  loggerScope: 'PirateRadio',
  validationFailureMessage:
    'validatePirateBroadcast failed while deriving canBroadcast',
  successMessageKey: 'ui:pirate_radio.success'
}

/**
 * Coordinates pirate-radio modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and pirate-radio tuning constants.
 */
export const usePirateRadio = () => {
  const { pirateBroadcast } = useGameActions()
  const action = useZealotryAction(PIRATE_RADIO_ACTION, pirateBroadcast)

  return {
    showPirateRadio: action.showModal,
    hasBroadcastedToday: action.hasRunToday,
    openPirateRadio: action.openModal,
    closePirateRadio: action.closeModal,
    triggerBroadcast: action.trigger,
    canBroadcast: action.canRun,
    PIRATE_RADIO_CONFIG
  }
}
