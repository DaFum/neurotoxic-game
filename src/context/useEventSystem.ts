import { type Dispatch, type MutableRefObject, useCallback } from 'react'
import type { TFunction } from 'i18next'
import { addUnlock } from '../utils/unlockManager'
import { eventEngine, resolveEventChoice } from '../utils/eventEngine'
import { isPlainObject } from '../utils/gameStateUtils'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import { gameReducer } from './gameReducer'
import {
  createAddCooldownAction,
  createAddQuestAction,
  createAddUnlockAction,
  createApplyEventDeltaAction,
  createPopPendingEventAction,
  createSetActiveEventAction,
  createUpdatePlayerAction
} from './actionCreators'
import type { GameAction, GameState, QuestState } from '../types/game'
import type { OptionalToastCallback } from '../types/callbacks'

type ChangeScene = (scene: string) => void
type SaveGame = (showToast?: boolean, stateSnapshot?: GameState) => void

type EventResolution = {
  result?: unknown
  delta?: {
    flags?: {
      addQuest?: unknown
      unlock?: unknown
      gameOver?: unknown
    }
    [key: string]: unknown
  }
  outcomeText?: string
  description?: string
}

type EventChoiceWithPrecomputedResult = Record<string, unknown> & {
  _precomputedResult?: EventResolution
  outcomeText?: string
  description?: string
}

type UseEventSystemParams = {
  stateRef: MutableRefObject<GameState>
  dispatch: Dispatch<GameAction>
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
}

const isQuestStateLike = (value: unknown): value is QuestState =>
  isPlainObject(value) && typeof value.id === 'string'

const processAddQuests = (
  quests: unknown,
  currentDay: number,
  dispatch: Dispatch<GameAction>
): QuestState[] => {
  if (!Array.isArray(quests)) return []

  const addedQuests: QuestState[] = []

  quests.forEach(q => {
    const questToAdd = { ...(q as Record<string, unknown>) }
    if (questToAdd.deadlineOffset != null) {
      const rawOffset = questToAdd.deadlineOffset
      const deadlineOffset =
        typeof rawOffset === 'number'
          ? rawOffset
          : typeof rawOffset === 'string' && rawOffset.trim().length > 0
            ? Number(rawOffset)
            : Number.NaN
      if (Number.isFinite(deadlineOffset)) {
        questToAdd.deadline = currentDay + deadlineOffset
      } else {
        logger.warn(
          'GameState',
          'Skipping invalid quest deadlineOffset in processAddQuests',
          { questId: questToAdd.id, deadlineOffset: rawOffset }
        )
      }
      delete questToAdd.deadlineOffset
    }
    if (!isQuestStateLike(questToAdd)) {
      logger.warn(
        'GameState',
        'Skipping malformed quest payload in processAddQuests',
        questToAdd
      )
      return
    }
    const action = createAddQuestAction(questToAdd)
    dispatch(action)
    addedQuests.push(questToAdd)
  })
  return addedQuests
}

export function useEventSystem({
  stateRef,
  dispatch,
  addToast,
  changeScene,
  saveGame,
  tRef
}: UseEventSystemParams) {
  const setActiveEvent = useCallback(
    (event: Parameters<typeof createSetActiveEventAction>[0]) =>
      dispatch(createSetActiveEventAction(event)),
    [dispatch]
  )

  const triggerEvent = useCallback(
    (category: string, triggerPoint: string | null = null) => {
      const currentState = stateRef.current
      // "GIG" scene should not be interrupted unless critical logic allows it.
      if (currentState.currentScene === GAME_PHASES.GIG) {
        return false
      }

      if ((currentState.player?.eventsTriggeredToday ?? 0) >= 2) {
        return false
      }

      const context = currentState
      const event = eventEngine.checkEvent(category, context, triggerPoint)

      if (event) {
        const processedEvent = eventEngine.processOptions(event, context)
        if (!processedEvent) {
          return false
        }
        const processedEventId =
          typeof processedEvent.id === 'string' ? processedEvent.id : undefined

        setActiveEvent(processedEvent)
        dispatch(
          createUpdatePlayerAction({
            eventsTriggeredToday:
              (currentState.player?.eventsTriggeredToday ?? 0) + 1
          })
        )

        if (
          typeof processedEventId === 'string' &&
          currentState.pendingEvents[0] === processedEventId
        ) {
          dispatch(createPopPendingEventAction())
        }
        return true
      }
      return false
    },
    [dispatch, setActiveEvent, stateRef]
  )

  const resolveEvent = useCallback(
    (
      choice: Record<string, unknown> | null
    ): { outcomeText: string; description: string; result: unknown } => {
      if (!choice) {
        setActiveEvent(null)
        return { outcomeText: '', description: '', result: null }
      }

      const currentState = stateRef.current
      const selectedChoice: EventChoiceWithPrecomputedResult = choice

      try {
        const activeEventContext = isPlainObject(
          currentState.activeEvent?.context
        )
          ? currentState.activeEvent.context
          : {}

        const resolution: EventResolution =
          selectedChoice._precomputedResult ||
          (resolveEventChoice(
            choice,
            currentState as unknown as Record<string, unknown>
          ) as EventResolution)
        const { result, delta, outcomeText, description } = resolution
        const flags = (delta?.flags || {}) as {
          addQuest?: unknown
          unlock?: unknown
          gameOver?: unknown
        }

        if (delta) {
          let previewState = currentState
          const deltaAction = createApplyEventDeltaAction(delta)
          previewState = gameReducer(previewState, deltaAction)
          dispatch(deltaAction)

          if (flags.addQuest) {
            const addedQuests = processAddQuests(
              flags.addQuest,
              currentState.player.day,
              dispatch
            )
            for (const quest of addedQuests) {
              previewState = gameReducer(
                previewState,
                createAddQuestAction(quest)
              )
            }
          }

          if (flags.unlock) {
            const rawUnlock = String(flags.unlock)
            const safeUnlockId = rawUnlock
              .trim()
              .replace(/[^a-zA-Z0-9_]/g, '')
              .toLowerCase()

            if (safeUnlockId) {
              const unlockAction = createAddUnlockAction(safeUnlockId)
              previewState = gameReducer(previewState, unlockAction)
              dispatch(unlockAction)

              const added = addUnlock(safeUnlockId)
              if (added) {
                const unlockKey = `unlocks:${safeUnlockId}`
                const unlockLabel = tRef.current(unlockKey, {
                  defaultValue: safeUnlockId.toUpperCase()
                })
                addToast(
                  tRef.current('ui:unlocked', {
                    unlock:
                      typeof unlockLabel === 'string'
                        ? unlockLabel
                        : String(unlockLabel)
                  }),
                  'success'
                )
              }
            }
          }

          if (flags.gameOver) {
            const translatedDesc = description
              ? tRef.current(description, activeEventContext)
              : ''
            addToast(
              tRef.current('ui:game_over', { description: translatedDesc }),
              'error'
            )
            saveGame(false, previewState)
            changeScene(GAME_PHASES.GAMEOVER)
            setActiveEvent(null)
            return {
              outcomeText: outcomeText ?? '',
              description: description ?? '',
              result
            }
          }
        }

        if (currentState.activeEvent?.id) {
          dispatch(createAddCooldownAction(currentState.activeEvent.id))
        }

        if (outcomeText || description) {
          const msgOutcome = outcomeText
            ? tRef.current(outcomeText, activeEventContext)
            : ''
          const msgDesc = description
            ? tRef.current(description, activeEventContext)
            : ''

          const message =
            msgOutcome && msgDesc
              ? `${msgOutcome} ${msgDesc}`
              : msgOutcome || msgDesc
          addToast(
            typeof message === 'string' ? message : String(message),
            'info'
          )
        }

        setActiveEvent(null)
        return {
          outcomeText: outcomeText ?? '',
          description: description ?? '',
          result
        }
      } catch (error) {
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast(tRef.current('ui:event_error'), 'error')
        setActiveEvent(null)
        return {
          outcomeText: selectedChoice.outcomeText ?? '',
          description:
            typeof selectedChoice.description === 'string'
              ? tRef.current(selectedChoice.description)
              : '',
          result: null
        }
      }
    },
    [addToast, changeScene, dispatch, saveGame, setActiveEvent, stateRef, tRef]
  )

  return { setActiveEvent, triggerEvent, resolveEvent }
}
