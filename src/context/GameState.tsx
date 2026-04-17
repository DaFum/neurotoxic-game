// TODO: Review this file
import { getSafeUUID } from '../utils/crypto'
import {
  type Dispatch,
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
import { eventEngine, resolveEventChoice } from '../utils/eventEngine'
import { MapGenerator } from '../utils/mapGenerator'
import { logger } from '../utils/logger'
import { secureRandom } from '../utils/crypto'
import { pickRandomContraband } from '../utils/contrabandUtils'
import {
  handleError,
  StorageError,
  StateError,
  safeStorageOperation
} from '../utils/errorHandler'
import { validateSaveData } from '../utils/saveValidator'
import { addUnlock, getUnlocks } from '../utils/unlockManager'
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
  createLoadGameAction,
  createResetStateAction,
  createApplyEventDeltaAction,
  createPopPendingEventAction,
  createConsumeItemAction,
  createAdvanceDayAction,
  createAddCooldownAction,
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
  createAddUnlockAction,
  createUseContrabandAction,
  createClinicHealAction,
  createClinicEnhanceAction,
  createPirateBroadcastAction,
  createMerchPressAction,
  createTradeVoidItemAction,
  createBloodBankDonateAction,
  createAddVenueBlacklistAction
} from './actionCreators'
import type {
  BloodBankDonatePayload,
  ClinicActionPayload,
  GameAction,
  GameState,
  MerchPressPayload,
  PirateBroadcastPayload,
  SocialState,
  ToastPayload,
  TradeVoidItemPayload,
  UpdateBandPayload,
  UpdatePlayerPayload
} from '../types/game'

declare global {
  interface Window {
    gameState?: unknown
  }
}

type GameDispatchContextValue = Record<string, unknown>
type EventResolution = {
  result?: unknown
  delta?: {
    flags?: {
      addQuest?: unknown
      unlock?: unknown
      gameOver?: unknown
    }
    [key: string]: unknown
  }
  outcomeText?: string
  description?: string
}

const GameStateContext = createContext<GameState | null>(null)
const GameDispatchContext = createContext<GameDispatchContextValue | null>(null)
const SAVE_KEY = 'neurotoxic_v3_save'
const normalizeSetlistForSave = (setlist: unknown): Array<{ id: string }> => {
  if (!Array.isArray(setlist)) return []

  return setlist
    .map(song => {
      if (typeof song === 'string') {
        return { id: song }
      }
      if (
        song &&
        typeof song === 'object' &&
        'id' in song &&
        typeof (song as { id?: unknown }).id === 'string'
      ) {
        return { id: (song as { id: string }).id }
      }
      return null
    })
    .filter((value): value is { id: string } => value !== null)
}

const createPersistedState = (currentState: GameState) => {
  const {
    version,
    currentScene,
    player,
    band,
    social,
    gameMap,
    currentGig,
    lastGigStats,
    activeEvent,
    activeStoryFlags,
    eventCooldowns,
    pendingEvents,
    venueBlacklist,
    activeQuests,
    reputationByRegion,
    settings,
    npcs,
    gigModifiers,
    setlist
  } = currentState

  return {
    version,
    timestamp: Date.now(),
    currentScene,
    player,
    band,
    social,
    gameMap,
    currentGig,
    lastGigStats,
    activeEvent,
    activeStoryFlags,
    eventCooldowns,
    pendingEvents,
    venueBlacklist,
    activeQuests,
    reputationByRegion,
    settings,
    npcs,
    gigModifiers,
    setlist: normalizeSetlistForSave(setlist)
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const processAddQuests = (
  quests: unknown,
  currentDay: number,
  dispatch: Dispatch<GameAction>
) => {
  if (!Array.isArray(quests)) return

  quests.forEach(q => {
    // Parse relative deadlines
    const questToAdd = { ...(q as Record<string, unknown>) }
    if (questToAdd.deadlineOffset) {
      questToAdd.deadline = currentDay + Number(questToAdd.deadlineOffset || 0)
      delete questToAdd.deadlineOffset
    }
    dispatch(createAddQuestAction(questToAdd))
  })
}

function safeStorage<T>(operation: string, fn: () => T, fallbackValue: T): T {
  return (
    safeStorageOperation as unknown as (
      op: string,
      exec: () => T,
      fallback: T
    ) => T
  )(operation, fn, fallbackValue)
}

function safeStorageNoFallback<T>(operation: string, fn: () => T): T {
  return (safeStorageOperation as unknown as (op: string, exec: () => T) => T)(
    operation,
    fn
  )
}

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
      safeStorage('loadUnlocks', () => getUnlocks(), [] as string[]) || []
    const freshState = createInitialState({ unlocks }) as unknown as GameState

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

  // Initialize Map if needed
  useEffect(() => {
    if (!state.gameMap) {
      const generator = new MapGenerator(Date.now())
      const newMap = generator.generateMap()
      dispatch(createSetMapAction(newMap))
    }
  }, [state.gameMap, dispatch])

  // Sync Logger with settings on load/change
  useEffect(() => {
    if (state.settings?.logLevel !== undefined) {
      logger.setLevel(state.settings.logLevel)
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
    (updates: Partial<SocialState>) =>
      dispatch(createUpdateSocialAction(updates)),
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
      logger.setLevel(updates.logLevel)
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
   * Sets the currently active event (blocking modal).
   * @param {object} event - The event object or null.
   */
  const setActiveEvent = useCallback(
    (event: Parameters<typeof createSetActiveEventAction>[0]) =>
      dispatch(createSetActiveEventAction(event)),
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
    dispatch(createAdvanceDayAction())
    addToast(tRef.current('ui:day_advance', { day: nextDay }), 'info')
  }, [addToast])

  /**
   * Resets the game state to initial values.
   */
  const resetState = useCallback(() => {
    const unlocks =
      safeStorage('loadUnlocks', () => getUnlocks(), [] as string[]) || []
    dispatch(createResetStateAction({ unlocks }))
  }, [])

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
          contrabandId,
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
   * Dispatches a pirate broadcast action.
   * @param {object} payload - The broadcast payload.
   */
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

  // Persistence
  /**
   * Deletes the save file and reloads the application.
   */
  const deleteSave = useCallback(() => {
    safeStorageNoFallback('deleteSave', () => {
      localStorage.removeItem(SAVE_KEY)
    })
    // No need to changeScene as location.reload will wipe state anyway
    window.location.reload()
  }, [])

  /**
   * Persists the current state to localStorage.
   */
  const saveGame = useCallback(
    (showToast = true) => {
      const saveData = createPersistedState(stateRef.current)

      const success = safeStorage(
        'saveGame',
        () => {
          localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
          return true
        },
        false
      )

      if (success) {
        if (showToast) {
          addToast(tRef.current('ui:toast.gameSaved'), 'success')
        }
        logger.info('System', 'Game Saved Successfully', null)
      } else {
        handleError(new StorageError('Failed to save game'), { addToast })
      }
    },
    [addToast]
  )

  /**
   * Completes the current gig and transitions to the appropriate post-gig scene.
   * Handles Practice Mode logic (redirects to OVERWORLD instead of POSTGIG).
   */
  const endGig = useCallback(() => {
    const currentState = stateRef.current
    if (currentState.currentGig?.isPractice) {
      addToast(tRef.current('ui:gig.practiceComplete'), 'success')
      changeScene(GAME_PHASES.OVERWORLD)
    } else {
      changeScene(GAME_PHASES.POST_GIG)
    }
  }, [addToast, changeScene])

  const previousSceneRef = useRef(state.currentScene)

  useEffect(() => {
    const previousScene = previousSceneRef.current
    previousSceneRef.current = state.currentScene

    const shouldAutosaveOnTransition =
      previousScene === GAME_PHASES.GIG &&
      state.currentScene === GAME_PHASES.POST_GIG

    if (shouldAutosaveOnTransition) {
      saveGame(false)
    }
  }, [state.currentScene, saveGame])

  /**
   * Loads the game state from localStorage.
   * @returns {boolean} True if load was successful.
   */
  const loadGame = useCallback(() => {
    return safeStorage(
      'loadGame',
      () => {
        let parsed: unknown
        try {
          const saved = localStorage.getItem(SAVE_KEY)
          if (!saved) return false
          parsed = JSON.parse(saved)
        } catch (_error) {
          handleError(
            new StateError(
              tRef.current('ui:save.parseFailed', {
                defaultValue:
                  'Save file parsing failed. Falling back to initial state.'
              })
            ),
            { addToast }
          )
          return false
        }

        if (!isPlainObject(parsed)) {
          handleError(
            new StateError(
              tRef.current('ui:save.corruptFailed', {
                defaultValue: 'Save file is corrupt or invalid.'
              })
            ),
            {
              addToast
            }
          )
          return false
        }

        // Validate Schema
        try {
          validateSaveData(parsed)
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          handleError(
            new StateError(
              tRef.current('ui:save.corruptFailed', {
                defaultValue: 'Save file is corrupt or invalid.'
              }),
              {
                reason
              }
            ),
            { addToast }
          )
          return false
        }

        dispatch(createLoadGameAction({ ...parsed, unlocks: getUnlocks() }))
        return true
      },
      false
    )
  }, [addToast])

  // Event System Integration
  /**
   * Triggers a random event from a category if conditions are met.
   * @param {string} category - The event category (e.g., 'travel').
   * @param {string|null} [triggerPoint=null] - Specific trigger point.
   * @returns {boolean} True if an event was triggered.
   */
  const triggerEvent = useCallback(
    (category: string, triggerPoint: string | null = null) => {
      const currentState = stateRef.current
      // Harte Regel: Events nur in Overworld/PreGig/PostGig, oder wenn explizit erlaubt (z.B. Pause)
      // "GIG" scene should not be interrupted unless critical logic allows it.
      if (currentState.currentScene === GAME_PHASES.GIG) {
        // Queue event instead? Or just return false.
        // For now, return false to prevent interruption.
        return false
      }

      // Max two events per day limit
      if ((currentState.player?.eventsTriggeredToday || 0) >= 2) {
        return false
      }

      // Pass full state context for flags/cooldowns
      const context = currentState

      let event = (
        eventEngine.checkEvent as (
          categoryArg: string,
          contextArg: GameState,
          triggerArg?: string | null
        ) => Record<string, unknown> | null
      )(category, context, triggerPoint)

      if (event) {
        // Process dynamic options (Inventory checks)
        const processedEvent = eventEngine.processOptions(
          event,
          context
        ) as Record<string, unknown> | null
        if (!processedEvent) {
          return false
        }
        const processedEventId =
          typeof processedEvent.id === 'string' ? processedEvent.id : undefined
        event = processedEvent

        setActiveEvent(processedEvent)
        // Increment daily event count
        dispatch(
          createUpdatePlayerAction({
            eventsTriggeredToday:
              (currentState.player?.eventsTriggeredToday || 0) + 1
          })
        )

        // If it was a pending event, remove it from queue
        if (
          typeof processedEventId === 'string' &&
          currentState.pendingEvents[0] === processedEventId
        ) {
          dispatch(createPopPendingEventAction())
        }
        return true
      }
      return false
    },
    [setActiveEvent]
  )

  /**
   * Resolves an event choice and applies its effects.
   * @param {object} choice - The selected choice object.
   * @returns {object} Object containing { outcomeText, description, result }.
   */
  const resolveEvent = useCallback(
    (choice: Record<string, unknown> | null) => {
      // 1. Validation
      if (!choice) {
        setActiveEvent(null)
        return { outcomeText: '', description: '', result: null }
      }

      const currentState = stateRef.current
      const selectedChoice = (choice || {}) as {
        _precomputedResult?: EventResolution
        outcomeText?: string
        description?: string
      }

      try {
        // 2. Logic Execution
        const resolution: EventResolution =
          selectedChoice._precomputedResult ||
          (resolveEventChoice(
            choice as unknown as Record<string, unknown>,
            currentState as unknown as Record<string, unknown>
          ) as EventResolution)
        const { result, delta, outcomeText, description } = resolution
        const flags = (delta?.flags || {}) as {
          addQuest?: unknown
          unlock?: unknown
          gameOver?: unknown
        }

        // 3. State Application
        if (delta) {
          dispatch(createApplyEventDeltaAction(delta))

          // Add Quests
          if (flags.addQuest) {
            processAddQuests(flags.addQuest, currentState.player.day, dispatch)
          }

          // Unlocks
          if (flags.unlock) {
            const rawUnlock = String(flags.unlock)
            const safeUnlockId = rawUnlock
              .trim()
              .replace(/[^a-zA-Z0-9_]/g, '')
              .toLowerCase()

            if (safeUnlockId) {
              // Sync in-memory state unconditionally
              dispatch(createAddUnlockAction(safeUnlockId))

              const added = addUnlock(safeUnlockId)
              if (added) {
                const unlockKey = `unlocks:${safeUnlockId}`
                const unlockLabel = tRef.current(unlockKey, {
                  defaultValue: safeUnlockId.toUpperCase()
                })
                addToast(
                  tRef.current('ui:unlocked', {
                    unlock:
                      typeof unlockLabel === 'string'
                        ? unlockLabel
                        : String(unlockLabel)
                  }),
                  'success'
                )
              }
            }
          }

          // Game Over - Early Exit
          if (flags.gameOver) {
            const context = currentState.activeEvent?.context || {}
            const translatedDesc = description
              ? tRef.current(description, context)
              : ''
            addToast(
              tRef.current('ui:game_over', { description: translatedDesc }),
              'error'
            )
            changeScene(GAME_PHASES.GAMEOVER)
            setActiveEvent(null)
            return { outcomeText, description, result }
          }
        }

        // 4. Cooldown — prevent the same event from firing again immediately
        if (currentState.activeEvent?.id) {
          dispatch(createAddCooldownAction(currentState.activeEvent.id))
        }

        // 5. Feedback (Success Path)
        if (outcomeText || description) {
          const context = currentState.activeEvent?.context || {}
          const msgOutcome = outcomeText
            ? tRef.current(outcomeText, context)
            : ''
          const msgDesc = description ? tRef.current(description, context) : ''

          const message =
            msgOutcome && msgDesc
              ? `${msgOutcome} ${msgDesc}`
              : msgOutcome || msgDesc
          addToast(
            typeof message === 'string' ? message : String(message),
            'info'
          )
        }

        // 6. Cleanup
        setActiveEvent(null)
        return { outcomeText, description, result }
      } catch (error) {
        // 7. Error Handling
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast(tRef.current('ui:event_error'), 'error')
        setActiveEvent(null)
        return {
          outcomeText: selectedChoice.outcomeText ?? '',
          description:
            typeof selectedChoice.description === 'string'
              ? tRef.current(selectedChoice.description)
              : '',
          result: null
        }
      }
    },
    [setActiveEvent, addToast, changeScene]
  )

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
      pirateBroadcast,
      merchPress,
      tradeVoidItem,
      bloodBankDonate
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
      pirateBroadcast,
      merchPress,
      tradeVoidItem,
      bloodBankDonate
    ]
  )

  // Expose state to window for debugging/testing
  const dispatchValueRef = useRef(dispatchValue)
  dispatchValueRef.current = dispatchValue

  useEffect(() => {
    // Safely check for DEV environment to avoid crashes in test runners that don't polyfill import.meta.env
    const isDev =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.DEV
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
 * Hook to access the global game state context.
 * @returns {object} The game state and action dispatchers.
 */
export const useGameState = () => {
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

  return { ...state, ...actions, hasUpgrade }
}
