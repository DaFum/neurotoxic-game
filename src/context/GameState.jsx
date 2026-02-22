import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react'
import { eventEngine, resolveEventChoice } from '../utils/eventEngine'
import { MapGenerator } from '../utils/mapGenerator'
import { logger } from '../utils/logger'
import {
  handleError,
  StorageError,
  StateError,
  safeStorageOperation
} from '../utils/errorHandler'
import { validateSaveData } from '../utils/saveValidator'
import { addUnlock } from '../utils/unlockManager'
import { hasUpgrade as checkUpgrade } from '../utils/upgradeUtils'

// Import modular state management
import { createInitialState } from './initialState'
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
  createCompleteRoadieMinigameAction
} from './actionCreators'
import PropTypes from 'prop-types'

const GameStateContext = createContext()
const GameDispatchContext = createContext()

/**
 * Global State Provider covering Player, Band, Inventory, and Scene Management.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)

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
   * @param {string} scene - The target scene name (e.g., 'OVERWORLD').
   */
  const changeScene = useCallback(
    scene => dispatch(createChangeSceneAction(scene)),
    []
  )

  /**
   * Updates player state properties (money, fame, etc.).
   * @param {object} updates - Object containing keys to update.
   */
  const updatePlayer = useCallback(
    updates => dispatch(createUpdatePlayerAction(updates)),
    []
  )

  /**
   * Updates band state properties (members, harmony, inventory).
   * @param {object} updates - Object containing keys to update.
   */
  const updateBand = useCallback(
    updates => dispatch(createUpdateBandAction(updates)),
    []
  )

  /**
   * Updates social media metrics.
   * @param {object} updates - Object containing keys to update.
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
    venue => dispatch(createStartGigAction(venue)),
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
   * Advances the game day, deducting living costs and updating simulations.
   */
  const advanceDay = useCallback(() => {
    // Access state via ref to keep callback stable
    const currentState = stateRef.current
    const nextDay = currentState.player.day + 1
    dispatch(createAdvanceDayAction())
    addToast(`Day ${nextDay}: Living Costs Deducted.`, 'info')
  }, [addToast])

  /**
   * Resets the game state to initial values.
   */
  const resetState = useCallback(() => dispatch(createResetStateAction()), [])

  // Minigame Actions
  const startTravelMinigame = useCallback(
    targetNodeId => dispatch(createStartTravelMinigameAction(targetNodeId)),
    []
  )

  const completeTravelMinigame = useCallback(
    (damageTaken, itemsCollected) =>
      dispatch(createCompleteTravelMinigameAction(damageTaken, itemsCollected)),
    []
  )

  const startRoadieMinigame = useCallback(
    gigId => dispatch(createStartRoadieMinigameAction(gigId)),
    []
  )

  const completeRoadieMinigame = useCallback(
    equipmentDamage =>
      dispatch(createCompleteRoadieMinigameAction(equipmentDamage)),
    []
  )

  // Persistence
  /**
   * Deletes the save file and reloads the application.
   */
  const deleteSave = useCallback(() => {
    safeStorageOperation('deleteSave', () => {
      localStorage.removeItem('neurotoxic_v3_save')
    })
    changeScene('MENU')
    window.location.reload()
  }, [changeScene])

  /**
   * Persists the current state to localStorage.
   */
  const saveGame = useCallback(() => {
    // Access state via ref
    const currentState = stateRef.current
    // Only persist minimal setlist info to avoid bloat
    const saveData = { ...currentState, timestamp: Date.now() }

    // Normalize setlist to objects with IDs
    if (Array.isArray(saveData.setlist)) {
      saveData.setlist = saveData.setlist
        .map(s => {
          if (typeof s === 'string') return { id: s }
          if (s && s.id) return { id: s.id }
          return null
        })
        .filter(Boolean)
    }

    const success = safeStorageOperation(
      'saveGame',
      () => {
        localStorage.setItem('neurotoxic_v3_save', JSON.stringify(saveData))
        return true
      },
      false
    )

    if (success) {
      addToast('GAME SAVED!', 'success')
      logger.info('System', 'Game Saved Successfully')
    } else {
      handleError(new StorageError('Failed to save game'), { addToast })
    }
  }, [addToast])

  /**
   * Loads the game state from localStorage.
   * @returns {boolean} True if load was successful.
   */
  const loadGame = useCallback(() => {
    return safeStorageOperation(
      'loadGame',
      () => {
        const saved = localStorage.getItem('neurotoxic_v3_save')
        if (!saved) return false

        const data = JSON.parse(saved)

        // Validate Schema
        try {
          validateSaveData(data)
        } catch (error) {
          handleError(
            new StateError('Save file is corrupt or invalid.', {
              reason: error.message
            }),
            { addToast }
          )
          return false
        }

        dispatch(createLoadGameAction(data))
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
      if (currentState.currentScene === 'GIG') {
        // Queue event instead? Or just return false.
        // For now, return false to prevent interruption.
        return false
      }

      // Pass full state context for flags/cooldowns
      const context = {
        player: currentState.player,
        band: currentState.band,
        social: currentState.social,
        activeStoryFlags: currentState.activeStoryFlags,
        eventCooldowns: currentState.eventCooldowns,
        pendingEvents: currentState.pendingEvents
      }

      let event = eventEngine.checkEvent(category, context, triggerPoint)

      if (event) {
        // Process dynamic options (Inventory checks)
        event = eventEngine.processOptions(event, context)

        setActiveEvent(event)
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
          {
            player: currentState.player,
            band: currentState.band,
            social: currentState.social
          }
        )

        // 3. State Application
        if (delta) {
          dispatch(createApplyEventDeltaAction(delta))

          // Unlocks
          if (delta.flags?.unlock) {
            const added = addUnlock(delta.flags.unlock)
            if (added) {
              addToast(
                `UNLOCKED: ${delta.flags.unlock.toUpperCase()}!`,
                'success'
              )
            }
          }

          // Game Over - Early Exit
          if (delta.flags?.gameOver) {
            addToast(`GAME OVER: ${description}`, 'error')
            changeScene('GAMEOVER')
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
          const message =
            outcomeText && description
              ? `${outcomeText} — ${description}`
              : outcomeText || description
          addToast(message, 'info')
        }

        // 6. Cleanup
        setActiveEvent(null)
        return { outcomeText, description, result }
      } catch (error) {
        // 7. Error Handling
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast('EVENT ERROR: Resolution failed.', 'error')
        setActiveEvent(null)
        return {
          outcomeText: choice.outcomeText ?? '',
          description: 'Resolution failed.',
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
      completeRoadieMinigame
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
      updateSettings
    ]
  )

  return (
    <GameDispatchContext.Provider value={dispatchValue}>
      <GameStateContext.Provider value={state}>
        {children}
      </GameStateContext.Provider>
    </GameDispatchContext.Provider>
  )
}

GameStateProvider.propTypes = {
  children: PropTypes.node
}

/**
 * Hook to access the global game state context.
 * @returns {object} The game state and action dispatchers.
 */
export const useGameState = () => {
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)

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
