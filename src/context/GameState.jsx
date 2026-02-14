import { createContext, useContext, useReducer, useEffect } from 'react'
import { eventEngine } from '../utils/eventEngine'
import { resolveEventChoice } from '../utils/eventResolver'
import { MapGenerator } from '../utils/mapGenerator'
import { logger } from '../utils/logger'
import {
  handleError,
  StorageError,
  StateError,
  safeStorageOperation
} from '../utils/errorHandler'

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
  createAddCooldownAction
} from './actionCreators'

const GameStateContext = createContext()

/**
 * Global State Provider covering Player, Band, Inventory, and Scene Management.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
import PropTypes from 'prop-types'

export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)

  // Initialize Map if needed
  useEffect(() => {
    if (!state.gameMap) {
      const generator = new MapGenerator()
      const newMap = generator.generateMap()
      dispatch(createSetMapAction(newMap))
    }
  }, [state.gameMap])

  // Actions wrappers using ActionTypes for type safety

  /**
   * Transitions the game to a different scene.
   * @param {string} scene - The target scene name (e.g., 'OVERWORLD').
   */
  const changeScene = scene => dispatch(createChangeSceneAction(scene))

  /**
   * Updates player state properties (money, fame, etc.).
   * @param {object} updates - Object containing keys to update.
   */
  const updatePlayer = updates => dispatch(createUpdatePlayerAction(updates))

  /**
   * Updates band state properties (members, harmony, inventory).
   * @param {object} updates - Object containing keys to update.
   */
  const updateBand = updates => dispatch(createUpdateBandAction(updates))

  /**
   * Updates social media metrics.
   * @param {object} updates - Object containing keys to update.
   */
  const updateSocial = updates => dispatch(createUpdateSocialAction(updates))

  /**
   * Updates global settings.
   * @param {object} updates - Object containing keys to update.
   */
  const updateSettings = updates => {
    dispatch(createUpdateSettingsAction(updates))
    // Persist to global settings (persist across new games)
    safeStorageOperation('saveGlobalSettings', () => {
      const current = JSON.parse(
        localStorage.getItem('neurotoxic_global_settings') || '{}'
      )
      const next = { ...current, ...updates }
      localStorage.setItem('neurotoxic_global_settings', JSON.stringify(next))
    })
  }

  /**
   * Sets the generated game map.
   * @param {object} map - The map object.
   */
  const setGameMap = map => dispatch(createSetMapAction(map))

  /**
   * Sets the current gig data context.
   * @param {object} gig - The gig data object.
   */
  const setCurrentGig = gig => dispatch(createSetGigAction(gig))

  /**
   * Initiates the gig sequence.
   * @param {object} venue - The venue object.
   */
  const startGig = venue => dispatch(createStartGigAction(venue))

  /**
   * Updates the active setlist.
   * @param {Array} list - Array of song objects or IDs.
   */
  const setSetlist = list => dispatch(createSetSetlistAction(list))

  /**
   * Stores the statistics from the last played gig.
   * @param {object} stats - The stats object.
   */
  const setLastGigStats = stats => dispatch(createSetLastGigStatsAction(stats))

  /**
   * Sets the currently active event (blocking modal).
   * @param {object} event - The event object or null.
   */
  const setActiveEvent = event => dispatch(createSetActiveEventAction(event))

  /**
   * Updates gig modifiers (toggles like catering, promo).
   * @param {object|Function} payload - The new modifiers or an updater function.
   */
  const setGigModifiers = payload =>
    dispatch(createSetGigModifiersAction(payload))

  /**
   * Adds a toast notification.
   * @param {string} message - The message to display.
   * @param {string} [type='info'] - Type of toast (info, success, error, warning).
   */
  const addToast = (message, type = 'info') => {
    const action = createAddToastAction(message, type)
    dispatch(action)
    setTimeout(() => {
      dispatch(createRemoveToastAction(action.payload.id))
    }, 3000)
  }

  /**
   * Checks if the player owns a specific van upgrade.
   * @param {string} upgradeId - The ID of the upgrade.
   * @returns {boolean} True if owned.
   */
  const hasUpgrade = upgradeId => state.player.van.upgrades.includes(upgradeId)

  /**
   * Consumes a consumable item from band inventory.
   * @param {string} itemType - The item key (e.g., 'strings').
   */
  const consumeItem = itemType => dispatch(createConsumeItemAction(itemType))

  /**
   * Advances the game day, deducting living costs and updating simulations.
   */
  const advanceDay = () => {
    const nextDay = state.player.day + 1
    dispatch(createAdvanceDayAction())
    addToast(`Day ${nextDay}: Living Costs Deducted.`, 'info')
  }

  /**
   * Resets the game state to initial values.
   */
  const resetState = () => dispatch(createResetStateAction())

  // Persistence
  /**
   * Deletes the save file and reloads the application.
   */
  const deleteSave = () => {
    safeStorageOperation('deleteSave', () => {
      localStorage.removeItem('neurotoxic_v3_save')
    })
    changeScene('MENU')
    window.location.reload()
  }

  /**
   * Persists the current state to localStorage.
   */
  const saveGame = () => {
    // Only persist minimal setlist info to avoid bloat
    const saveData = { ...state, timestamp: Date.now() }

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
  }

  /**
   * Loads the game state from localStorage.
   * @returns {boolean} True if load was successful.
   */
  const loadGame = () => {
    return safeStorageOperation(
      'loadGame',
      () => {
        const saved = localStorage.getItem('neurotoxic_v3_save')
        if (!saved) return false

        const data = JSON.parse(saved)

        // Validate Schema
        const requiredKeys = ['player', 'band', 'social', 'gameMap']
        const missingKeys = requiredKeys.filter(k => !data[k])

        if (missingKeys.length > 0) {
          handleError(
            new StateError('Save file is corrupt. Starting fresh.', {
              missingKeys
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
  }

  // Event System Integration
  /**
   * Triggers a random event from a category if conditions are met.
   * @param {string} category - The event category (e.g., 'travel').
   * @param {string|null} [triggerPoint=null] - Specific trigger point.
   * @returns {boolean} True if an event was triggered.
   */
  const triggerEvent = (category, triggerPoint = null) => {
    // Harte Regel: Events nur in Overworld/PreGig/PostGig, oder wenn explizit erlaubt (z.B. Pause)
    // "GIG" scene should not be interrupted unless critical logic allows it.
    if (state.currentScene === 'GIG') {
      // Queue event instead? Or just return false.
      // For now, return false to prevent interruption.
      return false
    }

    // Pass full state context for flags/cooldowns
    const context = {
      player: state.player,
      band: state.band,
      social: state.social,
      activeStoryFlags: state.activeStoryFlags,
      eventCooldowns: state.eventCooldowns,
      pendingEvents: state.pendingEvents
    }

    let event = eventEngine.checkEvent(category, context, triggerPoint)

    if (event) {
      // Process dynamic options (Inventory checks)
      event = eventEngine.processOptions(event, context)

      setActiveEvent(event)
      // If it was a pending event, remove it from queue
      if (state.pendingEvents.includes(event.id)) {
        dispatch(createPopPendingEventAction())
      }
      return true
    }
    return false
  }

  /**
   * Resolves an event choice and applies its effects.
   * @param {object} choice - The selected choice object.
   * @returns {object} Outcome text and description.
   */
  const resolveEvent = choice => {
    // 1. Validation
    if (!choice) {
      setActiveEvent(null)
      return { outcomeText: '', description: '', result: null }
    }

    try {
      // 2. Logic Execution
      const { result, delta, outcomeText, description } = resolveEventChoice(
        choice,
        {
          player: state.player,
          band: state.band,
          social: state.social
        }
      )

      // 3. State Application
      if (delta) {
        dispatch(createApplyEventDeltaAction(delta))

        // Unlocks
        if (delta.flags?.unlock) {
          const currentUnlocks = safeStorageOperation(
            'loadUnlocks',
            () =>
              JSON.parse(localStorage.getItem('neurotoxic_unlocks') || '[]'),
            []
          )
          if (
            Array.isArray(currentUnlocks) &&
            !currentUnlocks.includes(delta.flags.unlock)
          ) {
            currentUnlocks.push(delta.flags.unlock)
            safeStorageOperation('saveUnlocks', () =>
              localStorage.setItem(
                'neurotoxic_unlocks',
                JSON.stringify(currentUnlocks)
              )
            )
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
      if (state.activeEvent?.id) {
        dispatch(createAddCooldownAction(state.activeEvent.id))
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
      console.error('[Event] Failed to resolve event choice:', error)
      addToast('EVENT ERROR: Resolution failed.', 'error')
      setActiveEvent(null)
      return {
        outcomeText: choice.outcomeText ?? '',
        description: 'Resolution failed.',
        result: null
      }
    }
  }

  return (
    <GameStateContext.Provider
      value={{
        ...state, // Spread state properties
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
        hasUpgrade,
        consumeItem,
        advanceDay,
        saveGame,
        loadGame,
        deleteSave,
        resetState,
        updateSettings
      }}
    >
      {children}
    </GameStateContext.Provider>
  )
}

GameStateProvider.propTypes = {
  children: PropTypes.node
}

/**
 * Hook to access the global game state context.
 * @returns {object} The game state and action dispatchers.
 */
export const useGameState = () => useContext(GameStateContext)
