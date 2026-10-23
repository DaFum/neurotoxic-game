import {
  type Dispatch,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
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
  defaultStorageAdapter,
  isStorageDegraded,
  listStorageKeys,
  readStorageItem,
  readStorageItemChecked,
  removeStorageItem,
  safeStorageOperation,
  writeStorageItem
} from '../utils/storage'
import type { IStorageAdapter } from '../utils/storageAdapter'
import { validateSaveData } from '../utils/saveValidator'
import { addUnlock, getUnlocks } from '../utils/unlockManager'
import { logger } from '../utils/logger'
import { quarantineSave } from '../utils/saveQuarantine'
import { systemClock } from '../utils/clock'
import type { IClock } from '../utils/clock'
import { useClock } from './ClockContext'
import { useStorage } from './StorageContext'
import { GAME_PHASES } from './gameConstants'
import { CURRENT_SAVE_VERSION, runSaveMigrations } from './reducers/migrations'
import { parseSaveVersion } from '../utils/saveVersion'
import { createLoadGameAction } from './actionCreators'
import { createInitialState } from './initialState'
import { handleLoadGame } from './reducers/systemReducer'
import type {
  GameAction,
  GameState,
  LoadGameResult,
  LoadPreviewResult
} from '../types'
import type { OptionalToastCallback } from '../types/callbacks'

/**
 * The string identifier used to store and retrieve the game's save payload in local storage.
 */
export const SAVE_KEY = 'neurotoxic_v3_save'

/**
 * Highest save version written to the shared `SAVE_KEY`. Every shipped build
 * writes there; later versions each write a slot of their own.
 */
const SHARED_SLOT_MAX_VERSION = 2

const VERSION_SLOT_PREFIX = `${SAVE_KEY}.v`

/**
 * Resolves the storage key a build at the given save version writes to.
 *
 * @param version - Save version of the writing build.
 * @returns `SAVE_KEY` up to version 2, else `SAVE_KEY.v<version>`.
 *
 * @remarks
 * Builds on different versions never share a key, so a tab on an older build
 * cannot overwrite a newer build's save in the gap between its newer-save
 * check and its write.
 */
export const getSaveSlotKey = (version: number): string =>
  version <= SHARED_SLOT_MAX_VERSION
    ? SAVE_KEY
    : `${VERSION_SLOT_PREFIX}${version}`

/**
 * Lists the version-specific save slots present in storage.
 *
 * @param storage - Adapter the keys are enumerated through.
 * @returns Each slot's key and the version its name carries.
 */
const listVersionSlots = (
  storage: IStorageAdapter
): { key: string; version: number }[] => {
  const slots: { key: string; version: number }[] = []
  for (const key of listStorageKeys(storage)) {
    if (!key.startsWith(VERSION_SLOT_PREFIX)) continue
    const version = parseSaveVersion(key.slice(VERSION_SLOT_PREFIX.length))
    if (version !== null && version > SHARED_SLOT_MAX_VERSION) {
      slots.push({ key, version })
    }
  }
  return slots
}

/**
 * Highest version among slots this build cannot load.
 *
 * @param storage - Adapter the keys are enumerated through.
 * @returns That version, or `null` when every slot is loadable.
 */
const readNewestIncompatibleSlotVersion = (
  storage: IStorageAdapter
): number | null => {
  let newest: number | null = null
  for (const { version } of listVersionSlots(storage)) {
    if (version > CURRENT_SAVE_VERSION && (newest === null || version > newest))
      newest = version
  }
  return newest
}

/**
 * Whether any save slot, shared or version-specific, holds a save.
 *
 * @param storage - Adapter to look through; defaults to the production singleton.
 * @returns `true` when a save exists in any slot, loadable or not.
 */
export const hasStoredSave = (
  storage: IStorageAdapter = defaultStorageAdapter
): boolean =>
  !!readStorageItem(SAVE_KEY, storage) || listVersionSlots(storage).length > 0

const isNullableObject = (value: unknown): boolean =>
  value === null || isLooseRecord(value)

const isObjectOrArray = (value: unknown): boolean =>
  isLooseRecord(value) || Array.isArray(value)

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
  player: isLooseRecord,
  band: isLooseRecord,
  social: isLooseRecord,
  gameMap: isNullableObject,
  currentGig: isNullableObject,
  lastGigStats: isNullableObject,
  activeEvent: isNullableObject,
  terminalOutcome: isNullableObject,
  pendingSupplyStopInventory: (value: unknown): boolean =>
    value === null || Array.isArray(value),
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
  reputationByRegion: isLooseRecord,
  settings: isLooseRecord,
  gigModifiers: isLooseRecord,
  pendingGigSettlement: isNullableObject,
  setlist: Array.isArray,
  minigame: isNullableObject,
  completedMilestones: Array.isArray,
  assets: Array.isArray,
  liabilities: isObjectOrArray,
  crowdfundCampaigns: Array.isArray,
  rngSeed: isFiniteNumber,
  runSeed: isFiniteNumber,
  rivalBand: isNullableObject,
  expedition: isLooseRecord,
  career: isLooseRecord
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
  return parseSaveVersion(parsedObj.version) ?? 0
}

/**
 * Reads the version of the save currently in the slot when it is newer than
 * this build supports.
 *
 * @param storage - Adapter the slot is read through.
 * @returns The stored version when it exceeds `CURRENT_SAVE_VERSION`,
 * `'unreadable'` when the slot could not be read at all, else `null` (no
 * save, unparseable, or a version this build can load).
 *
 * @remarks
 * Read from storage at write time rather than remembered from the last load,
 * so a newer save written by another tab mid-session is protected as well.
 * An unreadable slot is reported apart from an empty one: writing over it
 * would seed the in-memory fallback, which shadows persistent storage and
 * would later overwrite a newer save once storage recovers.
 */
const readNewerStoredSaveVersion = (
  storage: IStorageAdapter
): number | 'unreadable' | null => {
  const { ok, value: saved } = readStorageItemChecked(SAVE_KEY, storage)
  if (!ok) return 'unreadable'
  const newestSlotVersion = readNewestIncompatibleSlotVersion(storage)
  if (newestSlotVersion !== null) return newestSlotVersion
  // Legacy defence: the shared key itself carrying a newer payload.
  if (!saved) return null
  let parsed: unknown
  try {
    parsed = safeJsonParse(saved)
  } catch (_error) {
    return null
  }
  if (!isLooseRecord(parsed)) return null
  const storedVersion = readSaveVersion(parsed)
  return storedVersion > CURRENT_SAVE_VERSION ? storedVersion : null
}

/**
 * Picks the slot this build loads from: the highest version-specific slot it
 * supports, else the shared key.
 *
 * @param storage - Adapter the keys are enumerated through.
 * @returns Storage key to read the save from.
 *
 * @remarks
 * Lower slots are never deleted: the older build's save stays where it was,
 * so going back to that build still finds it.
 */
const resolveLoadSlotKey = (storage: IStorageAdapter): string => {
  let best: { key: string; version: number } | null = null
  for (const slot of listVersionSlots(storage)) {
    if (
      slot.version <= CURRENT_SAVE_VERSION &&
      (best === null || slot.version > best.version)
    )
      best = slot
  }
  return best?.key ?? SAVE_KEY
}

/**
 * Folds a parsed save through the migration chain, quarantining the raw payload
 * when a migration step fails.
 *
 * @param parsedObj - Parsed save object that passed shape validation.
 * @param rawSave - Exact serialized payload, copied aside on failure.
 * @param adapter - Storage backend the quarantine copy is written to.
 * @param options - `quarantine: false` runs the migration without writing the
 * quarantine copy or logging a failure, for a preview that must not write.
 * @returns Migrated payload stamped with the current version, or `null` when a
 * migration step threw.
 *
 * @remarks
 * The raw payload is quarantined *before* the caller falls back to the initial
 * state, so the next autosave cannot overwrite the only copy of the player's run.
 */
export const migrateLoadedSave = (
  parsedObj: Record<string, unknown>,
  rawSave: string,
  adapter: IStorageAdapter = defaultStorageAdapter,
  options: { quarantine?: boolean } = {}
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
    // A preview only asks whether the save would load: it must not write the
    // quarantine copy or log the failure.
    if (options.quarantine === false) return null
    const reason = error instanceof Error ? error.message : String(error)
    quarantineSave(rawSave, storedVersion, reason, adapter)
    logger.error(
      'Persistence',
      `Save migration from version ${storedVersion} failed`,
      reason
    )
    return null
  }
}

/**
 * How a refused load is reported. A real load toasts and logs each refusal; a
 * preview passes {@link SILENT_LOAD_REPORTER} so nothing leaves the helper.
 */
type LoadReporter = {
  unreadable: () => void
  incompatible: (saveVersion: number) => void
  parseFailed: () => void
  corruptFailed: (reason?: string) => void
  migrationFailed: () => void
}

const SILENT_LOAD_REPORTER: LoadReporter = {
  unreadable: () => {},
  incompatible: () => {},
  parseFailed: () => {},
  corruptFailed: () => {},
  migrationFailed: () => {}
}

/** The reasons a stored save is refused, before any reducer sees it. */
type StoredSaveRefusal = 'missing' | 'incompatible' | 'corrupt' | 'unreadable'

type StoredSaveEvaluation =
  | {
      ok: true
      /** The parsed, validated and migrated save. */
      migrated: Record<string, unknown>
      /** Persistent unlocks merged with the ones the save carries. */
      unlocks: string[]
    }
  | { ok: false; reason: StoredSaveRefusal }

/**
 * Selects the stored slot and decides whether it may load: version guards,
 * parsing, validation and migration.
 *
 * @param storage - Storage backend the slot is read from.
 * @param report - How each refusal is reported.
 * @param preview - Skips every write: the migration quarantine copy. Reads and
 * the unlock merge are unchanged, so a preview reaches the verdict a load would.
 * @returns The accepted payload, or the reason the save is refused.
 *
 * @remarks
 * The one place `loadGame` and `previewLoadGame` decide acceptance, so the
 * preview cannot drift from what a load does. It reports only through `report`
 * and writes nothing itself; the load applies the accepted payload.
 */
const evaluateStoredSave = (
  storage: IStorageAdapter,
  report: LoadReporter,
  preview: boolean
): StoredSaveEvaluation => {
  let parsed: unknown
  let rawSave: string
  try {
    // The same guard saveGame applies: anything newer than this build
    // (a slot of its own or a newer payload in the shared key) means a
    // loaded session could never be saved. Say so rather than loading or
    // reporting no save at all. An unreadable slot refuses too: a newer
    // save cannot be ruled out, and saveGame would refuse every save of
    // the session it started.
    const newerVersion = readNewerStoredSaveVersion(storage)
    if (newerVersion === 'unreadable') {
      report.unreadable()
      return { ok: false, reason: 'unreadable' }
    }
    if (typeof newerVersion === 'number') {
      report.incompatible(newerVersion)
      return { ok: false, reason: 'incompatible' }
    }
    const saved = readStorageItem(resolveLoadSlotKey(storage), storage)
    if (!saved) return { ok: false, reason: 'missing' }
    rawSave = saved
    parsed = safeJsonParse(saved)
  } catch (_error) {
    report.parseFailed()
    return { ok: false, reason: 'corrupt' }
  }

  if (!isLooseRecord(parsed)) {
    report.corruptFailed()
    return { ok: false, reason: 'corrupt' }
  }

  // Checked before shape validation: a newer schema may legitimately
  // fail this build's validator, and it must not be reported as corrupt.
  // Nothing is written on this path, so the stored save stays as it was.
  const storedVersion = readSaveVersion(parsed)
  if (storedVersion > CURRENT_SAVE_VERSION) {
    report.incompatible(storedVersion)
    return { ok: false, reason: 'incompatible' }
  }

  try {
    validateSaveData(parsed)
  } catch (error) {
    report.corruptFailed(error instanceof Error ? error.message : String(error))
    return { ok: false, reason: 'corrupt' }
  }

  const parsedObj = parsed as Record<string, unknown>

  const migratedObj = migrateLoadedSave(parsedObj, rawSave, storage, {
    quarantine: !preview
  })
  if (!migratedObj) {
    report.migrationFailed()
    return { ok: false, reason: 'corrupt' }
  }

  const savedRaw = Array.isArray(parsedObj.unlocks) ? parsedObj.unlocks : []
  const savedUnlocks = savedRaw.filter(
    (u): u is string => typeof u === 'string' && u.length > 0
  )
  const persistentUnlocks = getUnlocks(storage)
  const mergedUnlocks = Array.from(
    new Set([...persistentUnlocks, ...savedUnlocks].filter(u => u.length > 0))
  )
  return { ok: true, migrated: migratedObj, unlocks: mergedUnlocks }
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
 * Creates save, load, and delete-save callbacks plus post-gig exit autosave behavior.
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
  const storage = useStorage()

  const deleteSave = useCallback(() => {
    safeStorageOperation('deleteSave', () => {
      removeStorageItem(SAVE_KEY, storage)
      // Every version slot goes too: load picks the highest one left, so a
      // survivor would bring the deleted progress back.
      for (const { key } of listVersionSlots(storage)) {
        removeStorageItem(key, storage)
      }
    })
    window.location.reload()
  }, [storage])

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

  // An unreadable slot refuses every save, so the player is told once rather
  // than on every autosave.
  const slotUnreadableNoticeShownRef = useRef(false)
  const notifySlotUnreadable = useCallback(() => {
    if (slotUnreadableNoticeShownRef.current) return
    slotUnreadableNoticeShownRef.current = true
    addToast(
      tRef.current('ui:save.slotUnreadable', {
        defaultValue:
          'The save could not be read, so saving was skipped to protect any existing save. Progress will not be saved until storage works again.'
      }),
      'error'
    )
  }, [addToast, tRef])

  const incompatibleSaveMessage = useCallback(
    (saveVersion: number) =>
      tRef.current('ui:save.incompatibleVersion', {
        saveVersion,
        supportedVersion: CURRENT_SAVE_VERSION,
        defaultValue:
          'This save was made by a newer version of the game (save version {{saveVersion}}, this version supports up to {{supportedVersion}}). It was left untouched and will not be overwritten; update the game to continue it.'
      }),
    [tRef]
  )

  // Every save request is refused while the slot holds a newer save, so the
  // notice is shown once per session rather than on every autosave.
  const incompatibleNoticeShownRef = useRef(false)

  /**
   * Writes the save, reporting whether the write actually landed.
   *
   * @remarks
   * The boolean exists for the crash-safe unlock journal: a caller that
   * persists a marker between a debit and a grant has to know whether the
   * marker survived, or it cannot decide between committing and refunding.
   * Every other caller ignores it.
   */
  const saveGame = useCallback(
    (
      showToast = true,
      stateSnapshot: GameState = stateRef.current
    ): boolean => {
      // A save from a newer build is the player's only copy of that progress;
      // this build cannot represent it, so it never writes over it.
      // Adapter reads report failure as `null` rather than throwing.
      const newerStoredVersion = readNewerStoredSaveVersion(storage)
      if (newerStoredVersion === 'unreadable') {
        logger.warn(
          'Persistence',
          'Save skipped: the save slot cannot be read, so a newer save cannot be ruled out'
        )
        notifySlotUnreadable()
        return false
      }
      if (newerStoredVersion !== null) {
        logger.warn(
          'Persistence',
          `Save skipped: slot holds save version ${newerStoredVersion}, newer than ${CURRENT_SAVE_VERSION}`
        )
        if (!incompatibleNoticeShownRef.current) {
          incompatibleNoticeShownRef.current = true
          addToast(incompatibleSaveMessage(newerStoredVersion), 'error')
        }
        return false
      }

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
          return writeStorageItem(
            getSaveSlotKey(CURRENT_SAVE_VERSION),
            serialized,
            storage
          )
        },
        false
      )

      if (success) {
        if (showToast) {
          addToast(tRef.current('ui:toast.gameSaved'), 'success')
        }
        logger.info('System', 'Game Saved Successfully', null)
      } else if (isStorageDegraded(storage)) {
        notifyStorageDegraded()
        logger.warn('System', 'Game saved to in-memory fallback store')
      } else {
        handleError(new StorageError('Failed to save game'), {
          addToast,
          fallbackMessage: tRef.current('ui:save.saveFailed', {
            defaultValue: 'Failed to save game.'
          })
        })
      }
      return success === true
    },
    [
      addToast,
      clock,
      incompatibleSaveMessage,
      notifySlotUnreadable,
      notifyStorageDegraded,
      stateRef,
      storage,
      tRef
    ]
  )

  const previousSceneRef = useRef(currentScene)
  // A request counter rather than a flag: the effect below has to *run* for
  // the save to happen, and a ref cannot wake it. Counting in state makes the
  // request part of the same commit as the dispatch it follows, so a state
  // change inside one scene persists now instead of waiting for the next
  // scene transition - which is what a command that changes persisted state
  // without navigating needs.
  const [saveRequestCount, setSaveRequestCount] = useState(0)
  const handledSaveRequestRef = useRef(0)
  // Continuations waiting on the durability of that save. A caller sitting
  // between a debit and a grant cannot read the write's outcome from a
  // fire-and-forget request, and it is the only thing that may decide between
  // committing and refunding.
  const saveRequestListenersRef = useRef<((saved: boolean) => void)[]>([])
  const saveGameAfterStateCommit = useCallback(
    (onSaved?: (saved: boolean) => void) => {
      if (onSaved) {
        saveRequestListenersRef.current.push(onSaved)
      }
      setSaveRequestCount(count => count + 1)
    },
    []
  )

  useEffect(() => {
    const previousScene = previousSceneRef.current
    previousSceneRef.current = currentScene

    // GIG -> POST_GIG is deliberately not autosaved. The post-gig screen
    // records the pending gig settlement and requests the first POST_GIG
    // save itself; a snapshot taken here would land without that record, and
    // a crash before the record's save would restore a played gig whose
    // payout nothing can settle. Without it, the last durable save before
    // the record is the pre-gig one, so that crash replays the gig instead.
    // OVERWORLD -> GAMEOVER is the stranded check: its own save runs before the
    // scene change, so the ending (and the settled run) is only durable here.
    const shouldAutosaveOnTransition =
      (previousScene === GAME_PHASES.POST_GIG &&
        (currentScene === GAME_PHASES.GAMEOVER ||
          currentScene === GAME_PHASES.OVERWORLD)) ||
      (previousScene === GAME_PHASES.OVERWORLD &&
        currentScene === GAME_PHASES.GAMEOVER)

    if (handledSaveRequestRef.current !== saveRequestCount) {
      handledSaveRequestRef.current = saveRequestCount
      const saved = saveGame(false)
      // Taken before they run: a continuation may request the next save, and
      // that request belongs to the next commit rather than to this flush.
      const listeners = saveRequestListenersRef.current
      saveRequestListenersRef.current = []
      for (const onSaved of listeners) {
        onSaved(saved)
      }
    } else if (shouldAutosaveOnTransition) {
      saveGame(false)
    }
  }, [currentScene, saveGame, saveRequestCount])

  const loadGame = useCallback((): LoadGameResult => {
    const report: LoadReporter = {
      unreadable: () => {
        logger.warn('Persistence', 'Load skipped: the save slot cannot be read')
        addToast(
          tRef.current('ui:save.loadUnreadable', {
            defaultValue:
              'The save could not be read, so it was not loaded. Progress will not be saved until storage works again.'
          }),
          'error'
        )
      },
      incompatible: saveVersion =>
        handleError(new StateError(incompatibleSaveMessage(saveVersion)), {
          addToast
        }),
      parseFailed: () =>
        handleError(
          new StateError(
            tRef.current('ui:save.parseFailed', {
              defaultValue:
                'Save file parsing failed. Falling back to initial state.'
            })
          ),
          { addToast }
        ),
      corruptFailed: reason =>
        handleError(
          new StateError(
            tRef.current('ui:save.corruptFailed', {
              defaultValue: 'Save file is corrupt or invalid.'
            }),
            ...(reason === undefined ? [] : [{ reason }])
          ),
          { addToast }
        ),
      migrationFailed: () =>
        handleError(
          new StateError(
            tRef.current('ui:save.migrationFailed', {
              defaultValue:
                'Save file could not be upgraded. A copy was kept for recovery; falling back to initial state.'
            })
          ),
          { addToast }
        )
    }
    const refuseUnreadable = (): LoadGameResult => {
      report.unreadable()
      return { ok: false, reason: 'unreadable' }
    }
    // Returned by identity when the storage operation itself keeps throwing, so
    // that case is told apart from a refusal the operation already reported.
    const storageFailed: LoadGameResult = { ok: false, reason: 'unreadable' }
    const result = safeStorageOperation(
      'loadGame',
      (): LoadGameResult => {
        const evaluation = evaluateStoredSave(storage, report, false)
        if (!evaluation.ok) return { ok: false, reason: evaluation.reason }

        for (const unlockId of evaluation.unlocks) addUnlock(unlockId, storage)

        dispatch(
          createLoadGameAction(
            createRawLoadPayload(evaluation.migrated, evaluation.unlocks)
          )
        )
        // LOAD_GAME consumes a pending gig settlement in memory only; persist
        // the settled ledger and the cleared record in the same commit.
        if (isLooseRecord(evaluation.migrated.pendingGigSettlement)) {
          saveGameAfterStateCommit()
        }
        return { ok: true }
      },
      storageFailed
    )
    // The operation's failure was handled silently, so the player is told here.
    return result === storageFailed ? refuseUnreadable() : result
  }, [
    addToast,
    dispatch,
    incompatibleSaveMessage,
    saveGameAfterStateCommit,
    storage,
    tRef
  ])

  /**
   * What a load of the selected save would do, without doing it.
   *
   * @returns `missing`, `unavailable` with the refusal reason, `terminal` when
   * the loaded state would land on GAMEOVER, else `resumable`.
   *
   * @remarks
   * Runs the same acceptance path as `loadGame` in preview mode, then applies
   * the load reducer to a fresh state, so the verdict is the reducer's own scene
   * selection. It dispatches nothing, shows no toast, reports no error and
   * writes no storage.
   */
  const previewLoadGame = useCallback((): LoadPreviewResult => {
    let evaluation: StoredSaveEvaluation
    try {
      evaluation = evaluateStoredSave(storage, SILENT_LOAD_REPORTER, true)
    } catch (_error) {
      return { status: 'unavailable', reason: 'unreadable' }
    }
    if (!evaluation.ok) {
      return evaluation.reason === 'missing'
        ? { status: 'missing' }
        : { status: 'unavailable', reason: evaluation.reason }
    }
    const action = createLoadGameAction(
      createRawLoadPayload(evaluation.migrated, evaluation.unlocks)
    )
    const loaded = handleLoadGame(
      createInitialState({ storage }),
      action.payload
    )
    return loaded.currentScene === GAME_PHASES.GAMEOVER
      ? { status: 'terminal' }
      : { status: 'resumable' }
  }, [storage])

  return {
    deleteSave,
    saveGame,
    saveGameAfterStateCommit,
    loadGame,
    previewLoadGame
  }
}
