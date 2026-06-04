/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * Module: `gameReducer`.
 */

import { ActionTypes } from './actionTypes'
import { QuestEvents } from '../utils/questProgress'
import {
  handlePurchaseChassis,
  handleInstallModule,
  handleRemoveModule,
  handleUpgradeChassisTier,
  handleSellChassis,
  handleRepairChassis,
  handleRefinanceLiability,
  handleStartCrowdfund,
  handleAssetForeclosed,
  handleDismissForeclosureNotice,
  handleAssetFailedAction
} from './reducers/assetReducer'
import { logger } from '../utils/logger'
import { assertNever } from '../utils/assertNever'
import type { GameAction, GameState } from '../types'
import type { AssetKind } from '../types/assets'
import { handleChangeScene } from './reducers/sceneReducer'
import { handleUpdatePlayer } from './reducers/playerReducer'
import { bandReducer } from './reducers/bandReducer'
import {
  handleUpdateSocial,
  handleUnblacklistVenue,
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
import { assetForeclosed } from './assetActionCreators'
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
  handleSetPendingSupplyStopInventory,
  handleSetPendingRiskEvent
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
  ActionTypes.TOGGLE_NEURO_DECIMATOR,
  ActionTypes.CRAFT_ITEM
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
  [ActionTypes.UNBLACKLIST_VENUE]: handleUnblacklistVenue,
  [ActionTypes.ADD_QUEST]: handleAddQuest,
  [ActionTypes.ADVANCE_QUEST]: handleAdvanceQuest,
  [ActionTypes.APPLY_QUEST_EVENT]: (
    state: GameState,
    payload: import('../utils/questProgress').QuestProgressEvent
  ) => QuestEvents.emit(state, payload),
  [ActionTypes.ADD_UNLOCK]: handleAddUnlock,
  [ActionTypes.CLINIC_HEAL]: handleClinicHeal,
  [ActionTypes.CLINIC_ENHANCE]: handleClinicEnhance,
  [ActionTypes.TRADE_VOID_ITEM]: handleTradeVoidItem,
  [ActionTypes.BLOOD_BANK_DONATE]: handleBloodBankDonate,
  [ActionTypes.SET_PENDING_BANDHQ_OPEN]: handleSetPendingBandHQOpen,
  [ActionTypes.SET_PENDING_SUPPLY_STOP_INVENTORY]:
    handleSetPendingSupplyStopInventory,
  [ActionTypes.DISMISS_FORECLOSURE_NOTICE]: handleDismissForeclosureNotice,
  [ActionTypes.SET_PENDING_RISK_EVENT]: handleSetPendingRiskEvent,
  [ActionTypes.PURCHASE_CHASSIS]: handlePurchaseChassis,
  [ActionTypes.PURCHASE_CHASSIS_FAILED]: handleAssetFailedAction,
  [ActionTypes.UPGRADE_CHASSIS_TIER]: handleUpgradeChassisTier,
  [ActionTypes.SELL_CHASSIS]: handleSellChassis,
  [ActionTypes.SELL_CHASSIS_FAILED]: handleAssetFailedAction,
  [ActionTypes.REPAIR_CHASSIS]: handleRepairChassis,
  [ActionTypes.REFINANCE_LIABILITY]: handleRefinanceLiability,
  [ActionTypes.REFINANCE_LIABILITY_FAILED]: handleAssetFailedAction,
  [ActionTypes.INSTALL_MODULE]: handleInstallModule,
  [ActionTypes.INSTALL_MODULE_FAILED]: handleAssetFailedAction,
  [ActionTypes.REMOVE_MODULE]: handleRemoveModule,
  [ActionTypes.START_CROWDFUND]: handleStartCrowdfund,
  [ActionTypes.ASSET_FORECLOSED]: handleAssetForeclosed
}

/**
 * Narrows actions that can be handled by the root reducer map.
 *
 * @param action - Game action being routed.
 * @returns True when the action is not owned by the band reducer.
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

const applyZeroConditionForeclosures = (state: GameState): GameState => {
  const assets = Array.isArray(state.assets) ? state.assets : []
  let nextState = state
  const foreclosedKinds: AssetKind[] = []
  for (const asset of assets) {
    if (asset.condition !== 0) continue
    foreclosedKinds.push(asset.kind)
    nextState = runHandledAction(nextState, assetForeclosed(asset.id))
  }
  if (foreclosedKinds.length === 0) return nextState

  const pendingForeclosureNotices = [
    ...(nextState.pendingForeclosureNotices ?? [])
  ]
  for (const kind of foreclosedKinds) {
    if (!pendingForeclosureNotices.includes(kind)) {
      pendingForeclosureNotices.push(kind)
    }
  }

  nextState = {
    ...nextState,
    pendingForeclosureNotices
  }
  return nextState
}

/**
 * Root game reducer that routes handled actions to domain reducers.
 *
 * @param state - Current game state.
 * @param action - Game action to apply.
 * @returns Next game state.
 */
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
    nextState = applyZeroConditionForeclosures(nextState)
    const snapshotBeforeMilestones = nextState
    const completedSet = new Set(snapshotBeforeMilestones.completedMilestones)
    const triggeredMilestones: (typeof MILESTONES)[number][] = []

    for (let i = 0; i < MILESTONES.length; i++) {
      const m = MILESTONES[i]
      if (
        m &&
        !completedSet.has(m.id) &&
        m.condition(snapshotBeforeMilestones)
      ) {
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
            messageKey: milestone.labelKey,
            options: milestone.createLabelOptions?.()
          })
        )
      }
    }
  }

  return nextState
}
