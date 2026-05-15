import { resolveEventChoice } from '../utils/eventEngine'
import { isPlainObject } from '../utils/gameStateUtils'
import { logger } from '../utils/logger'
import { gameReducer } from '../context/gameReducer'
import { GAME_PHASES } from '../context/gameConstants'
import {
  createAddCooldownAction,
  createAddQuestAction,
  createAddUnlockAction,
  createApplyEventDeltaAction,
  createSetActiveEventAction
} from '../context/actionCreators'
import type {
  EventDeltaPayload,
  GameAction,
  GamePhase,
  GameState,
  QuestState
} from '../types'

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
  | { type: 'saveGame'; state: GameState }

type EventResolution = {
  actions: GameAction[]
  sideEffects: SideEffect[]
  outcomeText: string
  description: string
  result: unknown
}

const isQuestStateLike = (value: unknown): value is QuestState =>
  isPlainObject(value) &&
  typeof (value as Record<string, unknown>).id === 'string'

function buildQuestActions(quests: unknown, currentDay: number): GameAction[] {
  if (!Array.isArray(quests)) return []
  const actions: GameAction[] = []
  for (const q of quests) {
    const questToAdd = { ...(q as Record<string, unknown>) }
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
    delta?: {
      flags?: { addQuest?: unknown; unlock?: unknown; gameOver?: unknown }
      [key: string]: unknown
    }
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
  const flags = (delta?.flags ?? {}) as {
    addQuest?: unknown
    unlock?: unknown
    gameOver?: unknown
    addStoryFlag?: string
  }

  // `eventEngine` uses `{ type: 'flag', flag: '<name>', value: <payload> }` for generic flags.
  // The engine handler stores only the flag name in `delta.flags.addStoryFlag` and leaves the
  // payload in `result.value`. We re-map it here so downstream handling can consistently use the
  // normalized `delta.flags` fields (`unlock`, `addQuest`, and `gameOver`).
  if (flags.addStoryFlag) {
    if (
      flags.addStoryFlag === 'addQuest' &&
      isPlainObject(result) &&
      Object.hasOwn(result as object, 'value')
    ) {
      flags.addQuest = (result as Record<string, unknown>).value
    } else if (
      flags.addStoryFlag === 'unlock' &&
      isPlainObject(result) &&
      Object.hasOwn(result as object, 'value')
    ) {
      flags.unlock = (result as Record<string, unknown>).value
    } else if (flags.addStoryFlag === 'gameOver') {
      flags.gameOver = true
    }
  }

  const actions: GameAction[] = []
  const sideEffects: SideEffect[] = []

  const activeEventContext = isPlainObject(state.activeEvent?.context)
    ? (state.activeEvent.context as Record<string, unknown>)
    : {}

  if (delta) {
    const deltaAction = createApplyEventDeltaAction(delta as EventDeltaPayload)
    actions.push(deltaAction)

    // Compute preview state for saveGame (pure — no side effects)
    let previewState = gameReducer(state, deltaAction)

    if (flags.addQuest) {
      const questActions = buildQuestActions(
        flags.addQuest,
        previewState.player.day
      )
      actions.push(...questActions)
      for (const qa of questActions) {
        previewState = gameReducer(previewState, qa)
      }
    }

    if (typeof flags.unlock === 'string') {
      const safeUnlockId = flags.unlock
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
      if (safeUnlockId) {
        const unlockAction = createAddUnlockAction(safeUnlockId)
        actions.push(unlockAction)
        previewState = gameReducer(previewState, unlockAction)
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
      const finalPreviewState = gameReducer(previewState, clearEventAction)

      sideEffects.push({ type: 'saveGame', state: finalPreviewState })
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
