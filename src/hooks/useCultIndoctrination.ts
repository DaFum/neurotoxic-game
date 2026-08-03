import type { CultIndoctrinationConfig } from '../types'
import { useGameActions } from '../context/GameState'
import type { ZealotryActionDescriptor } from '../utils/dailySocialActionUtils'
import { useZealotryAction } from './useZealotryAction'

/** Tuning values for the cult indoctrination social action. */
const CULT_INDOCTRINATION_CONFIG: CultIndoctrinationConfig = {
  COST: 1000,
  FAME_GAIN: 500,
  ZEALOTRY_GAIN: 40,
  CONTROVERSY_GAIN: 50,
  HARMONY_COST: 30,
  REQUIRED_ZEALOTRY: 50
}

const CULT_INDOCTRINATION_ACTION: ZealotryActionDescriptor = {
  dayField: 'lastCultIndoctrinationDay',
  thresholdField: 'zealotry',
  thresholdRequired: CULT_INDOCTRINATION_CONFIG.REQUIRED_ZEALOTRY,
  config: CULT_INDOCTRINATION_CONFIG,
  loggerScope: 'CultIndoctrination',
  validationFailureMessage:
    'validateCultIndoctrination failed while deriving canIndoctrinate',
  successMessageKey: 'ui:cult_indoctrination.success'
}

/**
 * Coordinates cult indoctrination modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and indoctrination tuning constants.
 */
export const useCultIndoctrination = () => {
  const { cultIndoctrination } = useGameActions()
  const action = useZealotryAction(
    CULT_INDOCTRINATION_ACTION,
    cultIndoctrination
  )

  return {
    showCultIndoctrination: action.showModal,
    hasIndoctrinatedToday: action.hasRunToday,
    openCultIndoctrination: action.openModal,
    closeCultIndoctrination: action.closeModal,
    triggerIndoctrination: action.trigger,
    canIndoctrinate: action.canRun,
    CULT_INDOCTRINATION_CONFIG
  }
}
