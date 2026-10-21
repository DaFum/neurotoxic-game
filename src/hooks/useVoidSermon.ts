import type { ZealotryActionConfig } from '../types'
import { useGameActions } from '../context/GameState'
import type { ZealotryActionDescriptor } from '../utils/dailySocialActionUtils'
import { useZealotryAction } from './useZealotryAction'
import { VOID_SERMON_REQUIRED_ZEALOTRY } from '../data/zealotryActionGates'

/** Tuning values for the void sermon social action. */
const VOID_SERMON_CONFIG: ZealotryActionConfig = {
  COST: 750,
  FAME_GAIN: 400,
  ZEALOTRY_GAIN: 25,
  CONTROVERSY_GAIN: 40,
  HARMONY_COST: 25,
  REQUIRED_ZEALOTRY: VOID_SERMON_REQUIRED_ZEALOTRY
}

const VOID_SERMON_ACTION: ZealotryActionDescriptor = {
  dayField: 'lastVoidSermonDay',
  thresholdField: 'zealotry',
  thresholdRequired: VOID_SERMON_CONFIG.REQUIRED_ZEALOTRY,
  config: VOID_SERMON_CONFIG,
  loggerScope: 'VoidSermon',
  validationFailureMessage:
    'validateVoidSermon failed while deriving canSermon',
  successMessageKey: 'ui:void_sermon.success'
}

/**
 * Coordinates void sermon modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and sermon tuning constants.
 */
export const useVoidSermon = () => {
  const { voidSermon } = useGameActions()
  const action = useZealotryAction(VOID_SERMON_ACTION, voidSermon)

  return {
    showVoidSermon: action.showModal,
    hasSermonedToday: action.hasRunToday,
    openVoidSermon: action.openModal,
    closeVoidSermon: action.closeModal,
    triggerSermon: action.trigger,
    canSermon: action.canRun,
    VOID_SERMON_CONFIG
  }
}
