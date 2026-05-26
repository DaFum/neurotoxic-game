/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * @module gameReducer
 */

import { ActionTypes } from './actionTypes'
import {
  handlePurchaseChassis,
  handleInstallModule,
  handleRemoveModule,
  handleUpgradeChassisTier,
  handleSellChassis,
  handleRepairChassis,
  handleStartCrowdfund,
  handleResolveCrowdfund,
  handleAssetForeclosed,
  handleAssetRiskEventTriggered,
  handleAssetFailedAction
} from './reducers/assetReducer'
import { logger } from '../utils/logger'
import { assertNever } from '../utils/assertNever'
import type { GameAction, GameState } from '../types'
import { handleChangeScene } from './reducers/sceneReducer'
import { handleUpdatePlayer } from './reducers/playerReducer'
import { bandReducer } from './reducers/bandReducer'
import {
  handleUpdateSocial,
  handleAddVenueBlacklist,
  handlePirateBroadcast,
  handleMerchPress,
  handleDarkWebLeak
} from './reducers/socialReducer'
import {
  handleSetGig,
  handleStartGig,
  handleSetSetlist,
  handleSetLastGigStats,
  handleSetGigModifiers
} from './reducers/gigReducer'
import {
  handleSetActiveEvent,
  handleApplyEventDelta,
  handlePopPendingEvent,
  handleAddCooldown
} from './reducers/eventReducer'
import {
  handleStartTravelMinigame,
  handleCompleteTravelMinigame,
  handleStartRoadieMinigame,
  handleCompleteRoadieMinigame,
  handleStartKabelsalatMinigame,
  handleCompleteKabelsalatMinigame,
  handleStartAmpCalibration,
  handleCompleteAmpCalibration
} from './reducers/minigameReducer'
import {
  handleClinicHeal,
  handleClinicEnhance,
  handleBloodBankDonate
} from './reducers/clinicReducer'
import { handleAddQuest, handleAdvanceQuest } from './reducers/questReducer'
import { MILESTONES } from '../data/milestones/milestones'
import { createAddToastAction } from './actionCreators'
import {
  handleLoadGame,
  handleResetState,
  handleUpdateSettings,
  handleSetMap,
  handleAddToast,
  handleRemoveToast,
  handleAdvanceDay,
  handleAddUnlock,
  handleSetPendingBandHQOpen,
  handleSetPendingSupplyStopInventory
} from './reducers/systemReducer'
import { handleTradeVoidItem } from './reducers/tradeReducer'
import {
  handleSpawnRivalBand,
  handleMoveRivalBand,
  handleUpdateRivalBand,
  handleCheckRivalEncounter
} from './reducers/rivalReducer'

export { ActionTypes }

/**
 * Utility type to extract the payload type from a GameAction union.
 */
const BAND_ACTIONS = [
  ActionTypes.UPDATE_BAND,
  ActionTypes.USE_CONTRABAND,
  ActionTypes.CONSUME_ITEM,
  ActionTypes.UNLOCK_TRAIT,
  ActionTypes.TOGGLE_NEURO_DECIMATOR
] as const

type BandActionType = (typeof BAND_ACTIONS)[number]

type HandledAction = Exclude<GameAction, { type: BandActionType }>
type HandledActionTypes = HandledAction['type']

type ActionFor<K extends HandledActionTypes> = Extract<
  HandledAction,
  { type: K }
>

type PayloadFor<K extends HandledActionTypes> =
  ActionFor<K> extends { payload: infer P } ? P : undefined

type ReducerEntry<K extends HandledActionTypes> =
  ActionFor<K> extends {
    payload: infer P
  }
    ? (state: GameState, payload: P) => GameState
    : (state: GameState) => GameState

type ReducerMap = {
  [K in HandledActionTypes]: ReducerEntry<K>
}

/**
 * Maps action types to their respective handler functions.
 * Using a map provides O(1) lookup instead of a long switch statement.
 */
const reducerMap: ReducerMap = {
  [ActionTypes.CHANGE_SCENE]: handleChangeScene,
  [ActionTypes.UPDATE_PLAYER]: handleUpdatePlayer,
  [ActionTypes.UPDATE_SOCIAL]: handleUpdateSocial,
  [ActionTypes.UPDATE_SETTINGS]: handleUpdateSettings,
  [ActionTypes.SET_MAP]: handleSetMap,
  [ActionTypes.SET_GIG]: handleSetGig,
  [ActionTypes.START_GIG]: handleStartGig,
  [ActionTypes.SET_SETLIST]: handleSetSetlist,
  [ActionTypes.SET_LAST_GIG_STATS]: handleSetLastGigStats,
  [ActionTypes.SET_ACTIVE_EVENT]: handleSetActiveEvent,
  [ActionTypes.ADD_TOAST]: handleAddToast,
  [ActionTypes.REMOVE_TOAST]: handleRemoveToast,
  [ActionTypes.SET_GIG_MODIFIERS]: handleSetGigModifiers,
  [ActionTypes.LOAD_GAME]: handleLoadGame,
  [ActionTypes.RESET_STATE]: handleResetState,
  [ActionTypes.APPLY_EVENT_DELTA]: handleApplyEventDelta,
  [ActionTypes.POP_PENDING_EVENT]: handlePopPendingEvent,
  [ActionTypes.ADVANCE_DAY]: handleAdvanceDay,
  [ActionTypes.ADD_COOLDOWN]: handleAddCooldown,
  [ActionTypes.START_TRAVEL_MINIGAME]: handleStartTravelMinigame,
  [ActionTypes.COMPLETE_TRAVEL_MINIGAME]: handleCompleteTravelMinigame,
  [ActionTypes.START_ROADIE_MINIGAME]: handleStartRoadieMinigame,
  [ActionTypes.COMPLETE_ROADIE_MINIGAME]: handleCompleteRoadieMinigame,
  [ActionTypes.START_KABELSALAT_MINIGAME]: handleStartKabelsalatMinigame,
  [ActionTypes.COMPLETE_KABELSALAT_MINIGAME]: handleCompleteKabelsalatMinigame,
  [ActionTypes.START_AMP_CALIBRATION]: handleStartAmpCalibration,
  [ActionTypes.COMPLETE_AMP_CALIBRATION]: handleCompleteAmpCalibration,
  [ActionTypes.SPAWN_RIVAL_BAND]: handleSpawnRivalBand,
  [ActionTypes.MOVE_RIVAL_BAND]: handleMoveRivalBand,
  [ActionTypes.CHECK_RIVAL_ENCOUNTER]: handleCheckRivalEncounter,
  [ActionTypes.UPDATE_RIVAL_BAND]: handleUpdateRivalBand,
  [ActionTypes.PIRATE_BROADCAST]: handlePirateBroadcast,
  [ActionTypes.MERCH_PRESS]: handleMerchPress,
  [ActionTypes.DARK_WEB_LEAK]: handleDarkWebLeak,
  [ActionTypes.ADD_VENUE_BLACKLIST]: handleAddVenueBlacklist,
  [ActionTypes.ADD_QUEST]: handleAddQuest,
  [ActionTypes.ADVANCE_QUEST]: handleAdvanceQuest,
  [ActionTypes.ADD_UNLOCK]: handleAddUnlock,
  [ActionTypes.CLINIC_HEAL]: handleClinicHeal,
  [ActionTypes.CLINIC_ENHANCE]: handleClinicEnhance,
  [ActionTypes.TRADE_VOID_ITEM]: handleTradeVoidItem,
  [ActionTypes.BLOOD_BANK_DONATE]: handleBloodBankDonate,
  [ActionTypes.SET_PENDING_BANDHQ_OPEN]: handleSetPendingBandHQOpen,
  [ActionTypes.SET_PENDING_SUPPLY_STOP_INVENTORY]:
    handleSetPendingSupplyStopInventory,
  [ActionTypes.PURCHASE_CHASSIS]: handlePurchaseChassis,
  [ActionTypes.PURCHASE_CHASSIS_FAILED]: handleAssetFailedAction,
  [ActionTypes.UPGRADE_CHASSIS_TIER]: handleUpgradeChassisTier,
  [ActionTypes.SELL_CHASSIS]: handleSellChassis,
  [ActionTypes.SELL_CHASSIS_FAILED]: handleAssetFailedAction,
  [ActionTypes.REPAIR_CHASSIS]: handleRepairChassis,
  [ActionTypes.INSTALL_MODULE]: handleInstallModule,
  [ActionTypes.INSTALL_MODULE_FAILED]: handleAssetFailedAction,
  [ActionTypes.REMOVE_MODULE]: handleRemoveModule,
  [ActionTypes.START_CROWDFUND]: handleStartCrowdfund,
  [ActionTypes.RESOLVE_CROWDFUND]: handleResolveCrowdfund,
  [ActionTypes.ASSET_FORECLOSED]: handleAssetForeclosed,
  [ActionTypes.ASSET_RISK_EVENT_TRIGGERED]: handleAssetRiskEventTriggered
}

/**
 * Main state reducer for the game.
 * Uses a map-based dispatcher or delegates to sub-reducers.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
const isHandledAction = (action: GameAction): action is HandledAction =>
  !(BAND_ACTIONS as readonly string[]).includes(action.type)

function runHandledAction<K extends HandledActionTypes>(
  state: GameState,
  action: ActionFor<K>
): GameState {
  const handler = reducerMap[action.type]

  if (Object.hasOwn(action, 'payload')) {
    return (handler as (state: GameState, payload: PayloadFor<K>) => GameState)(
      state,
      (action as { payload: PayloadFor<K> }).payload
    )
  }

  return (handler as (state: GameState) => GameState)(state)
}

export const gameReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  let nextState: GameState

  if (!isHandledAction(action)) {
    nextState = bandReducer(state, action)
  } else if (
    action &&
    typeof action === 'object' &&
    Object.hasOwn(action, 'type') &&
    Object.hasOwn(reducerMap, (action as { type: string }).type)
  ) {
    nextState = runHandledAction(state, action)
  } else {
    logger.warn(
      'gameReducer',
      `Unhandled action type: ${(action as { type?: unknown }).type}`,
      action
    )

    // Runtime safety net for malformed actions that bypass the dispatch
    // system. This is NOT an exhaustiveness check — the `as never` cast
    // hides the compile-time guarantee assertNever otherwise provides, and
    // the Object.hasOwn guards above already filter out every known action
    // type. The call throws if an unknown action shape reaches the reducer.
    return assertNever(action as never)
  }

  if (action.type === ActionTypes.ADVANCE_DAY) {
    const snapshotBeforeMilestones = nextState
    const completedSet = new Set(snapshotBeforeMilestones.completedMilestones)
    const triggeredMilestones: typeof MILESTONES[number][] = []

    for (let i = 0; i < MILESTONES.length; i++) {
      const m = MILESTONES[i]
      if (m && !completedSet.has(m.id) && m.condition(snapshotBeforeMilestones)) {
        triggeredMilestones.push(m)
        completedSet.add(m.id) // Ensure idempotency if conditions overlap
      }
    }

    if (triggeredMilestones.length > 0) {
      // Batch the array allocation once
      nextState = {
        ...nextState,
        completedMilestones: Array.from(completedSet)
      }

      for (let i = 0; i < triggeredMilestones.length; i++) {
        const milestone = triggeredMilestones[i]
        if (!milestone) continue

        const rewardAction = milestone.createRewardAction?.()
        if (rewardAction) {
          nextState = gameReducer(nextState, rewardAction)
        }

        nextState = gameReducer(
          nextState,
          createAddToastAction({
            type: 'info',
            messageKey: milestone.labelKey
          })
        )
      }
    }
  }

  return nextState
}
