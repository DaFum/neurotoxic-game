import { resolveEventChoice } from '../utils/eventEngine'
import {
  finiteNumberOr,
  isFiniteNumber,
  isLooseRecord
} from '../utils/gameState'
import { logger } from '../utils/logger'
import { GAME_PHASES } from '../context/gameConstants'
import {
  createAddCooldownAction,
  createAddQuestAction,
  createAddUnlockAction,
  createApplyEventDeltaAction,
  createSetActiveEventAction
} from '../context/actionCreators'
import type {
  EventDelta,
  EventDeltaPayload,
  GameAction,
  GamePhase,
  GameState,
  QuestState
} from '../types'

/**
 * Typed side effects returned by event resolution for callers to execute.
 */
export type SideEffect =
  | { type: 'persistUnlock'; id: string }
  | { type: 'unlockToast'; id: string }
  | {
      type: 'outcomeToast'
      outcomeKey: string
      descriptionKey: string
      context: Record<string, unknown>
    }
  | {
      type: 'gameOverToast'
      descriptionKey: string
      context: Record<string, unknown>
    }
  | { type: 'changeScene'; scene: GamePhase }
  // Carries no state: the context caller materializes the post-resolution
  // snapshot by replaying the returned actions through the reducer.
  | { type: 'saveGame' }

type EventResolution = {
  actions: GameAction[]
  sideEffects: SideEffect[]
  outcomeText: string
  description: string
  result: unknown
}

const isQuestStateLike = (value: unknown): value is QuestState =>
  isLooseRecord(value) &&
  Object.hasOwn(value, 'id') &&
  typeof (value as Record<string, unknown>).id === 'string'

function buildQuestActions(quests: unknown, currentDay: number): GameAction[] {
  if (!Array.isArray(quests)) return []
  const actions: GameAction[] = []
  for (const q of quests) {
    // Extract the quest representation properly whether it's a string ID or an object
    const rawQuestId =
      typeof q === 'string'
        ? q
        : isLooseRecord(q) && typeof q.id === 'string'
          ? q.id
          : undefined
    if (!rawQuestId) continue
    const baseQuestObj =
      typeof q === 'string' ? { id: q } : (q as Record<string, unknown>)
    const questToAdd = { ...baseQuestObj }
    if (questToAdd.deadlineOffset != null) {
      const rawOffset = questToAdd.deadlineOffset
      const deadlineOffset =
        typeof rawOffset === 'number'
          ? rawOffset
          : typeof rawOffset === 'string' &&
              (rawOffset as string).trim().length > 0
            ? Number(rawOffset)
            : Number.NaN
      if (Number.isFinite(deadlineOffset)) {
        questToAdd.deadline = currentDay + deadlineOffset
      } else {
        logger.warn('eventResolver', 'Skipping invalid quest deadlineOffset', {
          questId: questToAdd.id,
          deadlineOffset: rawOffset
        })
      }
      delete questToAdd.deadlineOffset
    }
    if (!isQuestStateLike(questToAdd)) {
      logger.warn(
        'eventResolver',
        'Skipping malformed quest payload',
        questToAdd
      )
      continue
    }
    actions.push(createAddQuestAction(questToAdd))
  }
  return actions
}

/**
 * Flag fields the event engine may emit on a resolution delta.
 */
type EventFlags = {
  addQuest?: unknown
  unlock?: unknown
  gameOver?: unknown
  addStoryFlag?: string
}

/**
 * Normalizes the engine's generic `addStoryFlag` marker into the structured
 * `addQuest` / `unlock` / `gameOver` flag fields downstream handling expects.
 * @param flags - Delta flag fields (mutated in place).
 * @param result - Raw resolution result carrying the flag payload in `value`.
 */
function remapStoryFlag(flags: EventFlags, result: unknown): void {
  if (!flags.addStoryFlag) return
  if (
    flags.addStoryFlag === 'addQuest' &&
    isLooseRecord(result) &&
    Object.hasOwn(result, 'value')
  ) {
    flags.addQuest = result.value
  } else if (
    flags.addStoryFlag === 'unlock' &&
    isLooseRecord(result) &&
    Object.hasOwn(result, 'value')
  ) {
    flags.unlock = result.value
  } else if (flags.addStoryFlag === 'gameOver') {
    flags.gameOver = true
  }
}

/**
 * Sanitizes a raw unlock id to the persisted `[a-z0-9_]` form.
 * @param raw - Raw unlock string from event data.
 * @returns The normalized id (may be empty if nothing valid remained).
 */
function sanitizeUnlockId(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
}

/**
 * Resolves an event choice into reducer actions and caller-owned side effects.
 */
export function resolveEvent(
  choice: Record<string, unknown> | null,
  state: GameState
): EventResolution {
  if (!choice) {
    return {
      actions: [createSetActiveEventAction(null)],
      sideEffects: [],
      outcomeText: '',
      description: '',
      result: null
    }
  }

  type RawResolution = {
    result?: unknown
    delta?: EventDelta
    outcomeText?: string
    description?: string
    _precomputedResult?: RawResolution
  }

  const selectedChoice = choice as RawResolution & {
    _precomputedResult?: RawResolution
  }

  const resolution: RawResolution =
    selectedChoice._precomputedResult ??
    (resolveEventChoice(
      choice,
      state as unknown as Record<string, unknown>
    ) as RawResolution)

  const { result, delta } = resolution
  const outcomeText = selectedChoice.outcomeText ?? resolution.outcomeText ?? ''
  const description = selectedChoice.description ?? resolution.description ?? ''
  // Shallow-copy so remapStoryFlag never mutates the source delta.flags, which
  // may be a shared/cached `_precomputedResult`. `delta` is optional here (this
  // runs before the `if (delta)` guard), so keep the `?? {}` undefined-guard.
  const flags = { ...(delta?.flags ?? {}) } as EventFlags

  // `eventEngine` uses `{ type: 'flag', flag: '<name>', value: <payload> }` for generic flags.
  // The engine handler stores only the flag name in `delta.flags.addStoryFlag` and leaves the
  // payload in `result.value`. Re-map it so downstream handling can consistently use the
  // normalized `delta.flags` fields (`unlock`, `addQuest`, and `gameOver`).
  remapStoryFlag(flags, result)

  const actions: GameAction[] = []
  const sideEffects: SideEffect[] = []

  const activeEventContext = isLooseRecord(state.activeEvent?.context)
    ? (state.activeEvent.context as Record<string, unknown>)
    : {}

  if (delta) {
    const deltaAction = createApplyEventDeltaAction(delta as EventDeltaPayload)
    actions.push(deltaAction)

    if (flags.addQuest) {
      // Deadlines resolve against the post-delta day. Day deltas are additive
      // (`applyEventDelta`), so compute it purely instead of replaying the
      // reducer here — domain modules must not depend on `gameReducer`.
      const dayDelta =
        isLooseRecord(delta.player) && isFiniteNumber(delta.player.day)
          ? delta.player.day
          : 0
      const questActions = buildQuestActions(
        flags.addQuest,
        finiteNumberOr(state.player.day, 0) + dayDelta
      )
      actions.push(...questActions)
    }

    if (typeof flags.unlock === 'string') {
      const safeUnlockId = sanitizeUnlockId(flags.unlock)
      if (safeUnlockId) {
        const unlockAction = createAddUnlockAction(safeUnlockId)
        actions.push(unlockAction)
        sideEffects.push({ type: 'persistUnlock', id: safeUnlockId })
        sideEffects.push({ type: 'unlockToast', id: safeUnlockId })
      } else {
        logger.warn(
          'eventResolver',
          'Skipping empty or invalid unlock string',
          {
            unlock: flags.unlock
          }
        )
      }
    } else if (flags.unlock != null) {
      logger.warn('eventResolver', 'Skipping non-string unlock value', {
        unlock: flags.unlock
      })
    }

    if (flags.gameOver) {
      sideEffects.push({
        type: 'gameOverToast',
        descriptionKey: description,
        context: activeEventContext
      })

      const clearEventAction = createSetActiveEventAction(null)

      sideEffects.push({ type: 'saveGame' })
      sideEffects.push({ type: 'changeScene', scene: GAME_PHASES.GAMEOVER })
      actions.push(clearEventAction)
      return { actions, sideEffects, outcomeText, description, result }
    }
  }

  if (state.activeEvent?.id) {
    actions.push(createAddCooldownAction(state.activeEvent.id))
  }

  if (outcomeText || description) {
    sideEffects.push({
      type: 'outcomeToast',
      outcomeKey: outcomeText,
      descriptionKey: description,
      context: activeEventContext
    })
  }

  actions.push(createSetActiveEventAction(null))

  return { actions, sideEffects, outcomeText, description, result }
}
