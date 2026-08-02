import {
  type Dispatch,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef
} from 'react'
import type { TFunction } from 'i18next'
import {
  normalizeSetlistForSave,
  isLooseRecord,
  isFiniteNumber
} from '../utils/gameState'
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

/**
 * The string identifier used to store and retrieve the game's save payload in local storage.
 */
export const SAVE_KEY = 'neurotoxic_v3_save'
const isPlainObject = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNullableObject = (value: unknown): boolean =>
  value === null || (typeof value === 'object' && !Array.isArray(value))

const isObjectOrArray = (value: unknown): boolean =>
  typeof value === 'object' && value !== null

const isNumberOrString = (value: unknown): boolean =>
  isFiniteNumber(value) || typeof value === 'string'

const isString = (value: unknown): boolean => typeof value === 'string'

/**
 * Single source of truth for the persisted save fields.
 *
 * @remarks
 * Each entry maps a `GameState` key to the predicate that accepts its persisted
 * value. The load whitelist, per-field load validation, and the save-snapshot
 * picker are all derived from this map — adding a persisted field means adding
 * one entry here (plus reducer-side handling in `handleLoadGame`).
 */
const PERSISTED_FIELDS = {
  version: isNumberOrString,
  currentScene: isString,
  player: isPlainObject,
  band: isPlainObject,
  social: isPlainObject,
  gameMap: isNullableObject,
  currentGig: isNullableObject,
  lastGigStats: isNullableObject,
  activeEvent: isNullableObject,
  activeStoryFlags: Array.isArray,
  eventCooldowns: Array.isArray,
  pendingEvents: Array.isArray,
  venueBlacklist: Array.isArray,
  pendingForeclosureNotices: Array.isArray,
  pendingRiskEvent: isNullableObject,
  activeQuests: Array.isArray,
  questCooldowns: Array.isArray,
  completedQuestIds: Array.isArray,
  completedQuestScopes: Array.isArray,
  reputationByRegion: isPlainObject,
  settings: isPlainObject,
  npcs: isPlainObject,
  gigModifiers: isPlainObject,
  setlist: Array.isArray,
  minigame: isNullableObject,
  completedMilestones: Array.isArray,
  assets: Array.isArray,
  liabilities: isObjectOrArray,
  crowdfundCampaigns: Array.isArray,
  rngSeed: isFiniteNumber,
  rivalBand: isNullableObject
} satisfies Partial<Record<keyof GameState, (value: unknown) => boolean>>

const LOADABLE_SAVE_KEYS = Object.keys(PERSISTED_FIELDS) as ReadonlyArray<
  keyof typeof PERSISTED_FIELDS
>

/**
 * Core dependencies required for initializing persistence features.
 *
 * @remarks
 * Encapsulates stable references to React context elements (dispatch, state snapshot)
 * alongside utility services like toast notifications and localization.
 */
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
    if (!Object.hasOwn(parsedObj, key)) continue
    const value = parsedObj[key]
    if (PERSISTED_FIELDS[key](value)) {
      payload[key] = value
    } else {
      logger.warn(
        'Persistence',
        `Skipping invalid type for loadable save key: ${key}`
      )
    }
  }
  return payload
}

/**
 * Serializes the current active game state into a format suitable for local storage persistence.
 *
 * @remarks
 * This function builds a targeted snapshot, intentionally stripping ephemeral properties
 * or UI-specific state variants, while normalizing collections like the band's setlist
 * using dedicated save formatting logic.
 *
 * @param currentState - The full state tree to snapshot.
 * @returns An object containing only the serialized, persistable slice of the game state.
 */
export const createPersistedState = (currentState: GameState) => {
  const persisted: Record<string, unknown> = {}
  for (const key of LOADABLE_SAVE_KEYS) {
    persisted[key] = currentState[key]
  }

  return {
    ...persisted,
    timestamp: Date.now(),
    unlocks: currentState.unlocks,
    setlist: normalizeSetlistForSave(currentState.setlist)
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
          // Write-time finite guard: load-side sanitization is asymmetric, so a
          // reducer regression that introduces NaN/Infinity would otherwise be
          // silently written as null and masked on load. Coerce non-finite
          // numbers to null deterministically and surface a warning so the
          // corruption is visible rather than hidden.
          let hadNonFinite = false
          const nonFiniteKeys = new Set<string>()
          const serialized = JSON.stringify(saveData, (key, value) => {
            if (typeof value === 'number' && !Number.isFinite(value)) {
              hadNonFinite = true
              if (key) {
                nonFiniteKeys.add(key)
              }
              return null
            }
            return value
          })
          if (hadNonFinite) {
            logger.warn(
              'Persistence',
              `Non-finite numeric value detected while saving (keys: ${Array.from(nonFiniteKeys).join(', ')}); coerced to null`
            )
          }
          localStorage.setItem(SAVE_KEY, serialized)
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
  const saveAfterStateCommitRef = useRef(false)
  const saveGameAfterStateCommit = useCallback(() => {
    saveAfterStateCommitRef.current = true
  }, [])

  useEffect(() => {
    const previousScene = previousSceneRef.current
    previousSceneRef.current = currentScene

    const shouldAutosaveOnTransition =
      (previousScene === GAME_PHASES.GIG &&
        currentScene === GAME_PHASES.POST_GIG) ||
      (previousScene === GAME_PHASES.POST_GIG &&
        (currentScene === GAME_PHASES.GAMEOVER ||
          currentScene === GAME_PHASES.OVERWORLD))

    if (saveAfterStateCommitRef.current) {
      saveAfterStateCommitRef.current = false
      saveGame(false)
    } else if (shouldAutosaveOnTransition) {
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
          (u): u is string => typeof u === 'string' && u.length > 0
        )
        const persistentUnlocks = getUnlocks()
        const mergedUnlocks = Array.from(
          new Set(
            [...persistentUnlocks, ...savedUnlocks].filter(u => u.length > 0)
          )
        )
        for (const unlockId of mergedUnlocks) addUnlock(unlockId)

        dispatch(
          createLoadGameAction(createRawLoadPayload(parsedObj, mergedUnlocks))
        )
        return true
      },
      false
    )
  }, [addToast, dispatch, tRef])

  return { deleteSave, saveGame, saveGameAfterStateCommit, loadGame }
}
