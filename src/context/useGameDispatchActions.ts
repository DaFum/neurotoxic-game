import type { TFunction } from 'i18next'
import {
  useCallback,
  useMemo,
  startTransition,
  type MutableRefObject,
  type Dispatch
} from 'react'
import type {
  GameState,
  GameAction,
  SocialState,
  UpdateBandPayload,
  UpdatePlayerPayload,
  GamePhase
} from '../types'
import { GAME_PHASES, PRACTICE_RETURN_SCENES } from './gameConstants'
import { logger } from '../utils/logger'
import {
  readGlobalSettings,
  safeStorageOperation,
  writeGlobalSettings
} from '../utils/storage'
import { handleError, StateError } from '../utils/errorHandler'
import { getUnlocks } from '../utils/unlockManager'
import { useStorage } from './StorageContext'
import { sanitizeSettingsPayload } from '../utils/settingsSanitizer'
import { usePersistence } from './usePersistence'
import { useEventSystem } from './useEventSystem'
import { useMinigameDispatchActions } from './useMinigameDispatchActions'
import { useAssetDispatchActions } from './useAssetDispatchActions'
import { useExpeditionDispatchActions } from './useExpeditionDispatchActions'
import {
  useFacilityDispatchActions,
  type FacilityDispatchActions
} from './useFacilityDispatchActions'
import {
  useQuestDispatchActions,
  type QuestDispatchActions
} from './useQuestDispatchActions'
import {
  useRivalBandDispatchActions,
  type RivalBandDispatchActions
} from './useRivalBandDispatchActions'
import {
  createChangeSceneAction,
  createUpdatePlayerAction,
  createUpdateBandAction,
  createUpdateSocialAction,
  createUpdateSettingsAction,
  createSetMapAction,
  createSetGigAction,
  createStartGigAction,
  createSetSetlistAction,
  createSetLastGigStatsAction,
  createSetActiveEventAction,
  createAddToastAction,
  createRemoveToastAction,
  createSetGigModifiersAction,
  createResetStateAction,
  createConsumeItemAction,
  advanceDay as advanceDayAction,
  createStartTravelMinigameAction,
  createCompleteTravelMinigameAction,
  createStartRoadieMinigameAction,
  createCompleteRoadieMinigameAction,
  createStartKabelsalatMinigameAction,
  createCompleteKabelsalatMinigameAction,
  createStartAmpCalibrationAction,
  createCompleteAmpCalibrationAction,
  createUnlockTraitAction,
  createSetPendingBandHQOpenAction,
  createSetPendingSupplyStopInventoryAction,
  dismissForeclosureNotice as dismissForeclosureNoticeAction,
  createSetPendingRiskEventAction,
  toggleNeuroDecimator as createToggleNeuroDecimatorAction
} from './actionCreators'
import {
  purchaseChassis as purchaseChassisAction,
  installModule as installModuleAction,
  startCrowdfund as startCrowdfundAction
} from './assetActionCreators'

type BaseGameDispatchActions = {
  changeScene: (scene: Parameters<typeof createChangeSceneAction>[0]) => void
  updatePlayer: (
    updates: Parameters<typeof createUpdatePlayerAction>[0]
  ) => void
  updateBand: (updates: Parameters<typeof createUpdateBandAction>[0]) => void
  toggleNeuroDecimator: (
    isActive: Parameters<typeof createToggleNeuroDecimatorAction>[0]
  ) => void
  updateSocial: (
    updates:
      Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)
  ) => void
  setGameMap: (mapData: Parameters<typeof createSetMapAction>[0]) => void
  setCurrentGig: (gig: Parameters<typeof createSetGigAction>[0]) => void
  startGig: (gig: Parameters<typeof createStartGigAction>[0]) => void
  setSetlist: (list: Parameters<typeof createSetSetlistAction>[0]) => void
  setLastGigStats: (
    stats: Parameters<typeof createSetLastGigStatsAction>[0]
  ) => void
  setActiveEvent: (
    event: Parameters<typeof createSetActiveEventAction>[0]
  ) => void
  setScreenshotMode: (enabled: boolean) => void
  triggerEvent: (category: string, triggerPoint?: string | null) => boolean
  resolveEvent: (choice: Record<string, unknown> | null) => {
    outcomeText: string
    description: string
    result: unknown
  }
  addToast: (
    message: Parameters<typeof createAddToastAction>[0],
    type?: string
  ) => void
  removeToast: (id: Parameters<typeof createRemoveToastAction>[0]) => void
  setGigModifiers: (
    modifiers: Parameters<typeof createSetGigModifiersAction>[0]
  ) => void
  consumeItem: (itemId: Parameters<typeof createConsumeItemAction>[0]) => void
  advanceDay: () => void
  saveGame: (showToast?: boolean, stateSnapshot?: GameState) => void
  saveGameAfterStateCommit: () => void
  loadGame: () => boolean
  deleteSave: () => void
  resetState: () => void
  updateSettings: (
    settings: Parameters<typeof createUpdateSettingsAction>[0]
  ) => void
  startTravelMinigame: (
    payload: Parameters<typeof createStartTravelMinigameAction>[0]
  ) => void
  completeTravelMinigame: (
    damageTaken: Parameters<typeof createCompleteTravelMinigameAction>[0],
    itemsCollected: Parameters<typeof createCompleteTravelMinigameAction>[1]
  ) => void
  startRoadieMinigame: (
    payload: Parameters<typeof createStartRoadieMinigameAction>[0]
  ) => void
  completeRoadieMinigame: (
    equipmentDamage: Parameters<typeof createCompleteRoadieMinigameAction>[0],
    contrabandDelivered?: Parameters<
      typeof createCompleteRoadieMinigameAction
    >[1],
    deliveredStashItemId?: Parameters<
      typeof createCompleteRoadieMinigameAction
    >[2]
  ) => void
  startKabelsalatMinigame: (
    payload: Parameters<typeof createStartKabelsalatMinigameAction>[0]
  ) => void
  completeKabelsalatMinigame: (
    payload: Parameters<typeof createCompleteKabelsalatMinigameAction>[0]
  ) => void
  startAmpCalibration: (
    payload: Parameters<typeof createStartAmpCalibrationAction>[0]
  ) => void
  completeAmpCalibration: (
    score: Parameters<typeof createCompleteAmpCalibrationAction>[0],
    voidResonance?: Parameters<typeof createCompleteAmpCalibrationAction>[1],
    purgesUsed?: Parameters<typeof createCompleteAmpCalibrationAction>[2],
    hijacksOverridden?: Parameters<
      typeof createCompleteAmpCalibrationAction
    >[3],
    feedbackLoopsDampened?: Parameters<
      typeof createCompleteAmpCalibrationAction
    >[4]
  ) => void
  unlockTrait: (
    memberId: Parameters<typeof createUnlockTraitAction>[0],
    traitId: Parameters<typeof createUnlockTraitAction>[1]
  ) => void
  endGig: () => void
  setPendingBandHQOpen: (isOpen: boolean) => void
  setPendingSupplyStopInventory: (
    inventory: GameState['pendingSupplyStopInventory']
  ) => void
  dismissForeclosureNotice: (
    kind: Parameters<typeof dismissForeclosureNoticeAction>[0]
  ) => void
  setPendingRiskEvent: (
    event: Parameters<typeof createSetPendingRiskEventAction>[0]
  ) => void

  // Long-term asset actions — every helper takes the resolved input and
  // delegates to the asset action creators. Failures surface as typed
  // *_FAILED actions which the reducer handles as no-ops; the dispatch
  // boundary tracks them so middleware can translate to toasts in future.
  purchaseChassis: (input: Parameters<typeof purchaseChassisAction>[0]) => void
  upgradeChassisTier: (
    assetId: string,
    targetTier: import('../types/assets').ChassisTier
  ) => void
  sellChassis: (assetId: string) => void
  repairChassis: (assetId: string) => void
  refinanceLiability: (
    liabilityId: string,
    loanProfileId: import('../utils/loanProfiles').LoanProfileId
  ) => void
  installModule: (input: Parameters<typeof installModuleAction>[0]) => void
  removeModule: (assetId: string, slotId: string) => void
  startCrowdfund: (input: Parameters<typeof startCrowdfundAction>[0]) => void

  // Roguelite Expedition (G1). Creators read the same `stateRef` snapshot the
  // reducer validates against, so a prepared run's seed and the previewed map
  // cannot diverge.
  prepareExpeditionRun: () => void
  startExpedition: (
    loadout: import('../types/expedition').ExpeditionLoadout
  ) => void
  advanceExpeditionRoute: (nodeId: string) => void
  revealExpeditionNodeIntel: (input: {
    nodeId: string
    source: import('../types/expedition').ExpeditionIntelSource
    grantId?: string
  }) => void
  addExpeditionReward: (input: {
    expectedRewardId: string
    sourceType: import('../types/expedition').ExpeditionRewardSourceType
    sourceId: string
  }) => void
  extractExpedition: (explicitRareRewardIds?: string[]) => void
  completeExpedition: (finaleResultId: string) => void
  acceptExpeditionFailure: () => void
  prepareNextExpedition: () => void
  resolveExpeditionCrisis: (choice: 'refuel' | 'tow') => void
}

/**
 * Stable command surface exposed by GameStateProvider for mutating game state.
 */
export type GameDispatchActions = BaseGameDispatchActions &
  FacilityDispatchActions &
  QuestDispatchActions &
  RivalBandDispatchActions

/**
 * The plain `dispatch(creator(payload))` wrappers, which depend on `dispatch`
 * alone and are therefore built in a single memo.
 */
type SimpleDispatchActions = Pick<
  BaseGameDispatchActions,
  | 'updatePlayer'
  | 'updateBand'
  | 'toggleNeuroDecimator'
  | 'updateSocial'
  | 'setGameMap'
  | 'setCurrentGig'
  | 'startGig'
  | 'setSetlist'
  | 'setLastGigStats'
  | 'removeToast'
  | 'setGigModifiers'
  | 'consumeItem'
  | 'unlockTrait'
  | 'setPendingBandHQOpen'
  | 'setPendingSupplyStopInventory'
  | 'dismissForeclosureNotice'
  | 'setPendingRiskEvent'
  | 'updateSettings'
>

interface UseGameDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  state: GameState
  stateRef: MutableRefObject<GameState>
  tRef: MutableRefObject<TFunction>
  resetMapGenerationRetries: () => void
}

/**
 * Creates the memoized dispatch action bundle used by GameStateProvider.
 *
 * @param props - Dispatch dependencies, current state snapshots, translator ref, and map retry reset callback.
 * @returns Stable game action methods for reducers, persistence, events, minigames, and assets.
 */
export function useGameDispatchActions({
  dispatch,
  state,
  stateRef,
  tRef,
  resetMapGenerationRetries
}: UseGameDispatchActionsProps): GameDispatchActions {
  const storage = useStorage()

  // `changeScene` and `addToast` stay separate: the persistence and event
  // sub-hooks below take them as inputs, so they must exist before the bundle.
  const changeScene = useCallback(
    (scene: Parameters<typeof createChangeSceneAction>[0]) =>
      startTransition(() => dispatch(createChangeSceneAction(scene))),
    [dispatch]
  )

  const addToast = useCallback(
    (
      message: Parameters<typeof createAddToastAction>[0],
      type: Parameters<typeof createAddToastAction>[1] = 'info'
    ) => dispatch(createAddToastAction(message, type)),
    [dispatch]
  )

  const { deleteSave, saveGame, saveGameAfterStateCommit, loadGame } =
    usePersistence({
      currentScene: state.currentScene,
      stateRef,
      dispatch,
      addToast,
      tRef
    })

  const { setActiveEvent, setScreenshotMode, triggerEvent, resolveEvent } =
    useEventSystem({
      stateRef,
      dispatch,
      addToast,
      changeScene,
      saveGame,
      tRef
    })

  const simpleActions: SimpleDispatchActions = useMemo(
    () => ({
      updatePlayer: (updates: UpdatePlayerPayload) =>
        dispatch(createUpdatePlayerAction(updates)),
      updateBand: (updates: UpdateBandPayload) =>
        dispatch(createUpdateBandAction(updates)),
      toggleNeuroDecimator: isActive =>
        dispatch(createToggleNeuroDecimatorAction(isActive)),
      updateSocial: (
        updates:
          Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)
      ) => dispatch(createUpdateSocialAction(updates)),
      // setGameMap is an intentional test seam on the public dispatch surface.
      // Production map creation lives in useMapGeneration, which dispatches
      // createSetMapAction directly: that hook is instantiated before this one
      // (its resetMapGenerationRetries is a prop of this hook), so routing it
      // through this method would create a circular hook dependency.
      setGameMap: mapData => dispatch(createSetMapAction(mapData)),
      setCurrentGig: gig => dispatch(createSetGigAction(gig)),
      startGig: gig =>
        startTransition(() => dispatch(createStartGigAction(gig))),
      setSetlist: list => dispatch(createSetSetlistAction(list)),
      setLastGigStats: stats => dispatch(createSetLastGigStatsAction(stats)),
      removeToast: id => dispatch(createRemoveToastAction(id)),
      setGigModifiers: modifiers =>
        dispatch(createSetGigModifiersAction(modifiers)),
      consumeItem: itemId => dispatch(createConsumeItemAction(itemId)),
      unlockTrait: (memberId, traitId) =>
        dispatch(createUnlockTraitAction(memberId, traitId)),
      setPendingBandHQOpen: isOpen =>
        dispatch(createSetPendingBandHQOpenAction(isOpen)),
      setPendingSupplyStopInventory: inventory =>
        dispatch(createSetPendingSupplyStopInventoryAction(inventory)),
      dismissForeclosureNotice: kind =>
        dispatch(dismissForeclosureNoticeAction(kind)),
      setPendingRiskEvent: event => {
        const action = createSetPendingRiskEventAction(event)
        if (action) dispatch(action)
      },
      updateSettings: (updates: Record<string, unknown>) => {
        dispatch(createUpdateSettingsAction(updates))

        // Resolve the effective settings once through the canonical sanitizer
        // and feed the same result to both the logger side effect and the
        // storage write. A separate `Number(...)` reading here would let the
        // runtime logger accept values (numeric strings, booleans) that the
        // reducer and persisted settings drop, leaving the three out of sync.
        const sanitizedUpdates = sanitizeSettingsPayload(updates)

        if (updates.logLevel !== undefined) {
          const { logLevel } = sanitizedUpdates
          if (logLevel !== undefined) {
            logger.setLevel(logLevel)
          } else {
            logger.warn(
              'GameState',
              'Rejected persisted invalid logLevel update',
              updates.logLevel
            )
          }
        }

        // Sanitize before writing to global storage so malformed or unknown
        // keys (e.g. a non-numeric logLevel) never leak past the reducer's
        // validation into persisted global settings. The shared sanitizer keeps
        // storage, reducer, and load in sync.
        safeStorageOperation('saveGlobalSettings', () => {
          writeGlobalSettings(
            {
              ...readGlobalSettings(storage),
              ...sanitizedUpdates
            },
            storage
          )
        })
      }
    }),
    [dispatch, storage]
  )

  const resetState = useCallback(() => {
    resetMapGenerationRetries()
    // Same adapter initialization, save/load, and event unlocks use: reading
    // the module default here would let a reset overwrite the injected
    // backend's unlocks with whatever sits in browser storage.
    dispatch(createResetStateAction({ unlocks: getUnlocks(storage) }))
  }, [dispatch, resetMapGenerationRetries, storage])

  const advanceDay = useCallback(() => {
    const currentState = stateRef.current
    const nextDay = currentState.player.day + 1
    try {
      dispatch(advanceDayAction(currentState))
    } catch (error) {
      handleError(
        new StateError('Failed to advance day', {
          originalError: error instanceof Error ? error.message : String(error)
        }),
        { source: 'GameState.advanceDay', silent: true }
      )
      addToast(
        tRef.current('ui:error.advanceDayFailed', {
          defaultValue: 'Could not advance day. Please try again.'
        }),
        'error'
      )
      return
    }
    addToast(tRef.current('ui:day_advance', { day: nextDay }), 'info')
  }, [dispatch, addToast, stateRef, tRef])

  const { setPendingBandHQOpen } = simpleActions
  const endGig = useCallback(() => {
    const currentState = stateRef.current
    if (currentState.currentGig?.isPractice) {
      addToast(tRef.current('ui:gig.practiceComplete'), 'success')
      const rawTarget = currentState.currentGig.sourceScene
      const isValidTarget =
        rawTarget !== undefined &&
        PRACTICE_RETURN_SCENES.has(rawTarget as GamePhase)
      const targetScene = isValidTarget ? rawTarget : GAME_PHASES.OVERWORLD
      // Product decision: returning from PRACTICE must ALWAYS reopen the Band HQ,
      // regardless of whether the source scene was OVERWORLD or MENU. Do NOT gate
      // setPendingBandHQOpen on targetScene === OVERWORLD — that breaks the MENU
      // return path. (Raised in review more than once; the unconditional open is
      // intentional.)
      setPendingBandHQOpen(true)
      changeScene(targetScene as GamePhase)
    } else {
      changeScene(GAME_PHASES.POST_GIG)
    }
  }, [addToast, changeScene, setPendingBandHQOpen, stateRef, tRef])

  const minigameActions = useMinigameDispatchActions(dispatch)
  const facilityActions = useFacilityDispatchActions(dispatch)
  const questActions = useQuestDispatchActions(dispatch)
  const rivalBandActions = useRivalBandDispatchActions({ dispatch, stateRef })
  const assetActions = useAssetDispatchActions({
    dispatch,
    stateRef,
    addToast,
    tRef
  })
  const expeditionActions = useExpeditionDispatchActions({
    dispatch,
    stateRef
  })

  return useMemo(
    () => ({
      changeScene,
      addToast,
      setActiveEvent,
      setScreenshotMode,
      triggerEvent,
      resolveEvent,
      advanceDay,
      saveGame,
      saveGameAfterStateCommit,
      loadGame,
      deleteSave,
      resetState,
      endGig,
      ...simpleActions,
      ...minigameActions,
      ...facilityActions,
      ...questActions,
      ...rivalBandActions,
      ...assetActions,
      ...expeditionActions
    }),
    [
      changeScene,
      addToast,
      setActiveEvent,
      setScreenshotMode,
      triggerEvent,
      resolveEvent,
      advanceDay,
      saveGame,
      saveGameAfterStateCommit,
      loadGame,
      deleteSave,
      resetState,
      endGig,
      simpleActions,
      minigameActions,
      facilityActions,
      questActions,
      rivalBandActions,
      assetActions,
      expeditionActions
    ]
  )
}
