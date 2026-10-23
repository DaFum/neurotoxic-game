import { useGameActions } from '../context/GameState'
import type { ZealotryActionDescriptor } from '../utils/dailySocialActionUtils'
import { useZealotryAction } from './useZealotryAction'
import { DARK_WEB_LEAK_CONFIG } from '../data/zealotryActionConfigs'

const DARK_WEB_LEAK_ACTION: ZealotryActionDescriptor = {
  dayField: 'lastDarkWebLeakDay',
  thresholdField: 'controversyLevel',
  thresholdRequired: DARK_WEB_LEAK_CONFIG.REQUIRED_CONTROVERSY,
  config: DARK_WEB_LEAK_CONFIG,
  loggerScope: 'DarkWebLeak',
  validationFailureMessage: 'validateDarkWebLeak failed while deriving canLeak',
  successMessageKey: 'ui:dark_web_leak.success'
}

/**
 * Coordinates dark-web leak modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and leak tuning constants.
 */
export const useDarkWebLeak = () => {
  const { darkWebLeak } = useGameActions()
  const action = useZealotryAction(DARK_WEB_LEAK_ACTION, darkWebLeak)

  return {
    showDarkWebLeak: action.showModal,
    hasLeakedToday: action.hasRunToday,
    openDarkWebLeak: action.openModal,
    closeDarkWebLeak: action.closeModal,
    triggerLeak: action.trigger,
    canLeak: action.canRun,
    DARK_WEB_LEAK_CONFIG
  }
}
