import { type Dispatch, type MutableRefObject, useCallback } from 'react'
import type { TFunction } from 'i18next'
import { addUnlock } from '../utils/unlockManager'
import { eventEngine } from '../utils/eventEngine'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import {
  createPopPendingEventAction,
  createSetActiveEventAction,
  createUpdatePlayerAction
} from './actionCreators'
import { resolveEvent, type SideEffect } from '../domain/eventResolver'
import type { GameAction, GameState } from '../types'
import type { OptionalToastCallback } from '../types/callbacks'
import type { GamePhase } from '../types'

type ChangeScene = (scene: GamePhase) => void
type SaveGame = (showToast?: boolean, stateSnapshot?: GameState) => void

type UseEventSystemParams = {
  stateRef: MutableRefObject<GameState>
  dispatch: Dispatch<GameAction>
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
}

type SideEffectContext = {
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
}

function runSideEffects(effects: SideEffect[], ctx: SideEffectContext): void {
  const { addToast, changeScene, saveGame, tRef } = ctx
  const t = tRef.current
  const newlyAddedUnlocks = new Set<string>()

  for (const effect of effects) {
    switch (effect.type) {
      case 'persistUnlock': {
        if (addUnlock(effect.id)) {
          newlyAddedUnlocks.add(effect.id)
        }
        break
      }
      case 'unlockToast': {
        // This relies on `persistUnlock` for the same ID being processed first,
        // which is guaranteed by `resolveEvent`.
        if (newlyAddedUnlocks.has(effect.id)) {
          const unlockKey = `unlocks:${effect.id}`
          const unlockLabel = t(unlockKey, {
            defaultValue: effect.id.toUpperCase()
          })
          addToast(
            t('ui:unlocked', {
              unlock:
                typeof unlockLabel === 'string'
                  ? unlockLabel
                  : String(unlockLabel)
            }),
            'success'
          )
        }
        break
      }
      case 'outcomeToast': {
        if (!effect.outcomeKey && !effect.descriptionKey) {
          logger.warn(
            'EventSystem',
            'Skipping outcomeToast: both keys are empty',
            { effect, context: effect.context }
          )
          break
        }
        const msgOutcome = effect.outcomeKey
          ? t(effect.outcomeKey, effect.context)
          : ''
        const msgDesc = effect.descriptionKey
          ? t(effect.descriptionKey, effect.context)
          : ''
        const message =
          msgOutcome && msgDesc
            ? `${msgOutcome} ${msgDesc}`
            : msgOutcome || msgDesc
        if (message) {
          addToast(
            typeof message === 'string' ? message : String(message),
            'info'
          )
        }
        break
      }
      case 'gameOverToast': {
        const translatedDesc = effect.descriptionKey
          ? t(effect.descriptionKey, effect.context)
          : ''
        addToast(t('ui:game_over', { description: translatedDesc }), 'error')
        break
      }
      case 'changeScene': {
        changeScene(effect.scene)
        break
      }
      case 'saveGame': {
        saveGame(false, effect.state)
        break
      }
      default: {
        // Exhaustiveness check
        const _exhaustiveCheck: never = effect
        logger.warn('EventSystem', 'Unhandled side effect type', {
          effect: _exhaustiveCheck as unknown
        })
      }
    }
  }
}

/**
 * Builds event selection and resolution callbacks for the game state provider.
 *
 * @param params - Current state ref, dispatch, side-effect callbacks, save callback, and translator ref.
 * @returns Stable callbacks for setting, triggering, and resolving game events.
 */
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
      if (currentState.currentScene === GAME_PHASES.GIG) return false
      if ((currentState.player?.eventsTriggeredToday ?? 0) >= 2) return false

      const event = eventEngine.checkEvent(category, currentState, triggerPoint)
      if (!event) return false

      const processedEvent = eventEngine.processOptions(event, currentState)
      if (!processedEvent) return false

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
    },
    [dispatch, setActiveEvent, stateRef]
  )

  const resolveEventCallback = useCallback(
    (
      choice: Record<string, unknown> | null
    ): { outcomeText: string; description: string; result: unknown } => {
      try {
        const resolution = resolveEvent(choice, stateRef.current)
        resolution.actions.forEach(dispatch)
        runSideEffects(resolution.sideEffects, {
          addToast,
          changeScene,
          saveGame,
          tRef
        })
        return {
          outcomeText: resolution.outcomeText,
          description: resolution.description,
          result: resolution.result
        }
      } catch (error) {
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast(tRef.current('ui:event_error'), 'error')
        dispatch(createSetActiveEventAction(null))
        return {
          outcomeText:
            typeof choice?.outcomeText === 'string' ? choice.outcomeText : '',
          description:
            typeof choice?.description === 'string' ? choice.description : '',
          result: null
        }
      }
    },
    [addToast, changeScene, dispatch, saveGame, stateRef, tRef]
  )

  return { setActiveEvent, triggerEvent, resolveEvent: resolveEventCallback }
}
