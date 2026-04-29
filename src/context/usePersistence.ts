import {
  type Dispatch,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef
} from 'react'
import type { TFunction } from 'i18next'
import { normalizeSetlistForSave, isPlainObject } from '../utils/gameStateUtils'
import {
  handleError,
  safeStorageOperation,
  StateError,
  StorageError
} from '../utils/errorHandler'
import { validateSaveData } from '../utils/saveValidator'
import { addUnlock, getUnlocks } from '../utils/unlockManager'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import { createLoadGameAction } from './actionCreators'
import type { GameAction, GameState } from '../types/game'
import type { OptionalToastCallback } from '../types/callbacks'

export const SAVE_KEY = 'neurotoxic_v3_save'

type UsePersistenceParams = {
  currentScene: GameState['currentScene']
  stateRef: MutableRefObject<GameState>
  dispatch: Dispatch<GameAction>
  addToast: OptionalToastCallback
  tRef: MutableRefObject<TFunction>
}

export const createPersistedState = (currentState: GameState) => {
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

export function safeStorage<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T {
  return (
    safeStorageOperation as unknown as (
      op: string,
      exec: () => T,
      fallback: T
    ) => T
  )(operation, fn, fallbackValue)
}

export function safeStorageNoFallback<T>(operation: string, fn: () => T): T {
  return (safeStorageOperation as unknown as (op: string, exec: () => T) => T)(
    operation,
    fn
  )
}

export function usePersistence({
  currentScene,
  stateRef,
  dispatch,
  addToast,
  tRef
}: UsePersistenceParams) {
  const deleteSave = useCallback(() => {
    safeStorageNoFallback('deleteSave', () => {
      localStorage.removeItem(SAVE_KEY)
    })
    window.location.reload()
  }, [])

  const saveGame = useCallback(
    (showToast = true, stateSnapshot: GameState = stateRef.current) => {
      const saveData = createPersistedState(stateSnapshot)

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
    [addToast, stateRef, tRef]
  )

  const previousSceneRef = useRef(currentScene)

  useEffect(() => {
    const previousScene = previousSceneRef.current
    previousSceneRef.current = currentScene

    const shouldAutosaveOnTransition =
      (previousScene === GAME_PHASES.GIG &&
        currentScene === GAME_PHASES.POST_GIG) ||
      (previousScene === GAME_PHASES.POST_GIG &&
        (currentScene === GAME_PHASES.GAMEOVER ||
          currentScene === GAME_PHASES.OVERWORLD))

    if (shouldAutosaveOnTransition) {
      saveGame(false)
    }
  }, [currentScene, saveGame])

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
            { addToast }
          )
          return false
        }

        try {
          validateSaveData(parsed)
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          handleError(
            new StateError(
              tRef.current('ui:save.corruptFailed', {
                defaultValue: 'Save file is corrupt or invalid.'
              }),
              { reason }
            ),
            { addToast }
          )
          return false
        }

        const parsedObj = parsed as Record<string, unknown>
        const savedRaw = Array.isArray(parsedObj.unlocks)
          ? parsedObj.unlocks
          : []
        const savedUnlocks = savedRaw.filter(
          (u): u is string => typeof u === 'string'
        )
        const persistentUnlocks = getUnlocks()
        const mergedUnlocks = Array.from(
          new Set([...persistentUnlocks, ...savedUnlocks])
        )
        mergedUnlocks.forEach(unlockId => {
          addUnlock(unlockId)
        })

        const loadPayload: Partial<GameState> = {
          version: parsedObj.version as GameState['version'],
          currentScene: parsedObj.currentScene as GameState['currentScene'],
          player: parsedObj.player as GameState['player'],
          band: parsedObj.band as GameState['band'],
          social: parsedObj.social as GameState['social'],
          gameMap: parsedObj.gameMap as GameState['gameMap'],
          currentGig: parsedObj.currentGig as GameState['currentGig'],
          lastGigStats: parsedObj.lastGigStats as GameState['lastGigStats'],
          activeEvent: parsedObj.activeEvent as GameState['activeEvent'],
          activeStoryFlags:
            parsedObj.activeStoryFlags as GameState['activeStoryFlags'],
          eventCooldowns:
            parsedObj.eventCooldowns as GameState['eventCooldowns'],
          pendingEvents: parsedObj.pendingEvents as GameState['pendingEvents'],
          venueBlacklist:
            parsedObj.venueBlacklist as GameState['venueBlacklist'],
          activeQuests: parsedObj.activeQuests as GameState['activeQuests'],
          reputationByRegion:
            parsedObj.reputationByRegion as GameState['reputationByRegion'],
          settings: parsedObj.settings as GameState['settings'],
          npcs: parsedObj.npcs as GameState['npcs'],
          gigModifiers: parsedObj.gigModifiers as GameState['gigModifiers'],
          setlist: parsedObj.setlist as GameState['setlist'],
          minigame: parsedObj.minigame as GameState['minigame'],
          unlocks: mergedUnlocks
        }

        dispatch(createLoadGameAction(loadPayload))
        return true
      },
      false
    )
  }, [addToast, dispatch, tRef])

  return { deleteSave, saveGame, loadGame }
}
