import {
  type Dispatch,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef
} from 'react'
import type { TFunction } from 'i18next'
import { normalizeSetlistForSave, isLooseRecord } from '../utils/gameState'
import { safeJsonParse } from '../utils/objectUtils'
import { handleError, StateError, StorageError } from '../utils/errorHandler'
import { safeStorageOperation } from '../utils/storage'
import { validateSaveData } from '../utils/saveValidator'
import { addUnlock, getUnlocks } from '../utils/unlockManager'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import { createLoadGameAction } from './actionCreators'
import type { GameAction, GameState } from '../types'
import type { OptionalToastCallback } from '../types/callbacks'

/** Local-storage key for the current persisted game save. */
export const SAVE_KEY = 'neurotoxic_v3_save'
const LOADABLE_SAVE_KEYS = [
  'version',
  'currentScene',
  'player',
  'band',
  'social',
  'gameMap',
  'currentGig',
  'lastGigStats',
  'activeEvent',
  'activeStoryFlags',
  'eventCooldowns',
  'pendingEvents',
  'venueBlacklist',
  'pendingForeclosureNotices',
  'pendingRiskEvent',
  'activeQuests',
  'questCooldowns',
  'completedQuestIds',
  'completedQuestScopes',
  'reputationByRegion',
  'reputationByVenue',
  'settings',
  'npcs',
  'gigModifiers',
  'setlist',
  'minigame',
  'completedMilestones',
  'assets',
  'liabilities',
  'crowdfundCampaigns',
  'rngSeed',
  'rivalBand'
] as const

type UsePersistenceParams = {
  currentScene: GameState['currentScene']
  stateRef: MutableRefObject<GameState>
  dispatch: Dispatch<GameAction>
  addToast: OptionalToastCallback
  tRef: MutableRefObject<TFunction>
}

/**
 * Builds a reducer load payload from a parsed save by whitelisting persisted fields.
 *
 * @param parsedObj - Parsed save object that has already passed basic shape validation.
 * @param unlocks - Merged persistent unlock ids to include in the load payload.
 * @returns Raw load payload containing only keys the reducer is allowed to hydrate.
 */
export const createRawLoadPayload = (
  parsedObj: Record<string, unknown>,
  unlocks: string[]
): Record<string, unknown> => {
  const payload: Record<string, unknown> = { unlocks }
  for (const key of LOADABLE_SAVE_KEYS) {
    if (Object.hasOwn(parsedObj, key)) {
      payload[key] = parsedObj[key]
    }
  }
  return payload
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
    pendingForeclosureNotices,
    pendingRiskEvent,
    activeQuests,
    questCooldowns,
    completedQuestIds,
    completedQuestScopes,
    reputationByRegion,
    reputationByVenue,
    settings,
    npcs,
    gigModifiers,
    setlist,
    unlocks,
    completedMilestones,
    minigame,
    assets,
    liabilities,
    crowdfundCampaigns,
    rngSeed,
    rivalBand
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
    pendingForeclosureNotices,
    pendingRiskEvent,
    activeQuests,
    questCooldowns,
    completedQuestIds,
    completedQuestScopes,
    reputationByRegion,
    reputationByVenue,
    settings,
    npcs,
    gigModifiers,
    unlocks,
    completedMilestones,
    minigame,
    assets,
    liabilities,
    crowdfundCampaigns,
    rngSeed,
    rivalBand,
    setlist: normalizeSetlistForSave(setlist)
  }
}

/**
 * Creates save, load, and delete-save callbacks plus post-gig autosave behavior.
 *
 * @param params - Current scene, state ref, dispatch, toast callback, and translator ref.
 * @returns Persistence actions for deleting, saving, and loading the game.
 */
export function usePersistence({
  currentScene,
  stateRef,
  dispatch,
  addToast,
  tRef
}: UsePersistenceParams) {
  const deleteSave = useCallback(() => {
    safeStorageOperation('deleteSave', () => {
      localStorage.removeItem(SAVE_KEY)
    })
    window.location.reload()
  }, [])

  const saveGame = useCallback(
    (showToast = true, stateSnapshot: GameState = stateRef.current) => {
      const saveData = createPersistedState(stateSnapshot)

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
    return safeStorageOperation(
      'loadGame',
      () => {
        let parsed: unknown
        try {
          const saved = localStorage.getItem(SAVE_KEY)
          if (!saved) return false
          parsed = safeJsonParse(saved)
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

        if (!isLooseRecord(parsed)) {
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

        dispatch(
          createLoadGameAction(createRawLoadPayload(parsedObj, mergedUnlocks))
        )
        return true
      },
      false
    )
  }, [addToast, dispatch, tRef])

  return { deleteSave, saveGame, loadGame }
}
