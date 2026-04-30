import {
  type Context,
  type ReactNode,
  createContext,
  use,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  startTransition
} from 'react'
import { useTranslation } from 'react-i18next'
import { logger, LOG_LEVELS } from '../utils/logger'
import { getSafeUUID, secureRandom } from '../utils/crypto'
import { pickRandomContraband } from '../utils/contrabandUtils'
import { handleError, StateError } from '../utils/errorHandler'
import { getUnlocks } from '../utils/unlockManager'
import { hasUpgrade as checkUpgrade } from '../utils/upgradeUtils'
import { useLeaderboardSync } from '../hooks/useLeaderboardSync'

// Import modular state management
import { createInitialState } from './initialState'
import { GAME_PHASES } from './gameConstants'
import { gameReducer } from './gameReducer'
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
  createAdvanceDayAction,
  createStartTravelMinigameAction,
  createCompleteTravelMinigameAction,
  createStartRoadieMinigameAction,
  createCompleteRoadieMinigameAction,
  createStartKabelsalatMinigameAction,
  createCompleteKabelsalatMinigameAction,
  createStartAmpCalibrationAction,
  createCompleteAmpCalibrationAction,
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
  createSetPendingBandHQOpenAction
} from './actionCreators'
import type {
  BloodBankDonatePayload,
  ClinicActionPayload,
  GamePhase,
  GameState,
  MerchPressPayload,
  PirateBroadcastPayload,
  DarkWebLeakPayload,
  SocialState,
  TradeVoidItemPayload,
  UpdateBandPayload,
  UpdatePlayerPayload
} from '../types/game'
import { useEventSystem } from './useEventSystem'
import { useMapGeneration } from './useMapGeneration'
import {
  SAVE_KEY,
  safeStorage,
  safeStorageNoFallback,
  usePersistence
} from './usePersistence'

const PRACTICE_RETURN_SCENES = new Set<GamePhase>([
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.MENU
])

declare global {
  interface Window {
    gameState?: unknown
  }
}

type GameDispatchActions = {
  changeScene: (scene: Parameters<typeof createChangeSceneAction>[0]) => void
  updatePlayer: (
    updates: Parameters<typeof createUpdatePlayerAction>[0]
  ) => void
  updateBand: (updates: Parameters<typeof createUpdateBandAction>[0]) => void
  updateSocial: (
    updates: Parameters<typeof createUpdateSocialAction>[0]
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
    payload: Parameters<typeof createCompleteRoadieMinigameAction>[0]
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
    payload: Parameters<typeof createCompleteAmpCalibrationAction>[0]
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
}

/**
 * @deprecated Prefer `useGameSelector` for state reads and `useGameActions`
 * for dispatch-only access. This combined shape subscribes consumers to the
 * full game state and should remain only for legacy call sites.
 */
export type GameStateWithActions = GameState &
  GameDispatchActions & {
    hasUpgrade: (upgradeId: string) => boolean
  }

type HotGameStateContextStore = typeof globalThis & {
  __NEUROTOXIC_GAME_STATE_CONTEXT__?: Context<GameState | null>
  __NEUROTOXIC_GAME_DISPATCH_CONTEXT__?: Context<GameDispatchActions | null>
}

const getStableGameStateContext = (): Context<GameState | null> => {
  const store = globalThis as HotGameStateContextStore
  if (!store.__NEUROTOXIC_GAME_STATE_CONTEXT__) {
    store.__NEUROTOXIC_GAME_STATE_CONTEXT__ = createContext<GameState | null>(
      null
    )
  }
  return store.__NEUROTOXIC_GAME_STATE_CONTEXT__
}

const getStableGameDispatchContext =
  (): Context<GameDispatchActions | null> => {
    const store = globalThis as HotGameStateContextStore
    if (!store.__NEUROTOXIC_GAME_DISPATCH_CONTEXT__) {
      store.__NEUROTOXIC_GAME_DISPATCH_CONTEXT__ =
        createContext<GameDispatchActions | null>(null)
    }
    return store.__NEUROTOXIC_GAME_DISPATCH_CONTEXT__
  }

const GameStateContext = getStableGameStateContext()
const GameDispatchContext = getStableGameDispatchContext()

function useRequiredContext<T>(context: Context<T | null>, name: string): T {
  const value = use(context)
  if (value === null) {
    throw new Error(`${name} must be used within GameStateProvider`)
  }
  return value
}

/**
 * Global State Provider covering Player, Band, Inventory, and Scene Management.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export const GameStateProvider = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  // Lazy initialization of state to ensure fresh data fetch on mount
  const initGameState = (): GameState => {
    const unlocks =
      safeStorage('loadUnlocks', () => getUnlocks(), [] as string[]) ?? []
    const freshState = createInitialState({ unlocks })

    // Check for test-injected state (screenshot testing).
    // A special marker key signals the state was placed by the screenshot
    // injection script and should be hydrated on mount.  Normal player
    // saves are loaded explicitly via the MENU → "Load Game" button.
    const shouldHydrate = safeStorage(
      'checkInjectMarker',
      () => localStorage.getItem('neurotoxic_inject_marker') === 'true',
      false
    )

    if (shouldHydrate) {
      // NOTE: Do NOT remove the marker here.  React StrictMode double-invokes
      // lazy initialisers in dev, so removing it on the first call would cause
      // the second (authoritative) call to miss the marker and return INTRO.
      // The marker is cleaned up in a useEffect after mount instead.

      const savedGame = safeStorage(
        'loadInjectedState',
        () => {
          const saved = localStorage.getItem(SAVE_KEY)
          return saved ? (JSON.parse(saved) as Partial<GameState>) : null
        },
        null as Partial<GameState> | null
      )

      if (savedGame && savedGame.version !== undefined) {
        try {
          // Merge strategy: freshState spreads first (all defaults), then savedGame
          // overrides its fields. Incomplete fixtures (e.g. screenshot test stubs)
          // safely fall back to fresh defaults for any field they omit.
          // toasts/minigame/isScreenshotMode are re-asserted explicitly because
          // createPersistedState omits them — savedGame may lack these keys entirely.
          return {
            ...freshState,
            ...savedGame,
            // Always ensure these critical fields are valid (never undefined)
            toasts: savedGame.toasts ?? freshState.toasts,
            minigame: savedGame.minigame ?? freshState.minigame,
            unlocks,
            // isScreenshotMode flag is used by scenes to suppress random events
            isScreenshotMode:
              savedGame.isScreenshotMode ?? freshState.isScreenshotMode
          } as GameState
        } catch (err) {
          logger.error('GameState', 'Failed to hydrate injected state', err)
        }
      }
    }

    return freshState
  }

  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState)

  // Clean up injection marker after mount (deferred from initGameState to
  // survive React StrictMode's double-invocation of lazy initialisers).
  useEffect(() => {
    safeStorageNoFallback('removeInjectMarker', () =>
      localStorage.removeItem('neurotoxic_inject_marker')
    )

    // Also clean up on page unload to prevent marker persistence if test crashes
    const handleUnload = () => {
      safeStorageNoFallback('removeInjectMarkerOnUnload', () =>
        localStorage.removeItem('neurotoxic_inject_marker')
      )
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Leaderboard Sync Hook
  useLeaderboardSync(state)

  // Use a ref to access the latest state in actions without creating a dependency loop
  // This allows actions to be stable (memoized once) while still accessing current state.
  const stateRef = useRef(state)
  stateRef.current = state
  const { resetMapGenerationRetries } = useMapGeneration({
    gameMap: state.gameMap,
    dispatch,
    tRef
  })

  // Sync Logger with settings on load/change
  useEffect(() => {
    if (state.settings?.logLevel !== undefined) {
      const numericLogLevel = Number(state.settings.logLevel)
      if (
        Number.isFinite(numericLogLevel) &&
        Number.isInteger(numericLogLevel) &&
        numericLogLevel >= LOG_LEVELS.DEBUG &&
        numericLogLevel <= LOG_LEVELS.NONE
      ) {
        logger.setLevel(numericLogLevel)
      } else {
        logger.warn(
          'GameState',
          'Rejected persisted invalid logLevel from settings',
          state.settings.logLevel
        )
      }
    }
  }, [state.settings?.logLevel])

  // Actions wrappers using ActionTypes for type safety

  /**
   * Transitions the game to a different scene.
   * @param {string} scene - The target scene name (e.g., GAME_PHASES.OVERWORLD).
   */
  const changeScene = useCallback(
    (scene: Parameters<typeof createChangeSceneAction>[0]) =>
      startTransition(() => dispatch(createChangeSceneAction(scene))),
    []
  )

  /**
   * Updates player state properties (money, fame, etc.).
   * @param {object|Function} updates - Object containing keys to update or updater function(prev).
   */
  const updatePlayer = useCallback(
    (updates: UpdatePlayerPayload) =>
      dispatch(createUpdatePlayerAction(updates)),
    []
  )

  /**
   * Updates band state properties (members, harmony, inventory).
   * @param {object|Function} updates - Object containing keys to update or updater function(prev).
   */
  const updateBand = useCallback(
    (updates: UpdateBandPayload) => dispatch(createUpdateBandAction(updates)),
    []
  )

  /**
   * Updates social media metrics.
   * @param {object|Function} updates - Object containing keys to update or updater function(prev).
   */
  const updateSocial = useCallback(
    (
      updates:
        | Partial<SocialState>
        | ((prev: SocialState) => Partial<SocialState>)
    ) => dispatch(createUpdateSocialAction(updates)),
    []
  )

  /**
   * Updates global settings.
   * @param {object} updates - Object containing keys to update.
   */
  const updateSettings = useCallback((updates: Record<string, unknown>) => {
    dispatch(createUpdateSettingsAction(updates))

    // Synchronize logger if logLevel is updated
    if (updates.logLevel !== undefined) {
      const numericLogLevel = Number(updates.logLevel)
      if (
        Number.isFinite(numericLogLevel) &&
        Number.isInteger(numericLogLevel) &&
        numericLogLevel >= LOG_LEVELS.DEBUG &&
        numericLogLevel <= LOG_LEVELS.NONE
      ) {
        logger.setLevel(numericLogLevel)
      } else {
        logger.warn(
          'GameState',
          'Rejected persisted invalid logLevel update',
          updates.logLevel
        )
      }
    }

    // Persist to global settings (persist across new games)
    safeStorageNoFallback('saveGlobalSettings', () => {
      const current = JSON.parse(
        localStorage.getItem('neurotoxic_global_settings') || '{}'
      )
      const next = { ...current, ...updates }
      localStorage.setItem('neurotoxic_global_settings', JSON.stringify(next))
    })
  }, [])

  /**
   * Sets the generated game map.
   * @param {object} map - The map object.
   */
  const setGameMap = useCallback(
    (map: Parameters<typeof createSetMapAction>[0]) =>
      dispatch(createSetMapAction(map)),
    []
  )

  /**
   * Sets the current gig data context.
   * @param {object} gig - The gig data object.
   */
  const setCurrentGig = useCallback(
    (gig: Parameters<typeof createSetGigAction>[0]) =>
      dispatch(createSetGigAction(gig)),
    []
  )

  /**
   * Initiates the gig sequence.
   * @param {object} venue - The venue object.
   */
  const startGig = useCallback(
    (venue: Parameters<typeof createStartGigAction>[0]) =>
      startTransition(() => dispatch(createStartGigAction(venue))),
    []
  )

  /**
   * Updates the active setlist.
   * @param {Array} list - Array of song objects or IDs.
   */
  const setSetlist = useCallback(
    (list: Parameters<typeof createSetSetlistAction>[0]) =>
      dispatch(createSetSetlistAction(list)),
    []
  )

  /**
   * Stores the statistics from the last played gig.
   * @param {object} stats - The stats object.
   */
  const setLastGigStats = useCallback(
    (stats: Parameters<typeof createSetLastGigStatsAction>[0]) =>
      dispatch(createSetLastGigStatsAction(stats)),
    []
  )

  /**
   * Updates gig modifiers (toggles like catering, promo).
   * @param {object|Function} payload - The new modifiers or an updater function.
   */
  const setGigModifiers = useCallback(
    (payload: Parameters<typeof createSetGigModifiersAction>[0]) =>
      dispatch(createSetGigModifiersAction(payload)),
    []
  )

  /**
   * Adds a toast notification.
   * @param {string|Object} messageOrPayload - Plain message or structured toast payload.
   * @param {string} [type='info'] - Type of toast (info, success, error, warning).
   */
  const addToast = useCallback(
    (
      messageOrPayload: Parameters<typeof createAddToastAction>[0],
      type: Parameters<typeof createAddToastAction>[1] = 'info'
    ) => {
      const action = createAddToastAction(messageOrPayload, type)
      dispatch(action)
    },
    []
  )

  const removeToast = useCallback(
    (id: Parameters<typeof createRemoveToastAction>[0]) => {
      dispatch(createRemoveToastAction(id))
    },
    []
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

  /**
   * Consumes a consumable item from band inventory.
   * @param {string} itemType - The item key (e.g., 'strings').
   */
  const consumeItem = useCallback(
    (itemType: Parameters<typeof createConsumeItemAction>[0]) =>
      dispatch(createConsumeItemAction(itemType)),
    []
  )

  /**
   * Uses a contraband item.
   * @param {string} instanceId - The unique instance ID of the contraband item.
   * @param {string} contrabandId - The ID of the contraband item.
   * @param {string} [memberId] - Optional. The ID of the band member.
   */
  const useContraband = useCallback(
    (
      instanceId: Parameters<typeof createUseContrabandAction>[0],
      contrabandId: Parameters<typeof createUseContrabandAction>[1],
      memberId?: Parameters<typeof createUseContrabandAction>[2]
    ) =>
      dispatch(createUseContrabandAction(instanceId, contrabandId, memberId)),
    []
  )

  /**
   * Advances the game day, deducting living costs and updating simulations.
   */
  const advanceDay = useCallback(() => {
    // Access state via ref to keep callback stable
    const currentState = stateRef.current
    const nextDay = currentState.player.day + 1
    try {
      dispatch(createAdvanceDayAction())
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
  }, [addToast])

  /**
   * Resets the game state to initial values.
   */
  const resetState = useCallback(() => {
    resetMapGenerationRetries()
    const unlocks: string[] =
      safeStorage('loadUnlocks', () => getUnlocks(), [] as string[]) ?? []
    dispatch(createResetStateAction({ unlocks }))
  }, [resetMapGenerationRetries])

  // Minigame Actions
  const startTravelMinigame = useCallback(
    (targetNodeId: Parameters<typeof createStartTravelMinigameAction>[0]) =>
      startTransition(() =>
        dispatch(createStartTravelMinigameAction(targetNodeId))
      ),
    []
  )

  const completeTravelMinigame = useCallback(
    (
      damageTaken: Parameters<typeof createCompleteTravelMinigameAction>[0],
      itemsCollected: Parameters<typeof createCompleteTravelMinigameAction>[1]
    ) => {
      const rngValue = secureRandom() as number
      const contrabandId = pickRandomContraband(secureRandom)
      const instanceId = getSafeUUID()
      dispatch(
        createCompleteTravelMinigameAction(
          damageTaken,
          itemsCollected,
          rngValue,
          contrabandId ?? undefined,
          instanceId
        )
      )
    },
    []
  )

  const startRoadieMinigame = useCallback(
    (gigId: Parameters<typeof createStartRoadieMinigameAction>[0]) =>
      startTransition(() => dispatch(createStartRoadieMinigameAction(gigId))),
    []
  )

  const completeRoadieMinigame = useCallback(
    (
      equipmentDamage: Parameters<typeof createCompleteRoadieMinigameAction>[0]
    ) => dispatch(createCompleteRoadieMinigameAction(equipmentDamage)),
    []
  )

  const startKabelsalatMinigame = useCallback(
    (gigId: Parameters<typeof createStartKabelsalatMinigameAction>[0]) =>
      startTransition(() =>
        dispatch(createStartKabelsalatMinigameAction(gigId))
      ),
    []
  )

  const completeKabelsalatMinigame = useCallback(
    (results: Parameters<typeof createCompleteKabelsalatMinigameAction>[0]) =>
      dispatch(createCompleteKabelsalatMinigameAction(results)),
    []
  )

  const startAmpCalibration = useCallback(
    (gigId: Parameters<typeof createStartAmpCalibrationAction>[0]) =>
      startTransition(() => dispatch(createStartAmpCalibrationAction(gigId))),
    []
  )

  const completeAmpCalibration = useCallback(
    (score: Parameters<typeof createCompleteAmpCalibrationAction>[0]) =>
      dispatch(createCompleteAmpCalibrationAction(score)),
    []
  )

  const unlockTrait = useCallback(
    (
      memberId: Parameters<typeof createUnlockTraitAction>[0],
      traitId: Parameters<typeof createUnlockTraitAction>[1]
    ) => dispatch(createUnlockTraitAction(memberId, traitId)),
    []
  )

  const addQuest = useCallback(
    (quest: Parameters<typeof createAddQuestAction>[0]) =>
      dispatch(createAddQuestAction(quest)),
    []
  )

  const advanceQuest = useCallback(
    (
      questId: Parameters<typeof createAdvanceQuestAction>[0],
      progressAmount: Parameters<typeof createAdvanceQuestAction>[1]
    ) => dispatch(createAdvanceQuestAction(questId, progressAmount)),
    []
  )

  const addVenueBlacklist = useCallback(
    (venueId: Parameters<typeof createAddVenueBlacklistAction>[0]) =>
      dispatch(createAddVenueBlacklistAction(venueId)),
    []
  )

  /**
   * Dispatches a clinic heal action.
   * @param {object} payload - The heal action payload.
   */
  const clinicHeal = useCallback(
    (payload: ClinicActionPayload) => dispatch(createClinicHealAction(payload)),
    []
  )

  /**
   * Dispatches a clinic enhance action.
   * @param {object} payload - The enhance action payload.
   */
  const clinicEnhance = useCallback(
    (payload: ClinicActionPayload) =>
      dispatch(createClinicEnhanceAction(payload)),
    []
  )

  /**
   * Dispatches a dark web leak action.
   * @param {object} payload - The leak payload.
   */
  const darkWebLeak = useCallback(
    (payload: DarkWebLeakPayload) => dispatch(createDarkWebLeakAction(payload)),
    []
  )

  const pirateBroadcast = useCallback(
    (payload: PirateBroadcastPayload) =>
      dispatch(createPirateBroadcastAction(payload)),
    []
  )

  /**
   * Dispatches a merch press action.
   * @param {object} payload - The merch press payload.
   */
  const merchPress = useCallback(
    (payload: MerchPressPayload) => dispatch(createMerchPressAction(payload)),
    []
  )

  /**
   * Dispatches a void trader item purchase action.
   * @param {object} payload - The void trade payload.
   */
  const tradeVoidItem = useCallback(
    (payload: TradeVoidItemPayload) =>
      dispatch(createTradeVoidItemAction(payload)),
    []
  )

  /**
   * Dispatches a blood bank donation action.
   * @param {object} payload - The blood bank donation payload.
   */
  const bloodBankDonate = useCallback(
    (payload: BloodBankDonatePayload) =>
      dispatch(createBloodBankDonateAction(payload)),
    []
  )

  /**
   * Completes the current gig and transitions to the appropriate post-gig scene.
   * Handles Practice Mode logic (redirects to OVERWORLD instead of POSTGIG).
   */
  const setPendingBandHQOpen = useCallback(
    (isOpen: boolean) => dispatch(createSetPendingBandHQOpenAction(isOpen)),
    []
  )

  const endGig = useCallback(() => {
    const currentState = stateRef.current
    if (currentState.currentGig?.isPractice) {
      addToast(tRef.current('ui:gig.practiceComplete'), 'success')
      const rawTarget = currentState.currentGig.sourceScene
      const isValidTarget =
        rawTarget !== undefined && PRACTICE_RETURN_SCENES.has(rawTarget)
      const targetScene = isValidTarget ? rawTarget : GAME_PHASES.OVERWORLD
      setPendingBandHQOpen(true)
      changeScene(targetScene)
    } else {
      changeScene(GAME_PHASES.POST_GIG)
    }
  }, [addToast, changeScene, setPendingBandHQOpen])

  const dispatchValue = useMemo(
    () => ({
      changeScene,
      updatePlayer,
      updateBand,
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
      // hasUpgrade is intentionally removed from dispatchValue to avoid stale reads
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
      darkWebLeak,
      pirateBroadcast,
      merchPress,
      tradeVoidItem,
      bloodBankDonate,
      setPendingBandHQOpen
    }),
    [
      changeScene,
      updatePlayer,
      updateBand,
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
      darkWebLeak,
      pirateBroadcast,
      merchPress,
      tradeVoidItem,
      bloodBankDonate,
      setPendingBandHQOpen
    ]
  )

  // Expose state to window for debugging/testing
  const dispatchValueRef = useRef(dispatchValue)
  dispatchValueRef.current = dispatchValue

  useEffect(() => {
    // Safely check for DEV environment to avoid crashes in test runners that don't polyfill import.meta.env
    const isDev =
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as Record<string, unknown>).env &&
      (
        (import.meta as unknown as Record<string, unknown>).env as Record<
          string,
          unknown
        >
      ).DEV
    if (isDev) {
      Object.defineProperty(window, 'gameState', {
        configurable: true,
        get: () => ({ ...stateRef.current, ...dispatchValueRef.current })
      })
    }
    return () => {
      delete window.gameState
    }
  }, [])

  return (
    <GameDispatchContext value={dispatchValue}>
      <GameStateContext value={state}>{children}</GameStateContext>
    </GameDispatchContext>
  )
}

/**
 * Hook to access the global game dispatch functions only (stable reference).
 *
 * @returns {object} The action dispatchers.
 */
export const useGameDispatch = () => {
  return useRequiredContext(GameDispatchContext, 'useGameDispatch')
}

/**
 * Hook to access stable game actions only.
 * This is the preferred action surface for new code.
 *
 * @returns {object} The action dispatchers.
 */
export const useGameActions = () => {
  return useRequiredContext(GameDispatchContext, 'useGameActions')
}

/**
 * Hook to select a specific state slice.
 * This is the preferred state surface for new code.
 * Note: Re-renders are still triggered by any context update; for
 * equality-based bail-out, memoize the consuming component with React.memo.
 *
 * @template T
 * @param {(state: GameState) => T} selector - State selector.
 * @returns {T} Selected state slice.
 */
export function useGameSelector<T>(selector: (state: GameState) => T): T {
  const state = useRequiredContext(GameStateContext, 'useGameSelector')
  return selector(state)
}

/**
 * Legacy hook to access the full game state plus action dispatchers.
 *
 * @deprecated Use `useGameSelector(selector)` for state reads and
 * `useGameActions()` for stable action dispatchers. Calling this hook
 * subscribes the consumer to the entire GameState context, so action-only
 * consumers re-render on every state change.
 *
 * @returns {object} The game state and action dispatchers.
 */
export const useGameState = (): GameStateWithActions => {
  const state = useRequiredContext(GameStateContext, 'useGameState')
  const actions = useGameActions()

  /**
   * Checks if the player owns a specific van upgrade.
   * Delegates to the pure utility in upgradeUtils.js for testability.
   * @param {string} upgradeId - The ID of the upgrade.
   * @returns {boolean} True if owned.
   */
  const hasUpgrade = useCallback(
    (upgradeId: string) => checkUpgrade(state.player.van.upgrades, upgradeId),
    [state.player.van.upgrades]
  )

  const merged = useMemo(
    () => ({ ...state, ...actions, hasUpgrade }),
    [state, actions, hasUpgrade]
  )

  return merged
}
