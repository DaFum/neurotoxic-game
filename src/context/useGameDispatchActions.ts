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
  RivalBandState,
  SocialState,
  UpdateBandPayload,
  UpdatePlayerPayload,
  GamePhase
} from '../types'
import { GAME_PHASES, PRACTICE_RETURN_SCENES } from './gameConstants'
import { logger, isValidLogLevel } from '../utils/logger'
import { safeJsonParse, isLooseRecord } from '../utils/gameStateUtils'
import { safeStorageNoFallback, safeStorage } from '../utils/storage'
import { handleError, StateError } from '../utils/errorHandler'
import { getUnlocks } from '../utils/unlockManager'
import { secureRandom } from '../utils/crypto'
import { usePersistence } from './usePersistence'
import { useEventSystem } from './useEventSystem'
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
  createSpawnRivalBandAction,
  createMoveRivalBandAction,
  createCheckRivalEncounterAction,
  createUpdateRivalBandAction,
  createUnlockTraitAction,
  createAddQuestAction,
  createAdvanceQuestAction,
  createUseContrabandAction,
  createClinicHealAction,
  createClinicEnhanceAction,
  createPirateBroadcastAction,
  createDarkWebLeakAction,
  createMerchPressAction,
  createTradeVoidItemAction,
  createBloodBankDonateAction,
  createAddVenueBlacklistAction,
  createSetPendingBandHQOpenAction,
  createSetPendingSupplyStopInventoryAction,
  dismissForeclosureNotice as dismissForeclosureNoticeAction,
  createSetPendingRiskEventAction,
  toggleNeuroDecimator as createToggleNeuroDecimatorAction
} from './actionCreators'
import {
  purchaseChassis as purchaseChassisAction,
  upgradeChassisTier as upgradeChassisTierAction,
  sellChassis as sellChassisAction,
  repairChassis as repairChassisAction,
  installModule as installModuleAction,
  removeModule as removeModuleAction,
  startCrowdfund as startCrowdfundAction
} from './assetActionCreators'

export type GameDispatchActions = {
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
      | Partial<SocialState>
      | ((prev: SocialState) => Partial<SocialState>)
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
    >[1]
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
    hijacksOverridden?: Parameters<typeof createCompleteAmpCalibrationAction>[3]
  ) => void
  unlockTrait: (
    memberId: Parameters<typeof createUnlockTraitAction>[0],
    traitId: Parameters<typeof createUnlockTraitAction>[1]
  ) => void
  endGig: () => void
  addQuest: (payload: Parameters<typeof createAddQuestAction>[0]) => void
  advanceQuest: (
    questId: Parameters<typeof createAdvanceQuestAction>[0],
    progressAmount: Parameters<typeof createAdvanceQuestAction>[1]
  ) => void
  addVenueBlacklist: (
    payload: Parameters<typeof createAddVenueBlacklistAction>[0]
  ) => void
  useContraband: (
    instanceId: Parameters<typeof createUseContrabandAction>[0],
    contrabandId: Parameters<typeof createUseContrabandAction>[1],
    memberId?: Parameters<typeof createUseContrabandAction>[2]
  ) => void
  clinicHeal: (payload: Parameters<typeof createClinicHealAction>[0]) => void
  clinicEnhance: (
    payload: Parameters<typeof createClinicEnhanceAction>[0]
  ) => void
  darkWebLeak: (payload: Parameters<typeof createDarkWebLeakAction>[0]) => void
  pirateBroadcast: (
    payload: Parameters<typeof createPirateBroadcastAction>[0]
  ) => void
  merchPress: (payload: Parameters<typeof createMerchPressAction>[0]) => void
  tradeVoidItem: (
    payload: Parameters<typeof createTradeVoidItemAction>[0]
  ) => void
  bloodBankDonate: (
    payload: Parameters<typeof createBloodBankDonateAction>[0]
  ) => void
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
  spawnRivalBand: () => void
  moveRivalBand: () => void
  checkRivalEncounter: () => void
  updateRivalBand: (patch: Partial<RivalBandState>) => void

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
  installModule: (input: Parameters<typeof installModuleAction>[0]) => void
  removeModule: (assetId: string, slotId: string) => void
  startCrowdfund: (input: Parameters<typeof startCrowdfundAction>[0]) => void
}

interface UseGameDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  state: GameState
  stateRef: MutableRefObject<GameState>
  tRef: MutableRefObject<TFunction>
  resetMapGenerationRetries: () => void
}

export function useGameDispatchActions({
  dispatch,
  state,
  stateRef,
  tRef,
  resetMapGenerationRetries
}: UseGameDispatchActionsProps): GameDispatchActions {
  /**
   * Transitions the game to a new scene.
   * @param {string} scene - The target scene name (e.g., GAME_PHASES.OVERWORLD).
   */
  const changeScene = useCallback(
    (scene: Parameters<typeof createChangeSceneAction>[0]) =>
      startTransition(() => dispatch(createChangeSceneAction(scene))),
    [dispatch]
  )

  const addToast = useCallback(
    (
      message: Parameters<typeof createAddToastAction>[0],
      type: Parameters<typeof createAddToastAction>[1] = 'info'
    ) => {
      const action = createAddToastAction(message, type)
      dispatch(action)
    },
    [dispatch]
  )

  const { deleteSave, saveGame, loadGame } = usePersistence({
    currentScene: state.currentScene,
    stateRef,
    dispatch,
    addToast,
    tRef
  })

  const { setActiveEvent, triggerEvent, resolveEvent } = useEventSystem({
    stateRef,
    dispatch,
    addToast,
    changeScene,
    saveGame,
    tRef
  })

  const updatePlayer = useCallback(
    (updates: UpdatePlayerPayload) =>
      dispatch(createUpdatePlayerAction(updates)),
    [dispatch]
  )

  const updateBand = useCallback(
    (updates: UpdateBandPayload) => dispatch(createUpdateBandAction(updates)),
    [dispatch]
  )

  const toggleNeuroDecimator = useCallback(
    (isActive: Parameters<typeof createToggleNeuroDecimatorAction>[0]) =>
      dispatch(createToggleNeuroDecimatorAction(isActive)),
    [dispatch]
  )

  const updateSocial = useCallback(
    (
      updates:
        | Partial<SocialState>
        | ((prev: SocialState) => Partial<SocialState>)
    ) => dispatch(createUpdateSocialAction(updates)),
    [dispatch]
  )

  const setGameMap = useCallback(
    (mapData: Parameters<typeof createSetMapAction>[0]) =>
      dispatch(createSetMapAction(mapData)),
    [dispatch]
  )

  const setCurrentGig = useCallback(
    (gig: Parameters<typeof createSetGigAction>[0]) =>
      dispatch(createSetGigAction(gig)),
    [dispatch]
  )

  const startGig = useCallback(
    (gig: Parameters<typeof createStartGigAction>[0]) =>
      startTransition(() => dispatch(createStartGigAction(gig))),
    [dispatch]
  )

  const setSetlist = useCallback(
    (list: Parameters<typeof createSetSetlistAction>[0]) =>
      dispatch(createSetSetlistAction(list)),
    [dispatch]
  )

  const setLastGigStats = useCallback(
    (stats: Parameters<typeof createSetLastGigStatsAction>[0]) =>
      dispatch(createSetLastGigStatsAction(stats)),
    [dispatch]
  )

  const removeToast = useCallback(
    (id: Parameters<typeof createRemoveToastAction>[0]) => {
      dispatch(createRemoveToastAction(id))
    },
    [dispatch]
  )

  const setGigModifiers = useCallback(
    (modifiers: Parameters<typeof createSetGigModifiersAction>[0]) =>
      dispatch(createSetGigModifiersAction(modifiers)),
    [dispatch]
  )

  const resetState = useCallback(() => {
    resetMapGenerationRetries()
    const unlocks: string[] =
      safeStorage('loadUnlocks', () => getUnlocks(), [] as string[]) ?? []
    dispatch(createResetStateAction({ unlocks }))
  }, [dispatch, resetMapGenerationRetries])

  const consumeItem = useCallback(
    (itemId: Parameters<typeof createConsumeItemAction>[0]) =>
      dispatch(createConsumeItemAction(itemId)),
    [dispatch]
  )

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

  const startTravelMinigame = useCallback(
    (payload: Parameters<typeof createStartTravelMinigameAction>[0]) =>
      startTransition(() => dispatch(createStartTravelMinigameAction(payload))),
    [dispatch]
  )

  const completeTravelMinigame = useCallback(
    (
      damageTaken: Parameters<typeof createCompleteTravelMinigameAction>[0],
      itemsCollected: Parameters<typeof createCompleteTravelMinigameAction>[1]
    ) => {
      const rngValue = secureRandom() as number
      dispatch(
        createCompleteTravelMinigameAction(
          damageTaken,
          itemsCollected,
          rngValue
        )
      )
    },
    [dispatch]
  )

  const startRoadieMinigame = useCallback(
    (payload: Parameters<typeof createStartRoadieMinigameAction>[0]) =>
      startTransition(() => dispatch(createStartRoadieMinigameAction(payload))),
    [dispatch]
  )

  const completeRoadieMinigame = useCallback(
    (
      equipmentDamage: Parameters<typeof createCompleteRoadieMinigameAction>[0],
      contrabandDelivered?: Parameters<
        typeof createCompleteRoadieMinigameAction
      >[1]
    ) =>
      dispatch(
        createCompleteRoadieMinigameAction(equipmentDamage, contrabandDelivered)
      ),
    [dispatch]
  )

  const startKabelsalatMinigame = useCallback(
    (payload: Parameters<typeof createStartKabelsalatMinigameAction>[0]) =>
      startTransition(() =>
        dispatch(createStartKabelsalatMinigameAction(payload))
      ),
    [dispatch]
  )

  const completeKabelsalatMinigame = useCallback(
    (payload: Parameters<typeof createCompleteKabelsalatMinigameAction>[0]) =>
      dispatch(createCompleteKabelsalatMinigameAction(payload)),
    [dispatch]
  )

  const startAmpCalibration = useCallback(
    (payload: Parameters<typeof createStartAmpCalibrationAction>[0]) =>
      startTransition(() => dispatch(createStartAmpCalibrationAction(payload))),
    [dispatch]
  )

  const completeAmpCalibration = useCallback(
    (
      score: Parameters<typeof createCompleteAmpCalibrationAction>[0],
      voidResonance: Parameters<
        typeof createCompleteAmpCalibrationAction
      >[1] = 0,
      purgesUsed: Parameters<typeof createCompleteAmpCalibrationAction>[2] = 0,
      hijacksOverridden: Parameters<
        typeof createCompleteAmpCalibrationAction
      >[3] = 0
    ) =>
      dispatch(
        createCompleteAmpCalibrationAction(
          score,
          voidResonance,
          purgesUsed,
          hijacksOverridden
        )
      ),
    [dispatch]
  )

  const unlockTrait = useCallback(
    (
      memberId: Parameters<typeof createUnlockTraitAction>[0],
      traitId: Parameters<typeof createUnlockTraitAction>[1]
    ) => dispatch(createUnlockTraitAction(memberId, traitId)),
    [dispatch]
  )

  const addQuest = useCallback(
    (payload: Parameters<typeof createAddQuestAction>[0]) =>
      dispatch(createAddQuestAction(payload)),
    [dispatch]
  )

  const advanceQuest = useCallback(
    (
      questId: Parameters<typeof createAdvanceQuestAction>[0],
      progressAmount: Parameters<typeof createAdvanceQuestAction>[1]
    ) => dispatch(createAdvanceQuestAction(questId, progressAmount)),
    [dispatch]
  )

  const addVenueBlacklist = useCallback(
    (payload: Parameters<typeof createAddVenueBlacklistAction>[0]) =>
      dispatch(createAddVenueBlacklistAction(payload)),
    [dispatch]
  )

  const useContraband = useCallback(
    (
      instanceId: Parameters<typeof createUseContrabandAction>[0],
      contrabandId: Parameters<typeof createUseContrabandAction>[1],
      memberId?: Parameters<typeof createUseContrabandAction>[2]
    ) =>
      dispatch(createUseContrabandAction(instanceId, contrabandId, memberId)),
    [dispatch]
  )

  const clinicHeal = useCallback(
    (payload: Parameters<typeof createClinicHealAction>[0]) =>
      dispatch(createClinicHealAction(payload)),
    [dispatch]
  )

  const clinicEnhance = useCallback(
    (payload: Parameters<typeof createClinicEnhanceAction>[0]) =>
      dispatch(createClinicEnhanceAction(payload)),
    [dispatch]
  )

  const pirateBroadcast = useCallback(
    (payload: Parameters<typeof createPirateBroadcastAction>[0]) =>
      dispatch(createPirateBroadcastAction(payload)),
    [dispatch]
  )

  const darkWebLeak = useCallback(
    (payload: Parameters<typeof createDarkWebLeakAction>[0]) =>
      dispatch(createDarkWebLeakAction(payload)),
    [dispatch]
  )

  const merchPress = useCallback(
    (payload: Parameters<typeof createMerchPressAction>[0]) =>
      dispatch(createMerchPressAction(payload)),
    [dispatch]
  )

  const tradeVoidItem = useCallback(
    (payload: Parameters<typeof createTradeVoidItemAction>[0]) =>
      dispatch(createTradeVoidItemAction(payload)),
    [dispatch]
  )

  const bloodBankDonate = useCallback(
    (payload: Parameters<typeof createBloodBankDonateAction>[0]) =>
      dispatch(createBloodBankDonateAction(payload)),
    [dispatch]
  )

  const spawnRivalBand = useCallback(
    () => dispatch(createSpawnRivalBandAction()),
    [dispatch]
  )

  const moveRivalBand = useCallback(
    () => dispatch(createMoveRivalBandAction()),
    [dispatch]
  )

  const checkRivalEncounter = useCallback(
    () => dispatch(createCheckRivalEncounterAction()),
    [dispatch]
  )

  const updateRivalBand = useCallback(
    (patch: Partial<RivalBandState>) =>
      dispatch(createUpdateRivalBandAction(patch)),
    [dispatch]
  )

  const setPendingBandHQOpen = useCallback(
    (isOpen: boolean) => dispatch(createSetPendingBandHQOpenAction(isOpen)),
    [dispatch]
  )

  const setPendingSupplyStopInventory = useCallback(
    (inventory: GameState['pendingSupplyStopInventory']) =>
      dispatch(createSetPendingSupplyStopInventoryAction(inventory)),
    [dispatch]
  )

  const dismissForeclosureNotice = useCallback(
    (kind: Parameters<typeof dismissForeclosureNoticeAction>[0]) =>
      dispatch(dismissForeclosureNoticeAction(kind)),
    [dispatch]
  )

  const setPendingRiskEvent = useCallback(
    (event: Parameters<typeof createSetPendingRiskEventAction>[0]) =>
      dispatch(createSetPendingRiskEventAction(event)),
    [dispatch]
  )

  const endGig = useCallback(() => {
    const currentState = stateRef.current
    if (currentState.currentGig?.isPractice) {
      addToast(tRef.current('ui:gig.practiceComplete'), 'success')
      const rawTarget = currentState.currentGig.sourceScene
      const isValidTarget =
        rawTarget !== undefined &&
        PRACTICE_RETURN_SCENES.has(rawTarget as GamePhase)
      const targetScene = isValidTarget ? rawTarget : GAME_PHASES.OVERWORLD
      setPendingBandHQOpen(true)
      changeScene(targetScene as GamePhase)
    } else {
      changeScene(GAME_PHASES.POST_GIG)
    }
  }, [addToast, changeScene, setPendingBandHQOpen, stateRef, tRef])

  const updateSettings = useCallback(
    (updates: Record<string, unknown>) => {
      dispatch(createUpdateSettingsAction(updates))

      if (updates.logLevel !== undefined) {
        const numericLogLevel = Number(updates.logLevel)
        if (isValidLogLevel(numericLogLevel)) {
          logger.setLevel(numericLogLevel)
        } else {
          logger.warn(
            'GameState',
            'Rejected persisted invalid logLevel update',
            updates.logLevel
          )
        }
      }

      safeStorageNoFallback('saveGlobalSettings', () => {
        const current = safeJsonParse(
          localStorage.getItem('neurotoxic_global_settings') || '{}'
        )
        const next = isLooseRecord(current)
          ? { ...current, ...updates }
          : { ...updates }
        localStorage.setItem('neurotoxic_global_settings', JSON.stringify(next))
      })
    },
    [dispatch]
  )

  // Asset dispatch wrappers — each reads the current state via stateRef so
  // the snapshot used for validation matches the one the reducer sees.
  const purchaseChassis = useCallback(
    (input: Parameters<typeof purchaseChassisAction>[0]) => {
      dispatch(purchaseChassisAction(input, stateRef.current))
    },
    [dispatch, stateRef]
  )
  const upgradeChassisTier = useCallback(
    (assetId: string, targetTier: import('../types/assets').ChassisTier) => {
      const action = upgradeChassisTierAction(
        assetId,
        targetTier,
        stateRef.current
      )
      if (action) dispatch(action)
    },
    [dispatch, stateRef]
  )
  const sellChassis = useCallback(
    (assetId: string) => {
      dispatch(sellChassisAction(assetId))
    },
    [dispatch]
  )
  const repairChassis = useCallback(
    (assetId: string) => {
      const action = repairChassisAction(assetId, stateRef.current)
      if (action) dispatch(action)
    },
    [dispatch, stateRef]
  )
  const installModule = useCallback(
    (input: Parameters<typeof installModuleAction>[0]) => {
      dispatch(installModuleAction(input, stateRef.current))
    },
    [dispatch, stateRef]
  )
  const removeModule = useCallback(
    (assetId: string, slotId: string) => {
      dispatch(removeModuleAction(assetId, slotId))
    },
    [dispatch]
  )
  const startCrowdfund = useCallback(
    (input: Parameters<typeof startCrowdfundAction>[0]) => {
      const action = startCrowdfundAction(input, stateRef.current)
      if (action) dispatch(action)
    },
    [dispatch, stateRef]
  )

  return useMemo(
    () => ({
      changeScene,
      updatePlayer,
      updateBand,
      toggleNeuroDecimator,
      updateSocial,
      setGameMap,
      setCurrentGig,
      startGig,
      setSetlist,
      setLastGigStats,
      setActiveEvent,
      triggerEvent,
      resolveEvent,
      addToast,
      removeToast,
      setGigModifiers,
      consumeItem,
      advanceDay,
      saveGame,
      loadGame,
      deleteSave,
      resetState,
      updateSettings,
      startTravelMinigame,
      completeTravelMinigame,
      startRoadieMinigame,
      completeRoadieMinigame,
      startKabelsalatMinigame,
      completeKabelsalatMinigame,
      startAmpCalibration,
      completeAmpCalibration,
      unlockTrait,
      endGig,
      addQuest,
      advanceQuest,
      addVenueBlacklist,
      useContraband,
      clinicHeal,
      clinicEnhance,
      pirateBroadcast,
      darkWebLeak,
      merchPress,
      tradeVoidItem,
      bloodBankDonate,
      spawnRivalBand,
      moveRivalBand,
      checkRivalEncounter,
      updateRivalBand,
      setPendingBandHQOpen,
      setPendingSupplyStopInventory,
      dismissForeclosureNotice,
      setPendingRiskEvent,
      purchaseChassis,
      upgradeChassisTier,
      sellChassis,
      repairChassis,
      installModule,
      removeModule,
      startCrowdfund
    }),
    [
      changeScene,
      updatePlayer,
      updateBand,
      toggleNeuroDecimator,
      updateSocial,
      setGameMap,
      setCurrentGig,
      startGig,
      setSetlist,
      setLastGigStats,
      setActiveEvent,
      triggerEvent,
      resolveEvent,
      addToast,
      removeToast,
      setGigModifiers,
      consumeItem,
      advanceDay,
      saveGame,
      loadGame,
      deleteSave,
      resetState,
      updateSettings,
      startTravelMinigame,
      completeTravelMinigame,
      startRoadieMinigame,
      completeRoadieMinigame,
      startKabelsalatMinigame,
      completeKabelsalatMinigame,
      startAmpCalibration,
      completeAmpCalibration,
      unlockTrait,
      endGig,
      addQuest,
      advanceQuest,
      addVenueBlacklist,
      useContraband,
      clinicHeal,
      clinicEnhance,
      pirateBroadcast,
      darkWebLeak,
      merchPress,
      tradeVoidItem,
      bloodBankDonate,
      spawnRivalBand,
      moveRivalBand,
      checkRivalEncounter,
      updateRivalBand,
      setPendingBandHQOpen,
      setPendingSupplyStopInventory,
      dismissForeclosureNotice,
      setPendingRiskEvent,
      purchaseChassis,
      upgradeChassisTier,
      sellChassis,
      repairChassis,
      installModule,
      removeModule,
      startCrowdfund
    ]
  )
}
