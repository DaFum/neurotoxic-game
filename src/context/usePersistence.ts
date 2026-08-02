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
import {
  isStorageDegraded,
  readStorageItem,
  removeStorageItem,
  safeStorageOperation,
  writeStorageItem
} from '../utils/storage'
import { validateSaveData } from '../utils/saveValidator'
import { addUnlock, getUnlocks } from '../utils/unlockManager'
import { logger } from '../utils/logger'
import { quarantineSave } from '../utils/saveQuarantine'
import { systemClock } from '../utils/clock'
import type { IClock } from '../utils/clock'
import { useClock } from './ClockContext'
import { GAME_PHASES } from './gameConstants'
import { CURRENT_SAVE_VERSION, runSaveMigrations } from './reducers/migrations'
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
  runSeed: isFiniteNumber,
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
 * Reads the version marker from a parsed save payload.
 *
 * @param parsedObj - Parsed save object.
 * @returns Stored version, or `0` when the marker is missing or unusable.
 */
const readSaveVersion = (parsedObj: Record<string, unknown>): number => {
  if (!Object.hasOwn(parsedObj, 'version')) return 0
  const parsedVersion = Number(parsedObj.version)
  return Number.isFinite(parsedVersion) ? parsedVersion : 0
}

/**
 * Folds a parsed save through the migration chain, quarantining the raw payload
 * when a migration step fails.
 *
 * @param parsedObj - Parsed save object that passed shape validation.
 * @param rawSave - Exact serialized payload, copied aside on failure.
 * @returns Migrated payload stamped with the current version, or `null` when a
 * migration step threw.
 *
 * @remarks
 * The raw payload is quarantined *before* the caller falls back to the initial
 * state, so the next autosave cannot overwrite the only copy of the player's run.
 */
export const migrateLoadedSave = (
  parsedObj: Record<string, unknown>,
  rawSave: string
): Record<string, unknown> | null => {
  const storedVersion = readSaveVersion(parsedObj)
  if (storedVersion >= CURRENT_SAVE_VERSION) return parsedObj

  try {
    const migrated = runSaveMigrations(parsedObj, storedVersion)
    if (!isLooseRecord(migrated)) {
      throw new StateError(
        `Migration from version ${storedVersion} produced a non-object payload`
      )
    }
    return { ...migrated, version: CURRENT_SAVE_VERSION }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    quarantineSave(rawSave, storedVersion, reason)
    logger.error(
      'Persistence',
      `Save migration from version ${storedVersion} failed`,
      reason
    )
    return null
  }
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
 * @param clock - Clock supplying the save timestamp. Defaults to the real clock.
 * @returns An object containing only the serialized, persistable slice of the game state.
 */
export const createPersistedState = (
  currentState: GameState,
  clock: IClock = systemClock
) => {
  const persisted: Record<string, unknown> = {}
  for (const key of LOADABLE_SAVE_KEYS) {
    persisted[key] = currentState[key]
  }

  return {
    ...persisted,
    timestamp: clock.now(),
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
  const clock = useClock()

  const deleteSave = useCallback(() => {
    safeStorageOperation('deleteSave', () => {
      removeStorageItem(SAVE_KEY)
    })
    window.location.reload()
  }, [])

  // Storage that refuses writes (private browsing, disabled by policy) degrades
  // to an in-memory store for the session. The player is told once — repeating
  // it on every autosave would be noise.
  const storageNoticeShownRef = useRef(false)
  const notifyStorageDegraded = useCallback(() => {
    if (storageNoticeShownRef.current) return
    storageNoticeShownRef.current = true
    addToast(
      tRef.current('ui:save.storageUnavailable', {
        defaultValue:
          'Storage is unavailable in this browser mode. Progress is kept for this session only and will not persist.'
      }),
      'error'
    )
  }, [addToast, tRef])

  const saveGame = useCallback(
    (showToast = true, stateSnapshot: GameState = stateRef.current) => {
      const saveData = createPersistedState(stateSnapshot, clock)

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
          return writeStorageItem(SAVE_KEY, serialized)
        },
        false
      )

      if (success) {
        if (showToast) {
          addToast(tRef.current('ui:toast.gameSaved'), 'success')
        }
        logger.info('System', 'Game Saved Successfully', null)
      } else if (isStorageDegraded()) {
        notifyStorageDegraded()
        logger.warn('System', 'Game saved to in-memory fallback store')
      } else {
        handleError(new StorageError('Failed to save game'), { addToast })
      }
    },
    [addToast, clock, notifyStorageDegraded, stateRef, tRef]
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
        let rawSave: string
        try {
          const saved = readStorageItem(SAVE_KEY)
          if (!saved) return false
          rawSave = saved
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

        const migratedObj = migrateLoadedSave(parsedObj, rawSave)
        if (!migratedObj) {
          handleError(
            new StateError(
              tRef.current('ui:save.migrationFailed', {
                defaultValue:
                  'Save file could not be upgraded. A copy was kept for recovery; falling back to initial state.'
              })
            ),
            { addToast }
          )
          return false
        }

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
          createLoadGameAction(createRawLoadPayload(migratedObj, mergedUnlocks))
        )
        return true
      },
      false
    )
  }, [addToast, dispatch, tRef])

  return { deleteSave, saveGame, saveGameAfterStateCommit, loadGame }
}
