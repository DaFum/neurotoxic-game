import {
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
  createUnlockTraitAction,
  createAddQuestAction,
  createAdvanceQuestAction,
  createAddUnlockAction,
  createUseContrabandAction
} from './actionCreators'
import PropTypes from 'prop-types'

const GameStateContext = createContext()
const GameDispatchContext = createContext()
const SAVE_KEY = 'neurotoxic_v3_save'
const normalizeSetlistForSave = setlist => {
  if (!Array.isArray(setlist)) return []

  return setlist
    .map(song => {
      if (typeof song === 'string') {
        return { id: song }
      }
      if (song && song.id) {
        return { id: song.id }
      }
      return null
    })
    .filter(Boolean)
}

const createPersistedState = currentState => {
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

const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const processAddQuests = (quests, currentDay, dispatch) => {
  if (!Array.isArray(quests)) return

  quests.forEach(q => {
    // Parse relative deadlines
    const questToAdd = { ...q }
    if (questToAdd.deadlineOffset) {
      questToAdd.deadline = currentDay + questToAdd.deadlineOffset
      delete questToAdd.deadlineOffset
    }
    dispatch(createAddQuestAction(questToAdd))
  })
}

/**
 * Global State Provider covering Player, Band, Inventory, and Scene Management.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export const GameStateProvider = ({ children }) => {
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  // Lazy initialization of state to ensure fresh data fetch on mount
  const initGameState = () => {
    return createInitialState({
      unlocks: safeStorageOperation('loadUnlocks', () => getUnlocks(), []) || []
    })
  }

  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState)

  // Leaderboard Sync Hook
  useLeaderboardSync(state)

  // Use a ref to access the latest state in actions without creating a dependency loop
  // This allows actions to be stable (memoized once) while still accessing current state.
  const stateRef = useRef(state)
  stateRef.current = state

  // Initialize Map if needed
  useEffect(() => {
    if (!state.gameMap) {
      const generator = new MapGenerator()
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
    scene => startTransition(() => dispatch(createChangeSceneAction(scene))),
    []
  )

  /**
   * Updates player state properties (money, fame, etc.).
   * @param {object|Function} updates - Object containing keys to update or updater function(prev).
   */
  const updatePlayer = useCallback(
    updates => dispatch(createUpdatePlayerAction(updates)),
    []
  )

  /**
   * Updates band state properties (members, harmony, inventory).
   * @param {object|Function} updates - Object containing keys to update or updater function(prev).
   */
  const updateBand = useCallback(
    updates => dispatch(createUpdateBandAction(updates)),
    []
  )

  /**
   * Updates social media metrics.
   * @param {object|Function} updates - Object containing keys to update or updater function(prev).
   */
  const updateSocial = useCallback(
    updates => dispatch(createUpdateSocialAction(updates)),
    []
  )

  /**
   * Updates global settings.
   * @param {object} updates - Object containing keys to update.
   */
  const updateSettings = useCallback(updates => {
    dispatch(createUpdateSettingsAction(updates))

    // Synchronize logger if logLevel is updated
    if (updates.logLevel !== undefined) {
      logger.setLevel(updates.logLevel)
    }

    // Persist to global settings (persist across new games)
    safeStorageOperation('saveGlobalSettings', () => {
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
  const setGameMap = useCallback(map => dispatch(createSetMapAction(map)), [])

  /**
   * Sets the current gig data context.
   * @param {object} gig - The gig data object.
   */
  const setCurrentGig = useCallback(
    gig => dispatch(createSetGigAction(gig)),
    []
  )

  /**
   * Initiates the gig sequence.
   * @param {object} venue - The venue object.
   */
  const startGig = useCallback(
    venue => startTransition(() => dispatch(createStartGigAction(venue))),
    []
  )

  /**
   * Updates the active setlist.
   * @param {Array} list - Array of song objects or IDs.
   */
  const setSetlist = useCallback(
    list => dispatch(createSetSetlistAction(list)),
    []
  )

  /**
   * Stores the statistics from the last played gig.
   * @param {object} stats - The stats object.
   */
  const setLastGigStats = useCallback(
    stats => dispatch(createSetLastGigStatsAction(stats)),
    []
  )

  /**
   * Sets the currently active event (blocking modal).
   * @param {object} event - The event object or null.
   */
  const setActiveEvent = useCallback(
    event => dispatch(createSetActiveEventAction(event)),
    []
  )

  /**
   * Updates gig modifiers (toggles like catering, promo).
   * @param {object|Function} payload - The new modifiers or an updater function.
   */
  const setGigModifiers = useCallback(
    payload => dispatch(createSetGigModifiersAction(payload)),
    []
  )

  /**
   * Adds a toast notification.
   * @param {string} message - The message to display.
   * @param {string} [type='info'] - Type of toast (info, success, error, warning).
   */
  const addToast = useCallback((message, type = 'info') => {
    const action = createAddToastAction(message, type)
    dispatch(action)
    setTimeout(() => {
      dispatch(createRemoveToastAction(action.payload.id))
    }, 3000)
  }, [])

  /**
   * Consumes a consumable item from band inventory.
   * @param {string} itemType - The item key (e.g., 'strings').
   */
  const consumeItem = useCallback(
    itemType => dispatch(createConsumeItemAction(itemType)),
    []
  )

  /**
   * Uses a contraband item.
   * @param {string} instanceId - The unique instance ID of the contraband item.
   * @param {string} [memberId] - Optional. The ID of the band member.
   */
  const useContraband = useCallback(
    (instanceId, memberId) =>
      dispatch(createUseContrabandAction(instanceId, memberId)),
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
      safeStorageOperation('loadUnlocks', () => getUnlocks(), []) || []
    dispatch(createResetStateAction({ unlocks }))
  }, [])

  // Minigame Actions
  const startTravelMinigame = useCallback(
    targetNodeId =>
      startTransition(() =>
        dispatch(createStartTravelMinigameAction(targetNodeId))
      ),
    []
  )

  const completeTravelMinigame = useCallback((damageTaken, itemsCollected) => {
    const rngValue = secureRandom()
    const contrabandId = pickRandomContraband(secureRandom)
    const instanceId = crypto.randomUUID()
    dispatch(
      createCompleteTravelMinigameAction(
        damageTaken,
        itemsCollected,
        rngValue,
        contrabandId,
        instanceId
      )
    )
  }, [])

  const startRoadieMinigame = useCallback(
    gigId =>
      startTransition(() => dispatch(createStartRoadieMinigameAction(gigId))),
    []
  )

  const completeRoadieMinigame = useCallback(
    equipmentDamage =>
      dispatch(createCompleteRoadieMinigameAction(equipmentDamage)),
    []
  )

  const startKabelsalatMinigame = useCallback(
    gigId =>
      startTransition(() =>
        dispatch(createStartKabelsalatMinigameAction(gigId))
      ),
    []
  )

  const completeKabelsalatMinigame = useCallback(
    results => dispatch(createCompleteKabelsalatMinigameAction(results)),
    []
  )

  const unlockTrait = useCallback(
    (memberId, traitId) => dispatch(createUnlockTraitAction(memberId, traitId)),
    []
  )

  const addQuest = useCallback(
    quest => dispatch(createAddQuestAction(quest)),
    []
  )

  const advanceQuest = useCallback(
    (questId, progressAmount) =>
      dispatch(createAdvanceQuestAction(questId, progressAmount)),
    []
  )

  // Persistence
  /**
   * Deletes the save file and reloads the application.
   */
  const deleteSave = useCallback(() => {
    safeStorageOperation('deleteSave', () => {
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

      const success = safeStorageOperation(
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
        logger.info('System', 'Game Saved Successfully')
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
    return safeStorageOperation(
      'loadGame',
      () => {
        let parsed
        try {
          const saved = localStorage.getItem(SAVE_KEY)
          if (!saved) return false
          parsed = JSON.parse(saved)
        } catch (error) {
          handleError(
            new StateError(
              tRef.current('ui:save.parseFailed', {
                defaultValue: 'Save file parsing failed. Falling back to initial state.'
              })
            ),
            { addToast }
          )
          return false
        }

        if (!isPlainObject(parsed)) {
          handleError(new StateError(
            tRef.current('ui:save.corruptFailed', {
              defaultValue: 'Save file is corrupt or invalid.'
            })
          ), {
            addToast
          })
          return false
        }

        // Validate Schema
        try {
          validateSaveData(parsed)
        } catch (error) {
          handleError(
            new StateError(
              tRef.current('ui:save.corruptFailed', {
                defaultValue: 'Save file is corrupt or invalid.'
              }), {
              reason: error.message
            }),
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
    (category, triggerPoint = null) => {
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

      let event = eventEngine.checkEvent(category, context, triggerPoint)

      if (event) {
        // Process dynamic options (Inventory checks)
        event = eventEngine.processOptions(event, context)

        setActiveEvent(event)
        // Increment daily event count
        dispatch(
          createUpdatePlayerAction({
            eventsTriggeredToday:
              (currentState.player?.eventsTriggeredToday || 0) + 1
          })
        )

        // If it was a pending event, remove it from queue
        if (currentState.pendingEvents.includes(event.id)) {
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
    choice => {
      // 1. Validation
      if (!choice) {
        setActiveEvent(null)
        return { outcomeText: '', description: '', result: null }
      }

      const currentState = stateRef.current

      try {
        // 2. Logic Execution
        const { result, delta, outcomeText, description } = resolveEventChoice(
          choice,
          currentState
        )

        // 3. State Application
        if (delta) {
          dispatch(createApplyEventDeltaAction(delta))

          // Add Quests
          if (delta.flags?.addQuest) {
            processAddQuests(
              delta.flags.addQuest,
              currentState.player.day,
              dispatch
            )
          }

          // Unlocks
          if (delta.flags?.unlock) {
            const rawUnlock = String(delta.flags.unlock)
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
                  tRef.current('ui:unlocked', { unlock: unlockLabel }),
                  'success'
                )
              }
            }
          }

          // Game Over - Early Exit
          if (delta.flags?.gameOver) {
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
              ? `${msgOutcome} — ${msgDesc}`
              : msgOutcome || msgDesc
          addToast(message, 'info')
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
          outcomeText: choice.outcomeText ?? '',
          description: choice.description
            ? tRef.current(choice.description)
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
      unlockTrait,
      endGig,
      addQuest,
      advanceQuest,
      useContraband
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
      unlockTrait,
      endGig,
      addQuest,
      advanceQuest,
      useContraband
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

GameStateProvider.propTypes = {
  children: PropTypes.node
}

/**
 * Hook to access the global game dispatch functions only (stable reference).
 *
 * @returns {object} The action dispatchers.
 */
export const useGameDispatch = () => {
  return use(GameDispatchContext)
}

/**
 * Hook to access the global game state context.
 * @returns {object} The game state and action dispatchers.
 */
export const useGameState = () => {
  const state = use(GameStateContext)
  const dispatch = use(GameDispatchContext)

  /**
   * Checks if the player owns a specific van upgrade.
   * Delegates to the pure utility in upgradeUtils.js for testability.
   * @param {string} upgradeId - The ID of the upgrade.
   * @returns {boolean} True if owned.
   */
  const hasUpgrade = useCallback(
    upgradeId => checkUpgrade(state.player.van.upgrades, upgradeId),
    [state.player.van.upgrades]
  )

  return { ...state, ...dispatch, hasUpgrade }
}
