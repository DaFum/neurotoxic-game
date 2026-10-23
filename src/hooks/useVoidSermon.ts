import { useGameActions } from '../context/GameState'
import type { ZealotryActionDescriptor } from '../utils/dailySocialActionUtils'
import { useZealotryAction } from './useZealotryAction'
import { VOID_SERMON_CONFIG } from '../data/zealotryActionConfigs'

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
 * @remarks
 * Confirmed tuning values (Cost: $750, Fame: +400, Zealotry: +25, Controversy: +40, Harmony: -25)
 * are retained per `docs/balance/void-sermon-tuning.md`. Repeat execution is bounded by the
 * once-per-day daily cap, cash reserves ($750), and band harmony drain (-25).
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
